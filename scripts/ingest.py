#!/usr/bin/env python3
"""Pipeline de ingestão do Brasil Transparente.

Etapas:  carregar fontes → raspagem (RSS/Atom) → deduplicação →
         sanitização → classificação por tipo de fonte → síntese neutra por IA
         (com correlação com histórico de políticas) → persistência no Supabase.

Uso:
    python3 scripts/ingest.py                  # execução normal
    python3 scripts/ingest.py --dry-run        # somente rastreio, sem gravar
    python3 scripts/ingest.py --limit 10       # limita itens por execução
    python3 scripts/ingest.py --sources oficiais,imprensa
"""

from __future__ import annotations

import argparse
import os
import sys
import time
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

from crawlers import fetch_many, dedupe
from crawlers.registro import SOURCE_CATEGORIES, load_sources, politico_search_urls
from sanitize import sanitize_item, is_safe
from synthesizer import synthesize_item


def load_env():
    """Carrega variáveis de ambiente de .env.local quando presente."""
    env_path = Path(__file__).resolve().parent.parent / ".env.local"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                os.environ.setdefault(key.strip(), value.strip())


def build_client():
    from supabase import create_client

    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.")
    return create_client(url, key)


def _normalize_nome(nome: str) -> str:
    """Minúsculas, sem acentos e sem espaços extra — para casar apelidos do LLM
    ("Lula", "Flávio Bolsonaro") com termos de busca cadastrados ("lula", "flavio bolsonaro")."""
    nf = unicodedata.normalize("NFD", nome or "")
    sem_acento = "".join(c for c in nf if unicodedata.category(c) != "Mn")
    return " ".join(sem_acento.lower().split())


def list_active_politicos(client, cache: dict[str, int]):
    """Carrega políticos ativos e preenche cache nome→id, casando tanto o nome
    completo quanto os termos_busca (apelidos) cadastrados, normalizados."""
    try:
        resp = client.table("politicos").select("id,nome,termos_busca").eq("ativo", True).execute()
        for row in resp.data or []:
            pid = row["id"]
            cache[_normalize_nome(row["nome"])] = pid
            for termo in row.get("termos_busca") or []:
                cache[_normalize_nome(termo)] = pid
    except Exception:
        pass


def historico_de(client, politico_id: int) -> list[dict]:
    if not client:
        return []
    try:
        resp = (
            client.table("historico")
            .select("titulo,descricao,data_fato")
            .eq("politico_id", politico_id)
            .limit(5)
            .execute()
        )
        return resp.data or []
    except Exception:
        return []


def sort_items(items: list[dict]) -> list[dict]:
    """Itens serão gravados em ordem cronológica reversa (mais recentes primeiro)."""
    def _key(i):
        ts = i.get("publicado_em")
        return ts if ts else "0000-01-01T00:00:00"
    return sorted(items, key=_key, reverse=True)


def resolve_politico_id(item: dict, politico_cache: dict[str, int]) -> int | None:
    """Resolve o id do político principal citado no item (primeiro casado)."""
    for name in item.get("envolvidos", []):
        pid = politico_cache.get(_normalize_nome(name))
        if pid:
            return pid
    return None


def upsert_items(client, items: list[dict], politico_cache: dict[str, int] | None = None) -> int:
    politico_cache = politico_cache or {}
    saved = 0
    for item in items:
        if not item.get("relevante", True):
            print(f"  - ignorada (fora do tema): {item.get('titulo', '')[:70]}")
            continue
        data = {
            "titulo": item["titulo"],
            "url": item["url"],
            "url_fonte": item.get("url"),
            "imagem_url": item.get("imagem_url") or "",
            "resumo": item.get("resumo", ""),
            "categoria": item.get("categoria", "Outros"),
            "tipo_fonte": item.get("tipo_fonte", "imprensa"),
            "publicado_em": item.get("publicado_em"),
            "coletado_em": datetime.now(timezone.utc).isoformat(),
            "status": "publicado",
            "contradicao_detectada": bool(item.get("contradicao_detectada")),
            "contradicao_descricao": item.get("contradicao_descricao") or "",
            "politico_id": resolve_politico_id(item, politico_cache),
            "metadata": {
                "envolvidos": item.get("envolvidos", []),
                "contradicao_referencias": item.get("contradicao_referencias", []),
                "status_sintese": item.get("status_sintese"),
            },
        }
        try:
            resp = client.table("noticias").upsert(data, on_conflict="url").execute()
            if resp.data:
                saved += 1
        except Exception as exc:
            print(f"ERRO ao gravar {item['url']}: {exc}")
    return saved


