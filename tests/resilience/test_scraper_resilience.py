"""Testes de resiliência: falhas de rede, feeds malformados e injeção."""

import pytest
import requests

from crawlers.base import FetchError, ParseError, dedupe, fetch_feed, fetch_many, parse_feed


class FakeOK:
    def __init__(self, content_bytes=b"<rss><channel></channel></rss>"):
        self.status_code = 200
        self.content = content_bytes

    def raise_for_status(self):
        pass


class FakeErro:
    def __init__(self, exc):
        self._exc = exc

    def raise_for_status(self):
        raise self._exc


class FakeTimeoutSession:
    def get(self, url, headers=None, timeout=10):
        raise requests.exceptions.ConnectionError("simulated timeout")


class FakeBadContentSession:
    def get(self, url, headers=None, timeout=10):
        return FakeOK(b"<html><body>erro 500 interno</body></html>")


def test_fetch_timeout_vira_fetcherror(monkeypatch):
    monkeypatch.setattr("crawlers.base.requests.Session", FakeTimeoutSession)
    with pytest.raises(FetchError):
        fetch_feed("https://x.example.com/rss")


def test_fetch_conteudo_nao_feed_sobe_parseerror(monkeypatch):
    monkeypatch.setattr("crawlers.base.requests.Session", FakeBadContentSession)
    with pytest.raises(ParseError):
        fetch_feed("https://x.example.com/rss")


def test_fetch_erro_http_sobe_fetcherror(monkeypatch):
    class Fake:
        def get(self, url, headers=None, timeout=10):
            return FakeErro(requests.exceptions.HTTPError("HTTP 404"))
    monkeypatch.setattr("crawlers.base.requests.Session", Fake)
    with pytest.raises(FetchError):
        fetch_feed("https://x.example.com/nope")


def test_parse_feed_ignora_entrada_binaria():
    with pytest.raises(ParseError):
        parse_feed(b"\x00\x01\xff")


def test_injecao_script_em_feed_nao_sobrevive_ao_parser():
    feed = b"""<rss version="2.0"><channel>
    <item>
      <title><script>alert(1)</script>Segredo descoberto</title>
      <link>https://x.example.com/segredo</link>
    </item>
  </channel></rss>"""
    items = parse_feed(feed)
    assert items
    assert "<script>" not in items[0]["titulo"]


def test_injecao_url_javascript_e_bloqueada_na_sanitizacao():
    from sanitize import is_safe, sanitize_item

    item = sanitize_item({
        "titulo": "Marketing javascript:alert(1)",
        "url": "javascript:alert(1)",
    })
    assert is_safe(item) is False


def test_dedupe_descarta_vazio():
    assert dedupe([{"url": ""}, {"url": "https://x.com/a"}]) == [{"url": "https://x.com/a"}]


def test_fetch_many_continua_apos_falha(monkeypatch, capsys):
    calls = []

    class Fake:
        def get(self, url, headers=None, timeout=10):
            calls.append(url)
            if url == "https://a.example.com/rss":
                return FakeOK(RSS_OK)
            raise requests.exceptions.ConnectionError("sem rede")

    monkeypatch.setattr("crawlers.base.requests.Session", Fake)
    itens = fetch_many(["https://a.example.com/rss", "https://b.example.com/rss"], retries=0)
    assert any("a.example.com" in c for c in calls)
    assert len(itens) >= 1


RSS_OK = b"""<?xml version="1.0"?><rss version="2.0"><channel>
  <item><title>Noticia ok</title><link>https://x.example.com/ok</link></item>
</channel></rss>"""