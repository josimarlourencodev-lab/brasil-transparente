"""Testes da associação de notícias ao perfil do político (politico_id).

Cobre a normalização de apelidos extraídos pelo LLM ("Lula", "Flávio
Bolsonaro", "Caiado", "Zema") contra termos_busca cadastrados.
"""

from ingest import (
    _normalize_nome,
    list_active_politicos,
    resolve_politico_id,
)


class FakeResp:
    def __init__(self, data):
        self.data = data


class FakeClient:
    def __init__(self, politico_rows):
        self._rows = politico_rows

    def table(self, _name):
        return self

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, *_args, **_kwargs):
        return self

    def execute(self):
        return FakeResp(self._rows)


Politicos = [
    {"id": 1, "nome": "Luiz Inácio Lula da Silva", "termos_busca": ["lula", "luiz inacio lula da silva", "lula da silva"]},
    {"id": 2, "nome": "Flávio Bolsonaro", "termos_busca": ["flavio bolsonaro", "flavio"]},
    {"id": 4, "nome": "Ronaldo Caiado", "termos_busca": ["ronaldo caiado", "caiado"]},
    {"id": 6, "nome": "Romeu Zema", "termos_busca": ["romeu zema", "zema"]},
    {"id": 3, "nome": "Renan Santos", "termos_busca": ["renan santos", "renan"]},
]


def test_normalize_remove_acentos_e_espacos():
    assert _normalize_nome("  Flávio  Bolsonaro ") == "flavio bolsonaro"
    assert _normalize_nome("Lula") == "lula"
    assert _normalize_nome("Luiz Inácio Lula da Silva") == "luiz inacio lula da silva"
    assert _normalize_nome(None) == ""


def test_list_active_politicos_popula_nome_completo_e_termos():
    cache = {}
    list_active_politicos(FakeClient(Politicos), cache)
    assert cache["luiz inacio lula da silva"] == 1
    assert cache["lula"] == 1
    assert cache["caiado"] == 4
    assert cache["zema"] == 6
    assert cache["renan"] == 3


def test_resolve_politico_id_casa_apelido_do_llm():
    cache = {}
    list_active_politicos(FakeClient(Politicos), cache)
    assert resolve_politico_id({"envolvidos": ["Lula"]}, cache) == 1
    assert resolve_politico_id({"envolvidos": ["Flávio Bolsonaro", "Lula"]}, cache) == 2
    assert resolve_politico_id({"envolvidos": ["Caiado"]}, cache) == 4
    assert resolve_politico_id({"envolvidos": ["ZEMA"]}, cache) == 6
    assert resolve_politico_id({"envolvidos": ["Renan"]}, cache) == 3


def test_resolve_politico_id_nao_politico_retorna_none():
    cache = {}
    list_active_politicos(FakeClient(Politicos), cache)
    assert resolve_politico_id({"envolvidos": ["Moraes", "Toffoli"]}, cache) is None
    assert resolve_politico_id({"envolvidos": []}, cache) is None
    assert resolve_politico_id({}, cache) is None


def test_resolve_politico_id_usa_primeiro_casado():
    cache = {}
    list_active_politicos(FakeClient(Politicos), cache)
    assert resolve_politico_id({"envolvidos": ["Moraes", "Zema", "Lula"]}, cache) == 6
