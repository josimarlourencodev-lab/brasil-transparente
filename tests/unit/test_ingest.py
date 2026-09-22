"""Testes unitários da camada de persistência do ingest (build_client / RPC)."""

import pytest

from ingest import build_client, upsert_items


def test_build_client_sem_credenciais_lanca(monkeypatch):
    monkeypatch.delenv("NEXT_PUBLIC_SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_ROLE_KEY", raising=False)
    monkeypatch.delenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", raising=False)
    with pytest.raises(RuntimeError):
        build_client()


def test_build_client_prioriza_service_role(monkeypatch):
    chamadas = []

    def fake_create_client(url, key):
        chamadas.append((url, key))
        return object()

    monkeypatch.setenv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "svc_key")
    monkeypatch.setenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon_key")
    monkeypatch.setattr("supabase.create_client", fake_create_client)

    build_client()
    assert chamadas == [("https://proj.supabase.co", "svc_key")]


def test_build_client_cai_para_anon_sem_service_role(monkeypatch):
    chamadas = []

    def fake_create_client(url, key):
        chamadas.append((url, key))
        return object()

    monkeypatch.setenv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co")
    monkeypatch.delenv("SUPABASE_SERVICE_ROLE_KEY", raising=False)
    monkeypatch.setenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon_key")
    monkeypatch.setattr("supabase.create_client", fake_create_client)

    build_client()
    assert chamadas == [("https://proj.supabase.co", "anon_key")]


class _FakeResp:
    def __init__(self, data):
        self.data = data


class _FakeClient:
    def __init__(self):
        self.chamadas = []

    def rpc(self, nome, params=None):
        self.chamadas.append((nome, params))
        return self

    def execute(self):
        return _FakeResp([{"id": 1}])


def test_upsert_items_usa_rpc_upsert_noticia():
    client = _FakeClient()
    itens = [
        {
            "titulo": "Notícia",
            "url": "https://exemplo.gov.br/a",
            "relevante": True,
            "resumo": "resumo",
            "categoria": "Geral",
            "tipo_fonte": "imprensa",
            "publicado_em": "2026-08-28T10:00:00Z",
            "envolvidos": [],
        }
    ]
    assert upsert_items(client, itens) == 1
    nome, params = client.chamadas[0]
    assert nome == "upsert_noticia"
    assert params["dados"]["url"] == "https://exemplo.gov.br/a"


def test_upsert_items_ignora_irrelevante():
    client = _FakeClient()
    itens = [
        {"titulo": "Fora do tema", "url": "https://exemplo.gov.br/x", "relevante": False}
    ]
    assert upsert_items(client, itens) == 0
    assert client.chamadas == []