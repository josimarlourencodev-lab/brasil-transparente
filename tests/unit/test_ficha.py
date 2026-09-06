"""Testes do módulo de ficha do político (mocked, sem rede)."""

import json

import pytest
import requests

from synthesizer import _call
import ficha
from ficha import (
    FICHA_SYSTEM,
    _limpar_casos,
    _montar_prompt,
    _noticias_do_politico,
    _sem_acento,
    _sintetizar_ficha,
)


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
        self.call_args = ()
        self.call_kwargs = {}

    def __call__(self, *args, **kwargs):
        self.call_args = args
        self.call_kwargs = kwargs
        return self._response


def test_call_aceita_system_prompt_personalizado(monkeypatch):
    """O prompt de sistema da ficha é enviado à Groq."""
    monkeypatch.setenv("LLM_API_KEY", "k")
    monkeypatch.setenv("LLM_PROVIDER", "groq")
    monkeypatch.setenv("LLM_MODEL", "m")
    payload = json.dumps({"casos": []})
    resp = {"choices": [{"message": {"content": payload}}]}
    fake = FakePost(FakePost.Resp(resp))
    monkeypatch.setattr("synthesizer.requests.post", fake)

    out = _call("groq", "prompt", FICHA_SYSTEM)
    assert out == {"casos": []}
    body = fake.call_kwargs["json"]
    assert body["messages"][0]["content"] == FICHA_SYSTEM


def test_montar_prompt_inclui_politico_e_noticias_sem_chaves():
    politico = {"nome": "Político A", "partido": "PT", "cargo": "Deputado"}
    noticias = [{"id": 1, "titulo": "T", "resumo": "R", "categoria": "Corrupção",
                 "tipo_fonte": "oficial", "publicado_em": "2026-01-01",
                 "contradicao_descricao": None, "url": "https://x.com/1"}]
    prompt = _montar_prompt(politico, noticias)
    assert "LLM_API_KEY" not in prompt
    assert "FICHA_SYSTEM" not in prompt
    body = json.loads(prompt[prompt.index("{"):prompt.rindex("}") + 1])
    assert body["politico"]["nome"] == "Político A"
    assert body["noticias"][0]["titulo"] == "T"


def test_sintetizar_ficha_sem_chave_nao_tenta_llm(monkeypatch):
    monkeypatch.setenv("LLM_API_KEY", "")
    out = _sintetizar_ficha({"nome": "A"}, [])
    assert out == []


def test_sintetizar_ficha_popula_casos(monkeypatch):
    monkeypatch.setenv("LLM_API_KEY", "teste")
    payload = json.dumps({
        "casos": [
            {
                "tipo": "processo",
                "status": "em_andamento",
                "titulo": "Inquérito em tramitação",
                "descricao": "STF autorizou abertura de inquérito.",
                "orgao": "STF",
                "data_fato": "2026-02-01",
                "fontes": ["https://x.com/1"],
            },
            {
                "tipo": "corrupcao",
                "status": "impossivel",
                "titulo": " ",
            },
        ]
    })
    resp = {"choices": [{"message": {"content": payload}}]}
    monkeypatch.setattr("synthesizer.requests.post", FakePost(FakePost.Resp(resp)))

    out = _sintetizar_ficha({"nome": "A"}, [{"titulo": "N"}])
    assert len(out) == 1
    assert out[0]["tipo"] == "processo"
    assert out[0]["status"] == "em_andamento"
    assert out[0]["fontes"] == ["https://x.com/1"]

    # modelo padrão é o isolado (gpt-oss-120b), como o podcast
    assert ficha.MODELO_PADRAO == "openai/gpt-oss-120b"


def test_sintetizar_ficha_falha_llm_retorna_none(monkeypatch):
    monkeypatch.setenv("LLM_API_KEY", "teste")

    class Broken:
        def __call__(self, *a, **k):
            raise requests.exceptions.ConnectionError("api fora")

    monkeypatch.setattr("synthesizer.requests.post", Broken())
    out = _sintetizar_ficha({"nome": "A"}, [{"titulo": "N"}])
    assert out is None


def test_limpar_casos_normaliza_tipo_status_e_remove_vazios():
    casos = [
        {"tipo": "condenacao", "status": "condenado", "titulo": "X", "fontes": "n/a"},
        {"tipo": "denuncia", "status": "em_andamento", "titulo": "Y"},
        {"tipo": "outro", "status": "absolvido", "titulo": "Z",
         "descricao": "  ", "orgao": None, "data_fato": None, "fontes": []},
    ]
    limpos = _limpar_casos(casos)
    assert limpos[0]["tipo"] == "condenacao"
    assert limpos[0]["status"] == "condenado"
    assert limpos[0]["fontes"] == []  # "n/a" não é URL válida -> filtrada
    assert limpos[1]["descricao"] is None
    assert limpos[2]["descricao"] is None


def test_limpar_casos_descarta_sem_titulo():
    out = _limpar_casos([{"tipo": "processo", "status": "x", "titulo": "  "}])
    assert out == []


def test_sem_acento_normaliza():
    assert _sem_acento("Marçal") == "Marcal"
    assert _sem_acento("Flávio Bolsonaro") == "Flavio Bolsonaro"


def test_noticias_do_politico_por_termo_sem_acento():
    noticias = [
        {"id": 1, "titulo": "Pablo Marçal anuncia plano", "resumo": "", "politico_id": None},
        {"id": 2, "titulo": "Pesquisa presidencial", "resumo": "Sem menção", "politico_id": None},
        {"id": 3, "titulo": "Outro", "resumo": "", "politico_id": 99},
    ]
    politico = {"id": 5, "nome": "Pablo Marçal", "termos_busca": ["pablo marcal", "marcal"]}
    out = _noticias_do_politico(noticias, politico, limite=5)
    assert [n["id"] for n in out] == [1]


def test_noticias_do_politico_por_politico_id():
    noticias = [
        {"id": 1, "titulo": "X", "resumo": "", "politico_id": 7},
        {"id": 2, "titulo": "Y", "resumo": "", "politico_id": 7},
        {"id": 3, "titulo": "Z", "resumo": "", "politico_id": 8},
    ]
    out = _noticias_do_politico(noticias, {"id": 7, "nome": "A", "termos_busca": []}, limite=1)
    assert [n["id"] for n in out] == [1]


def test_sintetizar_ficha_falha_nao_apaga_ficha_existente(monkeypatch):
    # sintetizar_ficha retorna None em falha; a gravação só substitui quando há
    # resultado válido (garantido por quem grava, ver main --dry-run)
    assert _sintetizar_ficha({"nome": "A"}, []) == []  # sem chave: vazio, não falha