"""Isola o arquivo de orçamento diário da Groq entre os testes unitários."""

import pytest


@pytest.fixture(autouse=True)
def _isola_budget(tmp_path, monkeypatch):
    """Garante que cada teste use um orçamento vazio em arquivo temporário,
    sem depender de um `.llm_budget.json` residual na máquina do dev."""
    monkeypatch.setenv("LLM_BUDGET_FILE", str(tmp_path / "budget.json"))
    monkeypatch.delenv("NEXT_PUBLIC_SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_ROLE_KEY", raising=False)
    monkeypatch.delenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", raising=False)
    yield