"""Síntese neutra por LLM (Groq / Together AI / Google Gemini).

Objetivo editorial: resumir e categorizar com neutralidade, e — quando houver
histórico disponível — apontar contradições de forma factual, citando as fontes
(oficiais e de oposição) envolvidas. Nunca gera afirmações fora das fontes.

Providers suportados sem dependências extras:
  * groq       → API OpenAI-compatível (api.groq.com) — tier gratuito
  * together   → API OpenAI-compatível (api.together.xyz) — tier gratuito
  * gemini     → API Google (generativelanguage.googleapis.com) — tier gratuito
  * openrouter → API OpenAI-compatível (openrouter.ai) — modelos `:free`

Variáveis:  LLM_PROVIDER (padrão groq) | LLM_API_KEY | LLM_MODEL (opcional;
padrões: groq=openai/gpt-oss-20b, together=meta-llama/Llama-3.1-8B-Instruct-Turbo,
gemini=gemini-2.5-flash, openrouter=meta-llama/llama-3.1-8b-instruct:free)
"""

from __future__ import annotations

import json
import os

import requests

TIMEOUT_SECONDS = 60

BASE_URLS = {
    "groq": "https://api.groq.com/openai/v1/chat/completions",
    "together": "https://api.together.xyz/v1/chat/completions",
    "openrouter": "https://openrouter.ai/api/v1/chat/completions",
}

GEMINI_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)

DEFAULT_MODEL = {
    "groq": "openai/gpt-oss-20b",
    "together": "meta-llama/Llama-3.1-8B-Instruct-Turbo",
    "gemini": "gemini-2.5-flash",
    "openrouter": "meta-llama/llama-3.1-8b-instruct:free",
}

SYSTEM_PROMPT = """Você é o módulo de síntese do Brasil Transparente, um portal neutro \
e independente de monitoramento político.

Regras obrigatórias:
1) Não emita opinião, juízo moral, elogio ou condenação. Nunca use as palavras \
\"reprovável\", \"escândalo\", \"corrupto\" nem adjetivos valorativos.
2) Resuma APENAS o que está nas fontes fornecidas. Não invente fatos, datas ou citações.
3) Quando o histórico de afirmações passadas for fornecido, compare com a notícia atual \
e aponte contradições de forma factual: \"em [data] afirmou X; em [data] aprovou Y\", \
sempre citando as fontes (marcadas como oficial ou oposição).
4) Produza resposta somente em JSON válido com este esquema:
{
  \"resumo\": \"string até 280 caracteres\",
  \"categoria\": \"Corrupção\" | \"Economia\" | \"Saúde\" | \"Segurança\" | \
\"Meio Ambiente\" | \"Educação\" | \"Eleições\" | \"Direitos Humanos\" | \
\"Legislação\" | \"Outros\",
  \"envolvidos\": [\"Nomes completos dos políticos citados na fonte\"],
  \"contradicao\": {\"detectada\": bool, \"descricao\": \"\", \"referencias\": [\"url1\", \"url2\"]}
}"""


def _headers(provider: str) -> dict:
    if provider == "gemini":
        return {"Content-Type": "application/json"}
    return {
        "Authorization": f"Bearer {os.environ.get('LLM_API_KEY', '')}",
        "Content-Type": "application/json",
    }


def _payload(provider: str, user_prompt: str) -> dict:
    if provider == "gemini":
        return {
            "contents": [
                {"role": "user", "parts": [{"text": user_prompt}]}
            ]
        }
    return {
        "model": _model(provider),
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }


def _model(provider: str) -> str:
    return os.environ.get("LLM_MODEL", "").strip() or DEFAULT_MODEL.get(
        provider, DEFAULT_MODEL["groq"]
    )


def _parse_response(provider: str, resp: dict) -> dict | None:
    if provider == "gemini":
        candidates = (resp.get("candidates") or [])
        if not candidates:
            return None
        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    else:
        try:
            text = resp["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError):
            return None
    text = (text or "").strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


def _call(provider: str, user_prompt: str) -> dict | None:
    if provider == "gemini":
        url = GEMINI_ENDPOINT.format(model=_model(provider))
    else:
        url = BASE_URLS.get(provider)
    if not url:
        return None
    params = {"key": os.environ.get("LLM_API_KEY", "")} if provider == "gemini" else None
    payload = _payload(provider, user_prompt)
    resp = requests.post(url, headers=_headers(provider), json=payload, params=params, timeout=TIMEOUT_SECONDS)
    if not resp.ok:
        return None
    try:
        data = resp.json()
    except ValueError:
        return None
    return _parse_response(provider, data)


def build_user_prompt(item: dict, historico: list[dict] | None = None) -> str:
    contexto = {
        "titulo": item.get("titulo"),
        "publicado_em": item.get("publicado_em"),
        "conteudo": (item.get("resumo") or "")[:4000],
        "fontes": [
            {"url": item.get("url"), "tipo": item.get("_tipo_fonte", "imprensa")}
        ],
    }
    if historico:
        contexto["historico_afirmacoes_passadas"] = [
            {"titulo": h.get("titulo"), "descricao": h.get("descricao"), "data": h.get("data_fato")}
            for h in historico[:5]
        ]
    return (
        "Analise a seguinte notícia e devolva o JSON descrito no prompt de sistema. "
        "Retorne SOMENTE o JSON.\n\n" + json.dumps(contexto, ensure_ascii=False)
    )


def synthesize_item(item: dict, historico: list[dict] | None = None) -> dict:
    """Sintetiza um item. Em falha do LLM, mantém o item com resumo vazio."""
    provider = os.environ.get("LLM_PROVIDER", "groq").strip().lower()
    if not os.environ.get("LLM_API_KEY"):
        item["status_sintese"] = "sem_chave_llm"
        return item

    result = None
    try:
        result = _call(provider, build_user_prompt(item, historico))
    except requests.RequestException:
        result = None

    if not result:
        item["status_sintese"] = "falha_llm"
        return item

    item["resumo"] = (result.get("resumo") or item["titulo"])[:280]
    item["categoria"] = result.get("categoria") or "Outros"
    item["envolvidos"] = result.get("envolvidos") or []
    contradicao = result.get("contradicao") or {}
    item["contradicao_detectada"] = bool(contradicao.get("detectada"))
    item["contradicao_descricao"] = contradicao.get("descricao") or ""
    item["contradicao_referencias"] = contradicao.get("referencias") or []
    item["status_sintese"] = "ok"
    return item