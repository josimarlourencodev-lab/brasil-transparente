"""Testes do módulo de síntese por IA (mocked, sem rede)."""

import json

import pytest
import requests

import synthesizer
from synthesizer import build_user_prompt, synthesize_item, _parse_response


class FakePost:
    class Resp:
        def __init__(self, data, status=200):
            self._data = data
            self.ok = status == 200
            self.status_code = status

        def json(self):
            return self._data

    def __init__(self, response):
        self._response = response
        self.calls = []

    def __call__(self, *args, **kwargs):
        self.calls.append((args, kwargs))
        return self._response


def test_synthesize_sem_chave_nao_tenta_llm(monkeypatch):
    monkeypatch.setenv("LLM_API_KEY", "")
    item = {"titulo": "X", "url": "https://x.com"}
    out = synthesize_item(item)
    assert out["status_sintese"] == "sem_chave_llm"


def test_synthesize_sucesso_popula_campos(monkeypatch):
    monkeypatch.setenv("LLM_API_KEY", "teste")
    monkeypatch.setenv("LLM_PROVIDER", "groq")
    payload = json.dumps({
        "resumo": "Relatoria aprovou texto.",
        "categoria": "Legislação",
        "envolvidos": ["Politico A"],
        "contradicao": {
            "detectada": True,
            "descricao": "Em 2020 defendeu X; em 2026 votou Y.",
            "referencias": ["https://x.com/1"],
        },
    })
    resp = {"choices": [{"message": {"content": payload}}]}
    fake = FakePost(FakePost.Resp(resp))
    monkeypatch.setattr("synthesizer.requests.post", fake)

    item = synthesize_item({"titulo": "Votação", "url": "https://x.com/2"})
    assert item["status_sintese"] == "ok"
    assert item["categoria"] == "Legislação"
    assert item["contradicao_detectada"] is True
    assert item["contradicao_referencias"] == ["https://x.com/1"]


def test_synthesize_falha_http_nao_trava_pipeline(monkeypatch):
    monkeypatch.setenv("LLM_API_KEY", "teste")
    monkeypatch.setenv("LLM_PROVIDER", "groq")

    class Broken:
        def __call__(self, *a, **k):
            raise requests.exceptions.ConnectionError("api fora")

    monkeypatch.setattr("synthesizer.requests.post", Broken())
    item = synthesize_item({"titulo": "X", "url": "https://x.com/f"})
    assert item["status_sintese"] == "falha_llm"
    assert "titulo" in item


def test_synthesize_resposta_nao_json_nao_trava(monkeypatch):
    monkeypatch.setenv("LLM_API_KEY", "teste")
    monkeypatch.setenv("LLM_PROVIDER", "groq")
    resp = {"choices": [{"message": {"content": "nao sou json"}}]}
    fake = FakePost(FakePost.Resp(resp))
    monkeypatch.setattr("synthesizer.requests.post", fake)
    item = synthesize_item({"titulo": "X", "url": "https://x.com/f2"})
    assert item["status_sintese"] == "falha_llm"


def test_parse_response_gemini():
    resp = {"candidates": [{"content": {"parts": [{"text": '{"resumo": "r"}'}]}}]}
    assert _parse_response("gemini", resp) == {"resumo": "r"}


def test_build_user_prompt_nao_vaza_chaves():
    prompt = build_user_prompt({"titulo": "T", "url": "https://x.com"})
    assert "LLM_API_KEY" not in prompt
    assert "SUPABASE" not in prompt
    body = json.loads(prompt[prompt.index("{"):prompt.rindex("}") + 1])
    assert body["titulo"] == "T"


def test_resposta_com_markdown_codeblock_e_extraido():
    raw = '```json\n{"categoria": "Saúde"}\n```'
    from unittest.mock import MagicMock
    resp = {"choices": [{"message": {"content": raw}}]}
    assert _parse_response("groq", resp) == {"categoria": "Saúde"}