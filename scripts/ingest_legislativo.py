#!/usr/bin/env python3
"""
Ingestão legislativa neutra: Câmara dos Deputados + seeds estáticos (Executivo/TSE).

Princípios do projeto:
- Dados oficiais brutos preservados em `dados_oficiais` (JSONB) e `voto_original`
- Idempotente (upsert por chaves únicas)
- Sem ORM, sem filas, sem scraping contínuo para TSE (usa seeds JSON)
"""

import json
import os
import time
from pathlib import Path
from typing import Any, Dict, Optional

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
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
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
            return r.json()
        except Exception:
            time.sleep(1)
    return None


def carregar_json(caminho: Path) -> Dict[str, Any]:
    with caminho.open(encoding="utf-8") as f:
        return json.load(f)


def garantir_catalogos(sb: Client) -> None:
    for u in carregar_json(DATA / "ufs.json")["ufs"]:
        sb.table("ufs").upsert(
            {"sigla": u["sigla"], "nome": u["nome"], "regiao": u.get("regiao")},
            on_conflict="sigla",
        ).execute()

    for p in carregar_json(DATA / "partidos.json")["partidos"]:
        sb.table("partidos").upsert({"sigla": p["sigla"], "nome": p["nome"]}, on_conflict="sigla").execute()

    for t in carregar_json(DATA / "temas.json")["temas"]:
        sb.table("temas").upsert(
            {
                "slug": t["slug"],
                "nome": t["nome"],
                "descricao": t.get("descricao"),
                "ativo": t.get("ativo", True),
            },
            on_conflict="slug",
        ).execute()


def id_partido(sb: Client, sigla: Optional[str]) -> Optional[str]:
    if not sigla:
        return None
    r = sb.table("partidos").select("id").eq("sigla", sigla).limit(1).execute()
    return r.data[0]["id"] if r.data else None


def ingestar_deputados(sb: Client) -> int:
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

        if not any(link.get("rel") == "next" for link in dados.get("links", [])):
            break
        pagina += 1
    return total


def ingestar_seeds_executivo(sb: Client) -> int:
    total = 0
    mapa = [
        ("governadores.json", "governadores", "governador"),
        ("presidenciaveis.json", "presidenciaveis", "presidenciavel"),
    ]
    for arquivo, chave, cargo in mapa:
        caminho = DATA / "agentes" / arquivo
        if not caminho.exists():
            continue
        for item in carregar_json(caminho).get(chave, []):
            uf = (item.get("uf") or "BR").upper()
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
    return total


def main() -> None:
    sb = get_supabase()
    garantir_catalogos(sb)
    print("catalogos: ok")
    print(f"deputados_camara: {ingerir_deputados(sb)}")
    print(f"seeds_executivo: {ingerir_seeds_executivo(sb)}")
    print("ingest_legislativo: etapa base concluida")


if __name__ == "__main__":
    main()
