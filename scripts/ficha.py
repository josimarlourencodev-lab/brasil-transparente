"""Síntese neutra da ficha de cada político monitorado.

Para cada político ativo, lê as notícias associadas e usa o LLM para extrair,
SOMENTE a partir das fontes, os casos documentados (investigação, processo,
denúncia, condenação, contradição etc.) registrando-os na tabela estruturada
`ficha_politico`.

O LLM NUNCA opina nem condena: reproduz o que as fontes relatam e marca o
status real da instância (em andamento, arquivado, condenado, absolvido) apenas
quando as fontes assim informam. O modelo é isento de adjetivos valorativos
(não usa "corrupto", "escândalo" etc.).

Fluxo:
  1. Lista os políticos ativos.
  2. Para cada um, busca as notícias publicadas relacionadas (por politico_id
     ou menção do nome nos termos de busca).
  3. Chama o LLM dedicado (padrão openai/gpt-oss-120b) pedindo JSON estruturado
     com os casos documentados.
  4. Substitui a ficha do político na tabela `ficha_politico` (upsert por
     político — apaga a anterior e insere a nova; idempotente).

Variáveis usadas:
  NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY  (escrita no banco)
  LLM_API_KEY                  (chave da Groq — mesma chave do site)
  FICHA_LLM_MODEL              (padrão: openai/gpt-oss-120b — cota isolada da
                                síntese diária, como o podcast)

Modo de uso:
  python scripts/ficha.py                        # todos os políticos
  python scripts/ficha.py --politico-id 5        # apenas um político
  python scripts/ficha.py --dry-run              # não grava no banco
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import time
import unicodedata

import requests

from synthesizer import _call

MODELO_PADRAO = "openai/gpt-oss-120b"
TIMEOUT_SECONDS = 120

TIPOS_VALIDOS = {
    "processo", "investigacao", "denuncia", "condenacao",
    "inelegibilidade", "cassacao", "contradicao", "outro",
}
STATUS_VALIDOS = {
    "em_andamento", "arquivado", "condenado", "absolvido", "sem_informacao",
}

FICHA_SYSTEM = """Você é o módulo de ficha do Brasil Transparente, um portal neutro e \
independente de monitoramento político brasileiro.

Tarefa: a partir das notícias fornecidas (que citam o político), levante os casos \
documentados relacionados a ele — investigações, processos, denúncias, condenações, \
inelegibilidade, cassação de mandato e contradições entre afirmações passadas e atuais.