def main(argv=None) -> int:
    load_env()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="não grava no banco")
    parser.add_argument("--limit", type=int, default=0, help="limite de itens processados")
    parser.add_argument("--sources", default="", help="categorias separadas por vírgula")
    args = parser.parse_args(argv)

    sources = load_sources()
    cats = [c for c in args.sources.split(",") if c] or SOURCE_CATEGORIES

    if args.dry_run:
        print("[dry-run] Nenhum dado será gravado no banco.")
        client = None
    else:
        try:
            client = build_client()
        except RuntimeError as exc:
            print(f"[aviso] sem persistência: {exc}")
            client = None

    # Coleta dirigida por político (Google News RSS por termo): garante que cada
    # candidato cadastrado tenha notícias na cobertura, mesmo sem feed dedicado.
    politico_rows: list[dict] = []
    if client:
        try:
            politico_rows = (
                client.table("politicos")
                .select("id,nome,termos_busca")
                .eq("ativo", True)
                .execute()
                .data
                or []
            )
        except Exception as exc:
            print(f"[aviso] sem políticos para busca dirigida: {exc}")
    if politico_rows and "politicos" in cats:
        sources.by_category["politicos"] = politico_search_urls(politico_rows)

    urls = [u for c in cats for u in sources.by_category.get(c, [])]
    if not urls:
        print("Nenhum feed configurado. Veja scripts/feeds.json.")
        return 0

    raw = fetch_many(urls)
    items = dedupe(raw)

    cleaned: list[dict] = []
    for item in items:
        safe = sanitize_item(item)
        feed = item.get("_url_feed", "")
        cat = sources.category_of(feed_url=feed)
        safe["tipo_fonte"] = {
            "oficiais": "oficial",
            "independentes": "oposicao",
            "imprensa": "imprensa",
            "politicos": "imprensa",
        }.get(cat, "imprensa")
        safe.setdefault("categoria", "Outros")
        if is_safe(safe):
            cleaned.append(safe)

    print(f"Coletados {len(cleaned)} itens limpos após sanitização.")


    politico_cache: dict[str, int] = {}
    if client:
        list_active_politicos(client, politico_cache)

    # Prioriza a síntese das notícias dirigidas por político (Google News por
    # termo): são as que alimentam a associação politico_id, até o limite por
    # execução. As demais categorias entram em seguida, na ordem de chegada.
    if os.environ.get("LLM_API_KEY"):
        orde = list(enumerate(cleaned))
        orde.sort(
            key=lambda t: (
                0 if sources.category_of(feed_url=t[1].get("_url_feed", "")) == "politicos" else 1,
                t[0],
            )
        )
        ordered_cleaned = [item for _, item in orde]
    else:
        ordered_cleaned = cleaned

    synthesized = 0
    max_syntheses = int(os.environ.get("MAX_SYNTHESIS_PER_RUN", "80"))

    if os.environ.get("LLM_API_KEY"):
        for item in ordered_cleaned:
            if synthesized >= max_syntheses:
                print(f"[throttle] limite de {max_syntheses} sínteses por execução atingido.")
                break
            historico = []
            for name in item.get("envolvidos", []):
                pid = politico_cache.get(_normalize_nome(name))
                if pid:
                    historico = historico_de(client, pid) if client else []
            if item.get("status_sintese") != "ok":
                synthesize_item(item, historico)
                synthesized += 1
                if synthesized % 10 == 0:
                    print(f"[throttle] {synthesized} sínteses feitas — pausa 5s para respeitar rate limit...")
                    time.sleep(5)
                else:
                    time.sleep(2)
        print(f"[sintese] {synthesized}/{len(cleaned)} itens sintetizados.")
    else:
        item_placeholder_status(cleaned)

    if args.limit:
        cleaned = sort_items(cleaned)[: args.limit]

    if args.dry_run or client is None:
        print(f"Total: {len(cleaned)} itens prontos. (dry-run/sem banco)")
        for item in cleaned[:5]:
            print(f"  - {item['titulo'][:70]} | {item['tipo_fonte']} | {item.get('categoria')}")
        return 0

    n = upsert_items(client, cleaned, politico_cache)
    print(f"Persistidas/atualizadas {n} notícias.")
    return 0


def item_placeholder_status(items: list[dict]):
    """Sem chave LLM, sinaliza que a síntese não foi executada."""
    for item in items:
        item.setdefault("status_sintese", "sem_llm")
        item.setdefault("categoria", "Outros")


if __name__ == "__main__":
    sys.exit(main())