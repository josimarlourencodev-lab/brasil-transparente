"""Sanitização anti-XSS de conteúdo coletado em feeds.

Nenhum título, resumo ou URL recuperado de fonte externa pode chegar ao
frontend sem ser limpa. Esta camada é aplicada cedo no pipeline de ingestão.
"""

from __future__ import annotations

import html
import re

# Tags/atributos que jamais devem atravessar o pipeline.
TAG_BLOCK = re.compile(r"</?\s*(script|iframe|object|embed|meta|link|style)\b[^>]*>", re.I | re.S)
JS_URI = re.compile(r"(?:javascript|data|vbscript)\s*:", re.I)
CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def strip_tags(text: str) -> str:
    """Remove tags HTML/XML e comentários do texto."""
    if not text:
        return ""
    text = TAG_BLOCK.sub(" ", text)
    text = re.sub(r"<\s*!--.*?--\s*>", " ", text, flags=re.S)
    text = re.sub(r"<[^>]*>", " ", text)
    return html.unescape(text)


def strip_control_chars(text: str) -> str:
    """Remove caracteres de controle (exceto tab/newline/cr)."""
    if not text:
        return ""
    return CONTROL_CHARS.sub(" ", text)


def clean_url(url: str) -> str:
    """Bloqueia esquemas perigosos e header-injection (CR/LF) em URLs."""
    if not url:
        return ""
    url = url.strip()
    # Header-injection: nada além da primeira linha é aceito.
    url = re.split(r"[\r\n]+", url, maxsplit=1)[0].strip()
    # Tab/whitespace interno: mantém apenas o primeiro token.
    url = re.sub(r"[\t ]+", " ", url).split(" ", 1)[0]
    if "--" in url and not url.startswith(("http://", "https://")):
        return ""
    if not url.startswith(("http://", "https://", "//")):
        return ""
    if JS_URI.search(url):
        return ""
    return url


def clean_text(text: str) -> str:
    """Pipeline completo: tags → entidades → controle → colapsa espaços."""
    text = strip_tags(text)
    text = strip_control_chars(text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()[:2000]


def sanitize_item(item: dict) -> dict:
    """Aplica sanitização a um item de notícia (título, resumo, url)."""
    out = dict(item)
    out["titulo"] = clean_text(item.get("titulo", ""))
    out["url"] = clean_url(item.get("url", ""))
    if item.get("resumo"):
        out["resumo"] = clean_text(str(item["resumo"]))
    return out


def is_safe(item: dict) -> bool:
    """Item é considerável seguro quando possui título limpo e URL segura."""
    return bool(item.get("titulo")) and bool(item.get("url"))