Regras obrigatórias:
1) Use APENAS o que está nas notícias fornecidas. Não invente fatos, instâncias, datas \
ou desfechos.
2) Não emita julgamento, opinião, elogio ou condenação moral. Nunca use as palavras \
\"corrupto\", \"escândalo\", \"reprovável\" nem adjetivos valorativos.
3) Não generalize: um caso só é \"condenação\" se a fonte informar explicitamente \
condenação; caso contrário use \"processo\" ou \"investigacao\" com descrição factual.
4) O status do caso deve ser o informado pela fonte (em_andamento/arquivado/condenado/\
absolvido). Se a fonte não informa, use \"sem_informacao\".
5) Se não houver nenhum caso documentado nas notícias fornecidas, retorne \"casos\": [].
6) Cite em \"orgao\" o órgão citado na fonte (ex.: STF, TSE, MP) apenas quando nomeado; \
senão deixe nulo.
7) Em \"fontes\", liste as URLs das notícias usadas para cada caso.
8) Retorne SOMENTE JSON válido com este esquema:
{
  \"casos\": [
    {
      \"tipo\": \"processo\" | \"investigacao\" | \"denuncia\" | \"condenacao\" | \
\"inelegibilidade\" | \"cassacao\" | \"contradicao\" | \"outro\",
      \"status\": \"em_andamento\" | \"arquivado\" | \"condenado\" | \"absolvido\" | \
\"sem_informacao\",
      \"titulo\": \"Resumo curto do caso (máx. 120 caracteres)\",
      \"descricao\": \"Descrição factual, objetiva, sem juízo de valor\",
      \"orgao\": \"Nome do órgão ou null\",
      \"data_fato\": \"AAAA-MM-DD ou null\",
      \"fontes\": [\"url1\", \"url2\"]
    }
  ]
}"""


def _env(name: str, default: str | None = None) -> str | None:
    return os.environ.get(name, "").strip() or default


def _build_client():
    from supabase import create_client

    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError(
            "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias."
        )
    return create_client(url, key)


def _modelo_atual() -> str:
    return _env("FICHA_LLM_MODEL", MODELO_PADRAO) or MODELO_PADRAO


def _carregar_politicos(client) -> list[dict]:
    resp = (
        client.table("politicos")
        .select("id, nome, partido, cargo, termos_busca, ativo")
        .eq("ativo", True)
        .order("nome", desc=False)
        .execute()
    )
    if getattr(resp, "error", None):
        raise RuntimeError(f"erro ao listar políticos: {resp.error}")
    return resp.data or []


def _sem_acento(texto: str) -> str:
    """Normaliza o texto removendo acentos (para busca case/accent-insensitive)."""
    return "".join(
        c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn"
    )


def _todas_noticias(client) -> list[dict]:
    """Carrega as notícias publicadas mais recentes (uma consulta única)."""
    resp = (
        client.table("noticias")
        .select("id, titulo, url, resumo, categoria, tipo_fonte, publicado_em, "
                "contradicao_detectada, contradicao_descricao, status, politico_id")
        .eq("status", "publicado")
        .order("publicado_em", desc=True)
        .limit(2000)
        .execute()
    )
    if getattr(resp, "error", None):
        return []
    return list(resp.data or [])


def _noticias_do_politico(noticias: list[dict], politico: dict,
                          limite: int = 8) -> list[dict]:
    """Filtra o snapshot por politico_id ou por termos de busca do político.

    Compara sem acentos (cobrindo variações como "marcal" x "Marçal") — o ILIKE
    do PostgREST é sensível a acento e não depende da janela de publicações.
    """
    termos = [t for t in (politico.get("termos_busca") or []) if t.strip()]
    if not termos:
        termos = [politico.get("nome") or ""]
    alvos = [_sem_acento(t).lower() for t in termos[:4]]

    selecionadas = []
    for n in noticias:
        if n.get("politico_id") == politico["id"]:
            selecionadas.append(n)
        elif any(
            t in _sem_acento(n.get("titulo") or "").lower()
            or t in _sem_acento(n.get("resumo") or "").lower()
            for t in alvos
        ):
            selecionadas.append(n)
        if len(selecionadas) >= limite:
            break
    return selecionadas[:limite]


def _montar_prompt(politico: dict, noticias: list[dict]) -> str:
    contexto = {
        "politico": {
            "nome": politico.get("nome"),
            "partido": politico.get("partido"),
            "cargo": politico.get("cargo"),
        },
        "noticias": [],
    }
    for n in noticias:
        contexto["noticias"].append(
            {
                "id": n.get("id"),
                "titulo": n.get("titulo"),
                "resumo": (n.get("resumo") or "")[:400],
                "categoria": n.get("categoria"),
                "tipo_fonte": n.get("tipo_fonte"),
                "publicado_em": n.get("publicado_em"),
                "contradicao": n.get("contradicao_descricao") if n.get("contradicao_detectada") else None,
                "url": n.get("url"),
            }
        )
    return (
        "Analise as notícias abaixo citando o político e devolva o JSON descrito no "
        "prompt de sistema. Retorne SOMENTE o JSON.\n\n"
        + json.dumps(contexto, ensure_ascii=False)
    )


def _limpar_casos(casos: list) -> list[dict]:
    """Garante que cada caso esteja dentro do esquema aceito pelo banco."""
    limpos = []
    for c in casos or []:
        if not isinstance(c, dict):
            continue
        tipo = (c.get("tipo") or "outro").strip()
        if tipo not in TIPOS_VALIDOS:
            tipo = "outro"
        status = (c.get("status") or "sem_informacao").strip()
        if status not in STATUS_VALIDOS:
            status = "sem_informacao"
        titulo = (c.get("titulo") or "").strip()
        if not titulo:
            continue
        limpos.append(
            {
                "tipo": tipo,
                "status": status,
                "titulo": titulo[:120],
                "descricao": (c.get("descricao") or "").strip() or None,
                "orgao": (c.get("orgao") or "").strip() or None,
                "data_fato": (c.get("data_fato") or "").strip() or None,
                "fontes": [
                    u for u in (c.get("fontes") or [])
                    if isinstance(u, str) and u.strip().startswith(("http://", "https://"))
                ],
            }
        )
    return limpos


def _sintetizar_ficha(politico: dict, noticias: list[dict]) -> list[dict]:
    if not _env("LLM_API_KEY"):
        print(f"[ficha] sem LLM_API_KEY — ficha de {politico['nome']} não gerada")
        return []
    try:
        resultado = _call(
            "groq",
            _montar_prompt(politico, noticias),
            FICHA_SYSTEM,
            max_tokens=6000,
            model=_modelo_atual(),
        )
    except requests.RequestException:
        resultado = None
    if not resultado:
        print(f"[ficha] falha do LLM para {politico['nome']} — mantendo ficha anterior")
        return None  # sinaliza falha: não apaga a ficha existente
    return _limpar_casos(resultado.get("casos") or [])


def _gravar_ficha(client, politico_id: int, casos: list[dict]) -> bool:
    """Apaga a ficha anterior do político e insere a nova (idempotente)."""
    if casos is None:
        return False
    client.table("ficha_politico").delete().eq("politico_id", politico_id).execute()
    if not casos:
        return True
    registros = []
    agora = dt.datetime.now(dt.timezone.utc).isoformat()
    for c in casos:
        registros.append(
            {
                "politico_id": politico_id,
                "tipo": c["tipo"],
                "status": c["status"],
                "titulo": c["titulo"],
                "descricao": c["descricao"],
                "orgao": c["orgao"],
                "data_fato": c["data_fato"],
                "fontes": c["fontes"],
                "criado_em": agora,
                "atualizado_em": agora,
            }
        )
    resp = client.table("ficha_politico").insert(registros).execute()
    if getattr(resp, "error", None):
        print(f"[ficha] erro ao gravar {len(registros)} casos: {resp.error}")
        return False
    return True


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--politico-id", type=int, action="append", default=None,
                        help="sintetiza apenas políticos específicos (pode repetir)")
    parser.add_argument("--noticias-json", metavar="ARQUIVO",
                        help="JSON com notícias de um político (fixture p/ dry-run)")
    parser.add_argument("--dry-run", action="store_true",
                        help="não grava no banco")
    args = parser.parse_args(argv)

    client = None
    if not args.dry_run or not args.noticias_json:
        client = _build_client()

    noticias_fixture: list[dict] | None = None
    politicos = []
    if args.politico_id:
        if args.noticias_json:
            with open(args.noticias_json, encoding="utf-8") as fp:
                noticias_fixture = json.load(fp)
            politicos = [{"id": pid, "nome": "FIXTURE", "partido": None,
                          "cargo": None} for pid in args.politico_id]
        else:
            for pid in args.politico_id:
                resp = client.table("politicos").select("*").eq("id", pid).single().execute()
                if getattr(resp, "error", None) or not resp.data:
                    print(f"[ficha] político {pid} não encontrado")
                    continue
                politicos.append(resp.data)
        if not politicos:
            return 1
    else:
        if args.noticias_json:
            print("[ficha] --noticias-json exige --politico-id")
            return 2
        politicos = _carregar_politicos(client)

    snapshot = [] if noticias_fixture is not None else _todas_noticias(client)
    for idx, politico in enumerate(politicos, start=1):
        nome = politico.get("nome") or str(politico.get("id"))
        if noticias_fixture is not None:
            noticias = noticias_fixture
        else:
            noticias = _noticias_do_politico(snapshot, politico)
        print(f"[ficha] ({idx}/{len(politicos)}) {nome} — {len(noticias)} notícias")
        casos = _sintetizar_ficha(politico, noticias)
        if casos is None:
            print(f"[ficha] {nome}: falha do LLM, ficha anterior preservada")
            continue
        print(f"[ficha] {nome}: {len(casos)} caso(s) documentado(s)")
        for c in casos:
            print(f"  · [{c['status']}] ({c['tipo']}) {c['titulo']}")
        if not args.dry_run:
            if _gravar_ficha(client, politico["id"], casos):
                print(f"[ficha] {nome}: ficha gravada")
            else:
                print(f"[ficha] {nome}: erro ao gravar")
        if idx < len(politicos):
            time.sleep(1)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())