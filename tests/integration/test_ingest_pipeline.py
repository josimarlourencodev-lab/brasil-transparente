"""Testes de integração do pipeline completo (fetch → sanitize → persist).

Sem rede: todas as camadas externas são mockadas.
"""

import json

import pytest
import requests

from crawlers.base import fetch_many
from ingest import main as run_ingest

RSS_COM_INJECAO = """<?xml version="1.0" encoding="utf-8" ?>
<rss version="2.0"><channel>
  <item>
    <title><script>alert(1)</script>Denuncia<script>a()</script> do caso X</title>
    <link>https://exemplo.gov.br/a</link>
    <pubDate>Fri, 28 Aug 2026 10:00:00 GMT</pubDate>
  </item>
  <item>
    <title>Votacao relatoria</title>
    <link>javascript:alert(document.cookie)</link>
  </item>
  <item>
    <title>Parecer aprovado</title>
    <link>https://exemplo.gov.br/b</link>
    <pubDate>Sat, 29 Aug 2026 11:00:00 GMT</pubDate>
  </item>
</channel></rss>"""


class FakeSession:
    def get(self, url, headers=None, timeout=10):
        if "gov" in url:
            return FakeResponse(RSS_COM_INJECAO.encode("utf-8"))
        return FakeResponse(RSS_COM_INJECAO.encode("utf-8"))


class FakeResponse:
    def __init__(self, content):
        self.status_code = 200
        self.content = content

    def raise_for_status(self):
        pass


class FakeResp:
    def __init__(self, data):
        self.data = data


class FakeTable:
    def select(self, *cols):
        return self

    def eq(self, *args):
        return self

    def limit(self, n):
        return self

    def upsert(self, payload, on_conflict=None):
        self._last_payload = payload
        return self

    def execute(self):
        if hasattr(self, "_last_payload"):
            return FakeResp([self._last_payload])
        return FakeResp([])


class FakeClient:
    def __init__(self):
        self._grava = FakeTable()
        self._consulta = FakeTable()

    def table(self, name):
        if name == "noticias":
            return self._grava
        return self._consulta


@pytest.fixture
def fake_network(monkeypatch):
    monkeypatch.setattr("crawlers.base.requests.Session", FakeSession)


@pytest.fixture
def env_sem_llm(monkeypatch):
    monkeypatch.setenv("LLM_API_KEY", "")
    monkeypatch.setenv("LLM_PROVIDER", "groq")


def test_pipeline_remove_injecao_e_grava_payload_limpo(fake_network, env_sem_llm, monkeypatch):
    import ingest as ingest_mod

    client = FakeClient()
    monkeypatch.setattr(ingest_mod, "build_client", lambda: client)
    monkeypatch.setattr("sys.argv", ["ingest", "--sources", "oficiais"])

    code = run_ingest(["--sources", "oficiais"])
    assert code == 0

    assert client._grava._last_payload is not None
    texto = json.dumps(client._grava._last_payload, ensure_ascii=False)
    assert "<script>" not in texto
    assert "javascript:" not in texto
    assert "alert(1)" not in texto


def test_pipeline_classifica_tipo_fonte_por_categoria(fake_network, env_sem_llm, monkeypatch):
    import ingest as ingest_mod

    client = FakeClient()
    monkeypatch.setattr(ingest_mod, "build_client", lambda: client)

    run_ingest(["--sources", "oficiais"])
    last = client._grava._last_payload
    assert last["tipo_fonte"] == "oficial"
    assert last["status"] == "publicado"
    assert "contradicao_detectada" in last


def test_fetch_many_isola_feed_com_falha(monkeypatch):
    class FakeBroken:
        def get(self, url, headers=None, timeout=10):
            raise requests.exceptions.ConnectionError("falha de rede")

    monkeypatch.setattr("crawlers.base.requests.Session", FakeBroken)
    # nenhuma URL produz itens, mas não deve lançar exceção
    resultado = fetch_many(["https://sem-rede.example.com/rss"], retries=0)
    assert resultado == []