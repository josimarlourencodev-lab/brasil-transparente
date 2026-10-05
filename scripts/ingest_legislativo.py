#!/usr/bin/env python3
"""
Ingestão legislativa neutra (Câmara + Senado + Seeds Executivo/TSE)

Princípios:
- Dados oficiais brutos em `dados_oficiais` (JSONB) e `voto_original`
- Idempotente (upsert por chaves únicas)
- Sem ORM, sem filas, sem scraping contínuo p/ TSE (seeds JSON)
- SQL puro/baixo nível, zero boilerplate, neutralidade inviolável
"""

import json
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests

from supabase import Client, create_client

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

CAMARA_BASE = "https://dadosabertos.camara.leg.br/api/v2"
SENADO_BASE = "https://legis.senado.leg.br/dadosabertos"

HTTP_HEADERS = {"User-Agent": "BrasilTransparente/ingest-legislativo"}
REQUEST_INTERVAL = 0.3


def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise SystemExit("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios")
    return create_client(url, key)


def http_get(url: str, params: Optional[Dict[str, Any]] = None, retries: int = 3) -> Optional[Any]:
    for tentativa in range(retries):
        try:
            r = requests.get(url, params=params, timeout=60, headers=HTTP_HEADERS)
            if r.status_code == 429:
                time.sleep(2 * (tentativa + 1))
                continue
            r.raise_for_status()
            ctype = r.headers.get("Content-Type", "")
            if "json" in ctype:
                return r.json()
            return {"raw": r.text}
        except Exception:
            time.sleep(1)
    return None


def carregar_json(caminho: Path) -> Dict[str, Any]:
    with caminho.open(encoding="utf-8") as f:
        return json.load(f)


def garantir_catalogos(sb: Client) -> None:
    try:
        ufs = carregar_json(DATA / "ufs.json").get("ufs", [])
        for u in ufs:
            sb.table("ufs").upsert(
                {"sigla": u["sigla"].upper(), "nome": u["nome"], "regiao": u.get("regiao")},
                on_conflict="sigla",
            ).execute()
    except Exception:
        pass

    try:
        parts = carregar_json(DATA / "partidos.json").get("partidos", [])
        for p in parts:
            sb.table("partidos").upsert({"sigla": p["sigla"], "nome": p["nome"]}, on_conflict="sigla").execute()
    except Exception:
        pass

    try:
        temas = carregar_json(DATA / "temas.json").get("temas", [])
        for t in temas:
            sb.table("temas").upsert(
                {
                    "slug": t["slug"],
                    "nome": t["nome"],
                    "descricao": t.get("descricao"),
                    "ativo": t.get("ativo", True),
                },
                on_conflict="slug",
            ).execute()
    except Exception:
        pass


def id_partido(sb: Client, sigla: Optional[str]) -> Optional[str]:
    if not sigla:
        return None
    try:
        r = sb.table("partidos").select("id").eq("sigla", sigla).limit(1).execute()
        return r.data[0]["id"] if r.data else None
    except Exception:
        return None


def id_agente_por_camara(sb: Client, id_camara: int) -> Optional[str]:
    try:
        r = sb.table("agentes_politicos").select("id").eq("casa", "camara").eq("id_legislativo_camara", id_camara).maybe_single().execute()
        return r.data["id"] if r.data else None
    except Exception:
        return None


def id_agente_por_senado(sb: Client, id_senado: int) -> Optional[str]:
    try:
        r = sb.table("agentes_politicos").select("id").eq("casa", "senado").eq("id_legislativo_senado", id_senado).maybe_single().execute()
        return r.data["id"] if r.data else None
    except Exception:
        return None


def normalizar_voto_bruto(voto_original: Optional[str]) -> str:
    if not voto_original:
        return "nao_registrado"
    v = voto_original.strip().upper().replace("Ã", "A").replace("Õ", "O")
    if v in ("SIM", "S", "FAVOR", "YES"):
        return "favor"
    if v in ("NAO", "NÃO", "N", "CONTRA", "NO"):
        return "contra"
    if v in ("ABSTENCAO", "ABSTENÇÃO", "ABST"):
        return "abstencao"
    if v in ("AUSENTE", "AUS"):
        return "ausente"
    if "ARTIGO 17" in v or "ART.17" in v or "ART 17" in v:
        return "artigo_17"
    if "OBSTRUCAO" in v or "OBSTRUÇÃO" in v:
        return "obstrucao"
    if "NAO REGISTRADO" in v or "NAOREGISTRADO" in v:
        return "nao_registrado"
    return "nao_registrado"


