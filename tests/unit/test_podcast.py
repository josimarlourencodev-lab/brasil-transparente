"""Testes do gerador de podcast (mocked, sem rede).

Cobre o empacotamento das notícias no prompt, a geração do roteiro com o modelo
dedicado (PODCAST_LLM_MODEL — independente do modelo da síntese), a conversão
em áudio via edge-tts e o registro na tabela podcast_episodios.
"""

import json

import podcast
from podcast import (
    _gerar_roteiro,
    _tts_em_mp3,
    _duracao_aprox,
    _titulo_da_semana,
    _episodio_da_semana_ja_existe,
)


def _noticias_fake():
    return [
        {"titulo": "Governo anuncia pacote econômico e mercado reage",
         "publicado_em": "2026-09-04T10:00:00Z",
         "resumo": "O governo anunciou medidas fiscais. Analistas avaliaram impactos.",
         "categoria": "Economia", "tipo_fonte": "imprensa",
         "politico": {"nome": "João Exemplo"}},
        {"titulo": "Deputado propõe projeto sobre transparência",
         "publicado_em": "2026-09-03T10:00:00Z",
         "resumo": "Tramita projeto que amplia regras de transparência em contratos públicos.",
         "categoria": "Legislação", "tipo_fonte": "oficial",
         "politico": {"nome": "Maria Exemplo"}},
    ]


class FakePost:
    class Resp:
        def __init__(self, data, status=200):
            self._data = data
            self.ok = status == 200
            self.status_code = status
            self.headers = {}

        def json(self):
            return self._data

    def __init__(self, response):
        self._response = response
        self.calls = []

    def __call__(self, *args, **kwargs):
        self.calls.append((args, kwargs))
        return self._response


def test_modelo_padrao_e_dedicado():
    assert podcast.LLM_MODEL_PADRAO == "openai/gpt-oss-120b"
    assert podcast.LLM_MODEL_PADRAO not in ("openai/gpt-oss-20b",)


def test_gerar_roteiro_sem_chave_nao_tenta_llm(monkeypatch):
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    assert _gerar_roteiro(_noticias_fake()) is None


def test_gerar_roteiro_usa_modelo_dedicado(monkeypatch):
    monkeypatch.setenv("LLM_API_KEY", "chave-teste")
    monkeypatch.setenv("PODCAST_LLM_MODEL", "openai/gpt-oss-120b")
    fake = FakePost(FakePost.Resp({
        "choices": [{"message": {"content": "Roteiro de teste."}}]
    }))
    monkeypatch.setattr(podcast.requests, "post", fake)

    roteiro = _gerar_roteiro(_noticias_fake())
    assert roteiro == "Roteiro de teste."

    assert len(fake.calls) == 1
    _url, payload = fake.calls[0][0], fake.calls[0][1]["json"]
    assert payload["model"] == "openai/gpt-oss-120b"
    assert payload["max_tokens"] == 7000
    assert payload["messages"][0]["role"] == "system"
    assert "Brasil Transparente" in payload["messages"][0]["content"]
    corpo = json.loads(payload["messages"][1]["content"].split("\n\n", 1)[1])
    assert corpo[0]["titulo"] == "Governo anuncia pacote econômico e mercado reage"


def test_tts_em_mp3_generico(monkeypatch):
    import sys
    import types

    class FakeCommunicate:
        def __init__(self, texto, voice=None):
            self.texto = texto
            self.voice = voice

        async def save(self, path):
            with open(path, "wb") as fp:
                fp.write(b"AUDIO-MP3-BYTES-TESTE")

    fake_mod = types.ModuleType("edge_tts")
    fake_mod.Communicate = FakeCommunicate
    monkeypatch.setitem(sys.modules, "edge_tts", fake_mod)

    dados = _tts_em_mp3("Roteiro de áudio para teste.", voz="pt-BR-FranciscaNeural")
    assert dados == b"AUDIO-MP3-BYTES-TESTE"


def test_duracao_aprox_proporcional():
    curto = _duracao_aprox("apenas duas palavras sim")
    longo = _duracao_aprox(" ".join(["palavra"] * 300))
    assert curto >= 30
    assert longo > curto


def test_titulo_da_semana_e_da_segunda():
    titulo = _titulo_da_semana()
    assert titulo.startswith("Resumo da semana de ")


def test_episodio_da_semana_ja_existe():
    class RespExiste:
        data = [{"id": 1}]
        error = None

    class RespVazio:
        data = []
        error = None

    class Client:
        def __init__(self, resp):
            self._resp = resp
            self._params = []

        def table(self, name):
            self._name = name
            return self

        def select(self, *a, **k):
            return self

        def eq(self, campo, valor):
            self._params.append((campo, valor))
            return self

        def limit(self, *a, **k):
            return self

        def execute(self):
            return self._resp

    existe = Client(RespExiste())
    assert _episodio_da_semana_ja_existe(existe, "Resumo da semana de 31/08") is True
    assert existe._params == [("titulo", "Resumo da semana de 31/08")]

    vazio = Client(RespVazio())
    assert _episodio_da_semana_ja_existe(vazio, "Outro título") is False


def test_carregar_noticias_passa_filtros(monkeypatch):
    import podcast as p

    class Seq:
        def __init__(self, rows):
            self.rows = rows
            self.steps = []

        def select(self, *a, **k):
            self.steps.append(("select", a, k))
            return self

        def eq(self, *a, **k):
            self.steps.append(("eq", a, k))
            return self

        def gte(self, *a, **k):
            self.steps.append(("gte", a, k))
            return self

        def order(self, *a, **k):
            self.steps.append(("order", a, k))
            return self

        def limit(self, *a, **k):
            self.steps.append(("limit", a, k))
            return self

        def execute(self):
            return type("Resp", (), {"data": self.rows, "error": None})()

    seq = Seq([
        {"id": 1, "titulo": "N", "resumo": "ok"},
        {"id": 2, "titulo": "N2", "resumo": ""},
        {"id": 3, "titulo": "N3", "resumo": "   "},
    ])
    client = type("Client", (), {"table": lambda self, name: seq})()

    out = p._carregar_noticias(client, 7)
    assert [n["id"] for n in out] == [1]
    assert "politico:politicos(nome)" in seq.steps[0][1][0]
    filtros = {s[1][0]: s[1][1] for s in seq.steps if s[0] in ("eq", "gte")}
    assert filtros["status"] == "publicado"
    assert "gte" in [s[0] for s in seq.steps]