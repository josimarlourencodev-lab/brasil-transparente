"""Testes do módulo de síntese por IA (mocked, sem rede)."""

import json

import pytest
import requests

import synthesizer
from synthesizer import build_user_prompt, synthesize_item, _parse_response
from synthesizer import _retry_after_seconds, _call, _parse_interval
from synthesizer import _reset_rate_state, _update_rate_state


class FakePost:
    class Resp:
        def __init__(self, data, status=200, headers=None):
            self._data = data
            self.ok = status == 200
            self.status_code = status
            self.headers = headers or {}

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


def test_retry_after_segundos_numero():
    class R:
        headers = {"Retry-After": "12"}
    assert _retry_after_seconds(R()) == 12.0


def test_retry_after_data_http():
    class R:
        headers = {"Retry-After": "Mon, 04 Jan 2038 00:00:00 GMT"}
    # data no futuro -> conversão válida e espera positiva
    val = _retry_after_seconds(R())
    assert val is not None and val > 0


def test_retry_after_ratelimit_reset_ms():
    import time as _t
    class R:
        headers = {"x-ratelimit-reset": str(int((_t.time() + 5) * 1000))}
    val = _retry_after_seconds(R())
    assert val is not None and 3 <= val <= 8


def test_retry_after_ausente_retorna_none():
    class R:
        headers = {}
    assert _retry_after_seconds(R()) is None


def test_call_429_respeita_retry_after_e_tenta_novamente(monkeypatch):
    from unittest.mock import MagicMock
    monkeypatch.setenv("LLM_API_KEY", "k")
    monkeypatch.setenv("LLM_PROVIDER", "groq")
    monkeypatch.setenv("LLM_MODEL", "m")

    ok_payload = "{\"categoria\": \"Saúde\"}"
    responses = [FakePost.Resp(None, status=429, headers={"Retry-After": "1"})]
    responses.append(FakePost.Resp({"choices": [{"message": {"content": ok_payload}}]}))

    fake = MagicMock(side_effect=responses)
    monkeypatch.setattr("synthesizer.requests.post", fake)

    out = _call("groq", "prompt")
    assert out == {"categoria": "Saúde"}
    assert fake.call_count == 2  # 1× 429 + 1× sucesso
    assert fake.call_args_list[0][0][0] == synthesizer.BASE_URLS["groq"]


def test_call_429_persistente_marca_falha_definitiva(monkeypatch, capsys):
    from unittest.mock import MagicMock
    monkeypatch.setenv("LLM_API_KEY", "k")
    monkeypatch.setenv("LLM_PROVIDER", "groq")
    monkeypatch.setenv("LLM_MODEL", "m")

    def always_429(*a, **k):
        return FakePost.Resp(None, status=429, headers={"Retry-After": "1"})

    fake = MagicMock(side_effect=always_429)
    monkeypatch.setattr("synthesizer.requests.post", fake)

    out = _call("groq", "prompt")
    assert out is None
    assert fake.call_count == synthesizer.RATE_LIMIT_MAX_ATTEMPTS


def test_parse_interval_variados():
    assert _parse_interval("7.66s") == pytest.approx(7.66)
    assert _parse_interval("2m59.56s") == pytest.approx(179.56)
    assert _parse_interval("45") == pytest.approx(45)
    assert _parse_interval("1h30m") == pytest.approx(5400)
    assert _parse_interval("") is None
    assert _parse_interval("abc") is None


def test_retry_after_reset_tokens_interval():
    class R:
        headers = {"x-ratelimit-reset-tokens": "7.66s"}
    assert _retry_after_seconds(R()) == pytest.approx(7.66)


def test_retry_after_reset_requests_interval():
    class R:
        headers = {"x-ratelimit-reset-requests": "2m59.56s"}
    assert _retry_after_seconds(R()) == pytest.approx(179.56)


def test_retry_after_prioriza_retry_after_sobre_reset():
    class R:
        headers = {"Retry-After": "3", "x-ratelimit-reset-tokens": "40s"}
    assert _retry_after_seconds(R()) == 3.0


def test_update_rate_state_acumula_headers():
    _reset_rate_state()
    class R:
        headers = {
            "x-ratelimit-remaining-tokens": "1200",
            "x-ratelimit-remaining-requests": "950",
            "x-ratelimit-reset-tokens": "9.5s",
            "x-ratelimit-reset-requests": "1h0m",
        }
    _update_rate_state(R())
    assert synthesizer._RATE_LIMIT_STATE["remaining_tokens"] == 1200
    assert synthesizer._RATE_LIMIT_STATE["remaining_requests"] == 950
    assert synthesizer._RATE_LIMIT_STATE["reset_tokens_seconds"] == pytest.approx(9.5)
    assert synthesizer._RATE_LIMIT_STATE["reset_requests_seconds"] == pytest.approx(3600)


def test_wait_proativo_quando_tokens_prestes_a_zerar(monkeypatch):
    _reset_rate_state()
    sleeps = []
    monkeypatch.setattr("synthesizer.time.sleep", lambda s: sleeps.append(s))
    synthesizer._RATE_LIMIT_STATE.update({
        "remaining_tokens": 100,
        "remaining_requests": 500,
        "reset_tokens_seconds": 6,
        "reset_requests_seconds": 3600,
    })
    synthesizer._wait_if_rate_limited()
    assert sleeps and sleeps[0] == pytest.approx(6.5)
    # estado zerado após esperar
    assert synthesizer._RATE_LIMIT_STATE["remaining_tokens"] is None
    _reset_rate_state()


def test_nao_espera_por_janela_longa_rpd(monkeypatch):
    _reset_rate_state()
    sleeps = []
    monkeypatch.setattr("synthesizer.time.sleep", lambda s: sleeps.append(s))
    synthesizer._RATE_LIMIT_STATE.update({
        "remaining_tokens": 10,
        "remaining_requests": 1,
        "reset_tokens_seconds": 3600,
        "reset_requests_seconds": 3600,
    })
    synthesizer._wait_if_rate_limited()
    assert sleeps == []
    _reset_rate_state()


def test_call_429_com_espera_longa_desiste_imediatamente(monkeypatch):
    from unittest.mock import MagicMock
    monkeypatch.setenv("LLM_API_KEY", "k")
    monkeypatch.setenv("LLM_PROVIDER", "groq")
    monkeypatch.setenv("LLM_MODEL", "m")
    _reset_rate_state()

    def long_429(*a, **k):
        return FakePost.Resp(None, status=429, headers={"Retry-After": "3600"})

    fake = MagicMock(side_effect=long_429)
    monkeypatch.setattr("synthesizer.requests.post", fake)

    out = _call("groq", "prompt")
    assert out is None
    assert fake.call_count == 1  # desistiu na primeira tentativa, sem esperar 1h
    _reset_rate_state()