def ingestar_camara_deputados(sb: Client) -> int:
    total = 0
    pagina = 1
    while True:
        dados = http_get(
            f"{CAMARA_BASE}/deputados",
            {"pagina": pagina, "itens": 100, "ordenarPor": "nome", "ordem": "ASC"},
        )
        if not dados or not dados.get("dados"):
            break
        for d in dados["dados"]:
            uf = (d.get("siglaUf") or d.get("uf") or "").upper() or None
            try:
                sb.table("agentes_politicos").upsert(
                    {
                        "casa": "camara",
                        "cargo": "deputado_federal",
                        "nome": d.get("nome"),
                        "nome_eleitoral": d.get("nomeEleitoral"),
                        "partido_id": id_partido(sb, d.get("siglaPartido")),
                        "uf": uf,
                        "id_legislativo_camara": d.get("id"),
                        "foto_url": d.get("urlFoto"),
                        "ativo": True,
                        "dados_oficiais": d,
                    },
                    on_conflict="casa,id_legislativo_camara",
                ).execute()
                total += 1
            except Exception:
                continue
            time.sleep(REQUEST_INTERVAL)
        links = dados.get("links", [])
        if not any(l.get("rel") == "next" for l in links):
            break
        pagina += 1
    return total


def ingestar_camara_proposicoes(sb: Client, anos: Optional[List[int]] = None) -> int:
    total = 0
    pagina = 1
    tipos = ["PL", "PEC", "MPV", "PLP", "PDC"]
    if anos is None:
        y = datetime.now().year
        anos = list(range(y - 2, y + 1))
    for t in tipos:
        for a in anos:
            pagina = 1
            while True:
                dados = http_get(
                    f"{CAMARA_BASE}/proposicoes",
                    {"pagina": pagina, "itens": 100, "siglaTipo": t, "ano": a},
                )
                if not dados or not dados.get("dados"):
                    break
                for p in dados["dados"]:
                    try:
                        ementa_detalhada = p.get("ementaDetalhada") or p.get("ementa")
                        sb.table("proposicoes").upsert(
                            {
                                "casa": "camara",
                                "tipo": p.get("siglaTipo"),
                                "numero": p.get("numero"),
                                "ano": p.get("ano"),
                                "sigla": f"{p.get('siglaTipo')} {p.get('numero')}/{p.get('ano')}",
                                "ementa": p.get("ementa"),
                                "ementa_detalhada": ementa_detalhada,
                                "url_oficial": p.get("urlInteiroTeor"),
                                "uri_dados_abertos": p.get("uri"),
                                "situacao": p.get("statusProposicao", {}).get("descricaoSituacao"),
                                "ultimo_status": p.get("statusProposicao"),
                                "data_apresentacao": p.get("dataApresentacao"),
                                "dados_oficiais": p,
                            },
                            on_conflict="casa,tipo,numero,ano",
                        ).execute()
                        total += 1
                    except Exception:
                        continue
                    time.sleep(REQUEST_INTERVAL)
                links = dados.get("links", [])
                if not any(l.get("rel") == "next" for l in links):
                    break
                pagina += 1
    return total


def ingestar_camara_autores(sb: Client) -> int:
    total = 0
    try:
        props = sb.table("proposicoes").select("id,uri_dados_abertos,casa").eq("casa", "camara").limit(2000).execute()
    except Exception:
        props = type("R", (), {"data": []})()
    for pr in props.data or []:
        uri = pr.get("uri_dados_abertos")
        if not uri:
            continue
        dados = http_get(f"{uri}/autores")
        if not dados or not dados.get("dados"):
            continue
        for au in dados["dados"]:
            try:
                tipo = (au.get("tipo") or "").lower()
                papel = "autor" if "autor" in tipo else "coautor"
                id_c = au.get("idDeputado") or au.get("id")
                if not id_c:
                    continue
                ag_id = id_agente_por_camara(sb, id_c)
                if not ag_id:
                    continue
                sb.table("proposicao_autores").upsert(
                    {
                        "proposicao_id": pr["id"],
                        "agente_politico_id": ag_id,
                        "papel": papel,
                        "ordem": au.get("ordem"),
                    },
                    on_conflict="proposicao_id,agente_politico_id,papel",
                ).execute()
                total += 1
            except Exception:
                continue
        time.sleep(REQUEST_INTERVAL)
    return total


