#!/usr/bin/env python3
"""
Classificação temática neutra por regras explícitas (palavras-chave).

Associação puramente lexical sobre o texto oficial (ementa / objeto da votação),
sem juízo de valor e sem IA. Idempotente: apenas cria associações.
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, List

from supabase import Client, create_client

ROOT = Path(__file__).resolve().parent.parent
DATA_TEMAS = ROOT / "data" / "temas.json"


def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise SystemExit("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios")
    return create_client(url, key)


def normalizar(texto: str) -> str:
    texto = texto.lower()
    texto = unicodedata.normalize("NFD", texto)
    return re.sub(r"[̀-ͯ]", "", texto)


import unicodedata  # noqa: E402


def contem(texto_norm: str, termos: List[str]) -> bool:
    return any(re.search(rf"\b{re.escape(normalizar(t))}\b", texto_norm) for t in termos if t)


def main() -> None:
    sb = get_supabase()
    temas = json.loads(DATA_TEMAS.read_text(encoding="utf-8"))["temas"]
    ativos = {t["slug"]: t for t in temas if t.get("ativo", True)}

    props = sb.table("proposicoes").select("id,ementa,ementa_detalhada").execute().data or []
    pares_prop = 0
    for p in props:
        texto = normalizar(f"{p.get('ementa') or ''} {p.get('ementa_detalhada') or ''}")
        for slug, t in ativos.items():
            if contem(texto, t.get("palavras_chave", [])):
                tema_id = sb.table("temas").select("id").eq("slug", slug).limit(1).execute().data[0]["id"]
                sb.table("proposicao_temas").upsert(
                    {"proposicao_id": p["id"], "tema_id": tema_id},
                    on_conflict="proposicao_id,tema_id",
                ).execute()
                pares_prop += 1

    vots = sb.table("votacoes").select("id,objeto_votacao,resumo").execute().data or []
    pares_vot = 0
    for v in vots:
        texto = normalizar(f"{v.get('objeto_votacao') or ''} {v.get('resumo') or ''}")
        for slug, t in ativos.items():
            if contem(texto, t.get("palavras_chave", [])):
                tema_id = sb.table("temas").select("id").eq("slug", slug).limit(1).execute().data[0]["id"]
                sb.table("votacao_temas").upsert(
                    {"votacao_id": v["id"], "tema_id": tema_id},
                    on_conflict="votacao_id,tema_id",
                ).execute()
                pares_vot += 1

    print(f"proposicao_temas: {pares_prop} associacoes")
    print(f"votacao_temas: {pares_vot} associacoes")


if __name__ == "__main__":
    main()
