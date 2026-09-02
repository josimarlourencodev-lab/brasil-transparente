"""Base de raspagem: busca tolerante a falhas, parsers RSS/Atom e deduplicação."""

from __future__ import annotations

import time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import requests
from bs4 import BeautifulSoup

from sanitize import clean_url, clean_text

USER_AGENT = "BrasilTransparenteBot/0.2 (+https://github.com/brasil-transparente; noticias)"
TIMEOUT_SECONDS = 25
MAX_ITEMS_PER_FEED = 20


class FetchError(Exception):
    """Falha definitiva ao buscar um feed (não retentável)."""


class ParseError(Exception):
    """Conteúdo não é um feed RSS/Atom válido."""


def _last_modified(item) -> str | None:
    for tag in ("pubDate", "published", "updated"):
        el = item.find(tag)
        if el is None:
            continue
        raw = el.get_text().strip()
        if not raw:
            continue
        dt = None
        iso_raw = raw.replace("GMT", "+0000").replace("UTC", "+0000")
        iso_raw2 = iso_raw.replace("Z", "+00:00")
        try:
            dt = parsedate_to_datetime(iso_raw)
        except (TypeError, ValueError):
            try:
                dt = datetime.fromisoformat(iso_raw2)
            except ValueError:
                continue
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat()
    return None


def _first_url(container) -> str | None:
    """Devolve a primeira URL de um elemento (attr src/href/url ou texto)."""
    for attr in ("url", "src", "href"):
        val = container.get(attr)
        if val:
            return str(val)
    text = container.get_text().strip()
    if text:
        return text
    return None


def _item_image(item) -> str | None:
    """Extrai a URL de imagem de um item de feed (media:content/thumbnail,
    enclosure, image padrão ou qualquer elemento com atributo url)."""
    candidates: list[str] = []
    for name in ("media:content", "media:thumbnail"):
        for el in item.find_all(name):
            url = el.get("url")
            if url:
                candidates.append(str(url))
    enc = item.find("enclosure")
    if enc is not None and enc.get("type", "").startswith("image/"):
        url = enc.get("url")
        if url:
            candidates.append(str(url))
    img = item.find("image")
    if img is not None:
        url = _first_url(img)
        if url:
            candidates.append(url)
    for el in item.find_all(True):
        if el.name in ("media:content", "media:thumbnail", "enclosure", "image"):
            continue
        url = el.get("url")
        if url:
            candidates.append(str(url))
            break
    for cand in candidates:
        cleaned = clean_url(cand)
        if cleaned:
            return cleaned
    return None


def parse_feed(content: bytes) -> list[dict]:
    """Converte bytes em itens {titulo, url, publicado_em} (RSS ou Atom)."""
    soup = BeautifulSoup(content, "lxml-xml")
    items = soup.find_all("item") or soup.find_all("entry")
    if not items:
        raise ParseError("feed vazio")

    results = []
    for item in items[:MAX_ITEMS_PER_FEED]:
        title_el = item.find("title")
        if title_el is None:
            continue
        title = clean_text(title_el.get_text())

        url = ""
        link_el = item.find("link")
        if link_el is not None:
            if link_el.has_attr("href"):
                url = link_el["href"]
            else:
                url = link_el.get_text()
        if not url and item.find("guid") is not None:
            url = item.find("guid").get_text()
        url = clean_url(url)

        if title and url:
            results.append(
                {
                    "titulo": title,
                    "url": url,
                    "publicado_em": _last_modified(item),
                    "imagem_url": _item_image(item),
                }
            )
    return results


def fetch_feed(url: str, session: requests.Session | None = None) -> list[dict]:
    """Busca e parseia um feed (suporta RSS e Atom). Lança FetchError/ParseError."""
    session = session or requests.Session()
    try:
        resp = session.get(url, headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT_SECONDS)
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise FetchError(f"{url}: {exc}") from exc
    except (ConnectionError, TimeoutError, OSError) as exc:
        raise FetchError(f"{url}: {exc}") from exc
    if not resp.content:
        raise ParseError("feed vazio")

    items = parse_feed(resp.content)
    for item in items:
        item["_url_feed"] = url
    return items


def fetch_many(urls: list[str], retries: int = 1) -> list[dict]:
    """Busca vários feeds aplicando politeness delay e isolando falhas."""
    all_items: list[dict] = []
    for url in urls:
        delay = 0.5
        for attempt in range(retries + 1):
            try:
                items = fetch_feed(url)
                all_items.extend(items)
                print(f"OK   [{attempt + 1}] {url} → {len(items)} itens")
                break
            except (FetchError, ParseError) as exc:
                print(f"ERRO {url} → {exc}")
                if attempt < retries:
                    time.sleep(2 * (attempt + 1))
                else:
                    print(f"ABANDONADO {url}")
        time.sleep(delay)
    return all_items


def dedupe(items: list[dict]) -> list[dict]:
    """Remove duplicatas por URL e descarta itens sem URL."""
    seen: set[str] = set()
    unique: list[dict] = []
    for item in items:
        url = item.get("url", "")
        if not url or url in seen:
            continue
        seen.add(url)
        unique.append(item)
    return unique