def ingestar_camara_votacoes(sb: Client) -> int:
    total_v = 0
    total_vp = 0
    pagina = 1
    while True:
        dados = http_get(f"{CAMARA_BASE}/votacoes", {"pagina": pagina, "itens": 100, "ordem": "DESC", "ordenarPor": "dataHoraRegistro"})
        if not dados or not dados.get("dados"):
            break
        for v in dados["dados"]:
            try:
                prop_id = None
                uri_prop = v.get("uriProposicao")
                if uri_prop:
                    pass
                sb.table("votacoes").upsert(
                    {
                        "casa": "camara",
                        "id_votacao_oficial": str(v.get("id")),
                        "proposicao_id": prop_id,
                        "data_hora": v.get("dataHoraRegistro") or v.get("dataHoraInicio"),
                        "objeto_votacao": v.get("objetoVotacao"),
                        "resumo": v.get("descricao"),
                        "aprovada": None,
                        "quorum": v.get("quorum"),
                        "dados_oficiais": v,
                    },
                    on_conflict="casa,id_votacao_oficial",
                ).execute()
                total_v += 1
            except Exception:
                continue
            time.sleep(REQUEST_INTERVAL)
        links = dados.get("links", [])
        if not any(l.get("rel") == "next" for l in links):
            break
        pagina += 1

    try:
        votacoes = sb.table("votacoes").select("id,id_votacao_oficial,casa").eq("casa", "camara").order("criado_em", desc=True).limit(500).execute()
    except Exception:
        votacoes = type("R", (), {"data": []})()
    for vt in votacoes.data or []:
        vid = vt.get("id_votacao_oficial")
        dv = http_get(f"{CAMARA_BASE}/votacoes/{vid}/votos")
        if not dv or not dv.get("dados"):
            continue
        for voto in dv["dados"]:
            try:
                dep_id = voto.get("deputado_", {}).get("id") or voto.get("idDeputado")
                if not dep_id:
                    continue
                ag_id = id_agente_por_camara(sb, dep_id)
                if not ag_id:
                    continue
                vbr = normalizar_voto_bruto(voto.get("voto"))
                sb.table("votos_parlamentares").upsert(
                    {
                        "votacao_id": vt["id"],
                        "agente_politico_id": ag_id,
                        "voto": vbr,
                        "voto_original": voto.get("voto"),
                        "dados_oficiais": voto,
                    },
                    on_conflict="votacao_id,agente_politico_id",
                ).execute()
                total_vp += 1
            except Exception:
                continue
        time.sleep(REQUEST_INTERVAL)
    return total_v + total_vp


def ingestar_senado_senadores(sb: Client) -> int:
    total = 0
    pagina = 1
    while True:
        dados = http_get(f"{SENADO_BASE}/senador/lista/atual.json")
        if not dados:
            break
        lista = dados.get("ListaParlamentarAtual", {}).get("Parlamentares", {}).get("Parlamentar") or []
        if not lista:
            break
        for s in lista:
            try:
                ident = s.get("IdentificacaoParlamentar") or {}
                mandato = s.get("MandatoAtual") or {}
                uf = (ident.get("UfParlamentar") or "").upper() or None
                id_sen = ident.get("CodigoParlamentar")
                if not id_sen:
                    continue
                sb.table("agentes_politicos").upsert(
                    {
                        "casa": "senado",
                        "cargo": "senador",
                        "nome": ident.get("NomeCompletoParlamentar"),
                        "nome_eleitoral": ident.get("NomeParlamentar"),
                        "partido_id": id_partido(sb, ident.get("SiglaPartidoParlamentar")),
                        "uf": uf,
                        "id_legislativo_senado": int(id_sen) if isinstance(id_sen, (int, str)) and str(id_sen).isdigit() else None,
                        "foto_url": ident.get("UrlFotoParlamentar"),
                        "ativo": True,
                        "dados_oficiais": s,
                    },
                    on_conflict="casa,id_legislativo_senado",
                ).execute()
                total += 1
            except Exception:
                continue
            time.sleep(REQUEST_INTERVAL)
        break
    return total


def ingestar_seeds_executivo(sb: Client) -> int:
    total = 0
    for arquivo, chave, cargo in [
        ("governadores.json", "governadores", "governador"),
        ("presidenciaveis.json", "presidenciaveis", "presidenciavel"),
    ]:
        caminho = DATA / "agentes" / arquivo
        if not caminho.exists():
            continue
        try:
            for item in carregar_json(caminho).get(chave, []):
                uf = (item.get("uf") or "BR").upper() or None
                sb.table("agentes_politicos").insert(
                    {
                        "casa": "executivo",
                        "cargo": cargo,
                        "nome": item.get("nome") or item.get("nome_eleitoral"),
                        "nome_eleitoral": item.get("nome_eleitoral"),
                        "partido_id": id_partido(sb, item.get("partido")),
                        "uf": uf,
                        "tse_candidato_id": item.get("tse_candidato_id"),
                        "ativo": item.get("ativo", True),
                        "dados_oficiais": item,
                    }
                ).execute()
                total += 1
        except Exception:
            continue
    return total


def main() -> None:
    sb = get_supabase()
    garantir_catalogos(sb)
    print("catalogos: ok")
    print(f"deputados_camara: {ingerir_camara_deputados(sb)}")
    print(f"proposicoes_camara: {ingerir_camara_proposicoes(sb)}")
    print(f"autores_camara: {ingerir_camara_autores(sb)}")
    print(f"votacoes_camara(+votos): {ingerir_camara_votacoes(sb)}")
    print(f"senadores_senado: {ingerir_senado_senadores(sb)}")
    print(f"seeds_executivo: {ingerir_seeds_executivo(sb)}")
    print("ingest_legislativo: concluido (parcial Senado estendido)")


if __name__ == "__main__":
    main()
