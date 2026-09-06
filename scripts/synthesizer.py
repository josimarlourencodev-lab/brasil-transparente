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
import time

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
4) Só analise notícias com relação comprovável ao monitoramento político brasileiro \
(gestão pública, corrupção, políticas públicas, eleições, atos de parlamentares e \
gestores). Ignore e marque como `relevante: false` matérias sobre celebridades, \
famosos, esportes, futebol, entretenimento, cultura pop, novelas, shows ou qualquer \
assunto sem ligação direta com o exercício do poder público. Para esses casos, \
devolva exatamente: {\"relevante\": false} sem preencher os demais campos.
5) Produza resposta somente em JSON válido com este esquema:
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


def _payload(provider: str, user_prompt: str, system_prompt: str | None = None,
             max_tokens: int | None = None, model: str | None = None) -> dict:
    if provider == "gemini":
        return {
            "contents": [
                {"role": "user", "parts": [{"text": user_prompt}]}
            ]
        }
    body: dict = {
        "model": _model_with_override(provider, model),
        "messages": [
            {"role": "system", "content": system_prompt or SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }
    if max_tokens is not None:
        body["max_tokens"] = max_tokens
    return body


def _model(provider: str) -> str:
    return os.environ.get("LLM_MODEL", "").strip() or DEFAULT_MODEL.get(
        provider, DEFAULT_MODEL["groq"]
    )


def _model_with_override(provider: str, model: str | None) -> str:
    if model and model.strip():
        return model.strip()
    return _model(provider)


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


MAX_ATTEMPTS = 4
RATE_LIMIT_MAX_ATTEMPTS = 5
BACKOFF_BASE_SECONDS = 2
BACKOFF_MAX_SECONDS = 60
MAX_SLEEP_ON_429 = 120
TOKENS_ESTIMATIVA_POR_CHAMADA = 1500
RATE_RESET_MAX_ESPERA = 120

_RATE_LIMIT_STATE: dict[str, float | None] = {
    "remaining_requests": None,
    "remaining_tokens": None,
    "reset_tokens_seconds": None,
    "reset_requests_seconds": None,
}


def _email_date_to_epoch(value: str) -> float | None:
    """Converte uma data HTTP (RFC 7231) no header Retry-After para epoch."""
    try:
        import email.utils

        parsed = email.utils.parsedate_to_datetime(value)
        if parsed is None:
            return None
        return parsed.timestamp()
    except (TypeError, ValueError, OverflowError):
        return None


def _parse_interval(value: str) -> float | None:
    """Converte intervalos de reset da Groq (ex.: '7.66s', '2m59.56s', '45')
    para segundos. Retorna None para valores não reconhecidos."""
    raw = (value or "").strip()
    if not raw:
        return None
    try:
        return float(raw)
    except ValueError:
        pass
    units = {"s": 1, "m": 60, "h": 3600, "d": 86400}
    total = 0.0
    num = ""
    for ch in raw:
        if ch.isdigit() or ch == "." or ch == ",":
            num += ch.replace(",", ".")
        elif num:
            total += float(num) * units.get(ch.lower(), 1)
            num = ""
    if num:
        total += float(num)
    return total if total > 0 else None


def _retry_after_seconds(resp) -> float | None:
    """Deriva segundos de espera a partir dos headers de rate limit, se houver.

    Precedência (docs Groq): `Retry-After` (segundos ou data HTTP) no 429;
    em seguida `x-ratelimit-reset-tokens` / `x-ratelimit-reset-requests`
    (intervalos como '7.66s' ou '2m59.56s'); e por fim `x-ratelimit-reset`
    legado (epoch em ms).
    """
    raw = resp.headers.get("Retry-After")
    if raw:
        try:
            return float(raw.strip())
        except ValueError:
            epoch = _email_date_to_epoch(raw.strip())
            if epoch is not None:
                return max(0.0, epoch - time.time())
    for header in ("x-ratelimit-reset-tokens", "x-ratelimit-reset-requests"):
        interval = _parse_interval(resp.headers.get(header))
        if interval is not None:
            return interval
    reset = resp.headers.get("x-ratelimit-reset")
    if reset:
        try:
            reset_ms = float(reset)
            eta = reset_ms if reset_ms > 1e12 else reset_ms * 1000
            return max(0.0, (eta - time.time() * 1000) / 1000.0)
        except ValueError:
            pass
    return None


def _update_rate_state(resp) -> None:
    """Acumula os headers `x-ratelimit-*` de qualquer resposta (2xx ou 429)."""
    if not resp:
        return
    headers = resp.headers or {}
    if headers.get("x-ratelimit-remaining-tokens") is not None:
        try:
            _RATE_LIMIT_STATE["remaining_tokens"] = float(
                headers["x-ratelimit-remaining-tokens"]
            )
        except ValueError:
            pass
    if headers.get("x-ratelimit-remaining-requests") is not None:
        try:
            _RATE_LIMIT_STATE["remaining_requests"] = float(
                headers["x-ratelimit-remaining-requests"]
            )
        except ValueError:
            pass
    interval = _parse_interval(headers.get("x-ratelimit-reset-tokens"))
    if interval is not None:
        _RATE_LIMIT_STATE["reset_tokens_seconds"] = interval
    interval = _parse_interval(headers.get("x-ratelimit-reset-requests"))
    if interval is not None:
        _RATE_LIMIT_STATE["reset_requests_seconds"] = interval


def _reset_rate_state() -> None:
    for key in _RATE_LIMIT_STATE:
        _RATE_LIMIT_STATE[key] = None


def _wait_if_rate_limited() -> None:
    """Espera proativamente quando a janela de tokens/requests está prestes a
    zerar, evitando bater no 429. Não dorme para janelas longas (RPD em horas)."""
    state = _RATE_LIMIT_STATE
    wait = 0.0
    if (
        state["remaining_tokens"] is not None
        and state["remaining_tokens"] <= TOKENS_ESTIMATIVA_POR_CHAMADA
    ):
        reset = state["reset_tokens_seconds"]
        if reset is not None and reset <= RATE_RESET_MAX_ESPERA:
            wait = max(wait, reset)
    if (
        state["remaining_requests"] is not None
        and state["remaining_requests"] <= 1
    ):
        reset = state["reset_requests_seconds"]
        if reset is not None and reset <= RATE_RESET_MAX_ESPERA:
            wait = max(wait, reset)
    if wait > 0:
        print(f"[llm] janela de rate limit quase zerada — aguardando {wait:.1f}s")
        time.sleep(wait + 0.5)
        _reset_rate_state()


def _backoff_seconds(attempt: int, retry_after: float | None) -> float:
    if retry_after is not None:
        return min(retry_after + 0.5, BACKOFF_MAX_SECONDS)
    return min(BACKOFF_BASE_SECONDS * (2**attempt), BACKOFF_MAX_SECONDS)


def _call(provider: str, user_prompt: str, system_prompt: str | None = None,
          max_tokens: int | None = None, model: str | None = None) -> dict | None:
    if provider == "gemini":
        url = GEMINI_ENDPOINT.format(model=_model_with_override(provider, model))
    else:
        url = BASE_URLS.get(provider)
    if not url:
        return None
    params = {"key": os.environ.get("LLM_API_KEY", "")} if provider == "gemini" else None
    payload = _payload(provider, user_prompt, system_prompt, max_tokens, model)

    last_status: int | None = None
    attempts = 0
    while True:
        attempts += 1
        _wait_if_rate_limited()
        try:
            resp = requests.post(
                url,
                headers=_headers(provider),
                json=payload,
                params=params,
                timeout=TIMEOUT_SECONDS,
            )
        except requests.RequestException as exc:
            print(f"[llm] tentativa {attempts} rede: {exc}")
            if attempts >= MAX_ATTEMPTS:
                break
            time.sleep(_backoff_seconds(attempts - 1, None))
            continue

        last_status = resp.status_code
        _update_rate_state(resp)

        if resp.status_code == 429:
            retry_after = _retry_after_seconds(resp)
            if attempts >= RATE_LIMIT_MAX_ATTEMPTS:
                print(f"[llm] falha definitiva por rate limit (tentativa {attempts})")
                break
            if retry_after is not None and retry_after > MAX_SLEEP_ON_429:
                print(
                    f"[llm] 429 com espera longa ({retry_after:.0f}s) — RPD esgotado, "
                    f"desistindo nesta execução"
                )
                break
            if retry_after:
                print(f"[llm] rate limit — aguardando {retry_after:.0f}s (tentativa {attempts + 1})")
            else:
                print(f"[llm] status 429 sem Retry-After (tentativa {attempts})")
            time.sleep(_backoff_seconds(attempts - 1, retry_after))
            continue

        if resp.ok:
            try:
                data = resp.json()
            except ValueError:
                print(f"[llm] resposta não-JSON (tentativa {attempts})")
                if attempts >= MAX_ATTEMPTS:
                    break
                time.sleep(_backoff_seconds(attempts - 1, None))
                continue
            parsed = _parse_response(provider, data)
            if parsed is not None:
                return parsed
            print(f"[llm] JSON sem conteúdo utilizável (tentativa {attempts})")
            if attempts >= MAX_ATTEMPTS:
                break
            time.sleep(_backoff_seconds(attempts - 1, None))
            continue

        print(f"[llm] status {resp.status_code} (tentativa {attempts})")
        if attempts >= MAX_ATTEMPTS:
            break
        time.sleep(_backoff_seconds(attempts - 1, None))

    print(f"[llm] falha definitiva (último status {last_status})")
    return None


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

    item["relevante"] = bool(result.get("relevante", True))
    if not item["relevante"]:
        item["status_sintese"] = "fora_do_tema"
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