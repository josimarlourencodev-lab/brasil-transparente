"""Registro central de fontes monitoradas.

Classificação neutra por propósito editorial:
  * oficiais     → portais governamentais, Congresso, diários oficiais;
  * imprensa     → veículos jornalísticos de largo alcance;
  * independentes→ blogs investigativos, canais de oposição e checadores.

A classificação alimenta a síntese de IA e o controle de visibilidade no feed,
garantindo que nenhuma visão única domine a cobertura.
"""

from __future__ import annotations

import json
import os
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import quote_plus

SOURCE_CATEGORIES = ("oficiais", "imprensa", "independentes", "politicos")

# Fontes "padrão" embutidas. Adicione/remova via scripts/feeds.json ou env.
DEFAULT_FEEDS: dict[str, list[str]] = {
    "oficiais": [
        "https://www12.senado.leg.br/noticias/rss",
        "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml",
    ],
    "imprensa": [
        "https://g1.globo.com/rss/g1/politica/",
        "https://www.congressoemfoco.com.br/feed/",
    ],
    "independentes": [
        "https://www.gov.br/comunicacao/pt-br/assuntos/rss",
        "https://www.osintbrasil.com.br/rss.xml",
    ],
}

# Mapeamento de variáveis de ambiente para categorias (dev/digitalizar).
ENV_FEEDS: dict[str, str] = {
    "oficiais": "RSS_FEEDS_OFICIAIS",
    "imprensa": "RSS_FEEDS_IMPRENSA",
    "independentes": "RSS_FEEDS_INDEPENDENTES",
}


@dataclass
class Sources:
    by_category: dict[str, list[str]] = field(
        default_factory=lambda: {c: [] for c in SOURCE_CATEGORIES}
    )

    def all_urls(self) -> list[str]:
        return [u for cat in SOURCE_CATEGORIES for u in self.by_category[cat]]

    def category_of(self, *, feed_url: str | None = None, source_url: str | None = None) -> str:
        """Classifica um item dado a URL do feed de onde veio.

        Substituição simples por host para manter a neutralidade configurável.
        """
        if feed_url:
            for cat in SOURCE_CATEGORIES:
                if feed_url in self.by_category[cat]:
                    return cat
        if source_url:
            for cat in SOURCE_CATEGORIES:
                for u in self.by_category[cat]:
                    if u and u.split("//")[-1].startswith(source_url.split("//")[-1].split("/")[0]):
                        return cat
        return "imprensa"  # default neutro quando não classificável


def politico_search_urls(politicos: list[dict]) -> list[str]:
    """Gera URLs de busca dirigida (Google News RSS) para cada político ativo,
    incluindo o nome completo e os termos_busca (apelidos) cadastrados.

    A categoria 'politicos' permite classificar o tipo de fonte corretamente.
    """
    urls: list[str] = []
    for p in politicos:
        termos = [p.get("nome")] + list(p.get("termos_busca") or [])
        for termo in dict.fromkeys(t for t in termos if t):
            q = quote_plus(f'"{termo.strip()}" eleição presidencial')
            urls.append(
                "https://news.google.com/rss/search?q="
                + q
                + "&hl=pt-BR&gl=BR&ceid=BR:pt-419"
            )
    return urls


def _read_feeds_json() -> dict[str, list[str]]:
    path = Path(__file__).resolve().parent.parent / "feeds.json"
    if not path.exists():
        return {}
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return {cat: data.get(cat, []) for cat in SOURCE_CATEGORIES}


def _read_env() -> dict[str, list[str]]:
    out: dict[str, list[str]] = {c: [] for c in SOURCE_CATEGORIES}
    for cat, env_name in ENV_FEEDS.items():
        raw = os.environ.get(env_name, "")
        if raw:
            out[cat] = [u.strip() for u in raw.split(",") if u.strip()]
    return out


def load_sources() -> Sources:
    """Consolida fontes de feeds.json, variáveis de ambiente e padrões."""
    registered = _read_feeds_json()
    env = _read_env()
    sources = Sources()
    for cat in SOURCE_CATEGORIES:
        merged = []
        for bucket in (registered.get(cat, []), env.get(cat, []), DEFAULT_FEEDS.get(cat, [])):
            merged.extend(bucket)
            sources.by_category[cat] = list(
                dict.fromkeys(u for u in merged if isinstance(u, str) and u)
            )
    return sources