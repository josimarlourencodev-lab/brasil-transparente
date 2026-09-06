"""Geração do episódio semanal de podcast do Brasil Transparente.

Fluxo:
  1. Busca as notícias publicadas e sintetizadas dos últimos 7 dias.
  2. Gera o roteiro editorial (neutro, em PT-BR) usando um modelo LLM DA GROQ
     DIFERENTE do modelo de síntese diária — report padrão
     `openai/gpt-oss-120b` (via PODCAST_LLM_MODEL; gera roteiro longo em uma
     única chamada na cesta de 8000 tokens/min). Isso isola a cota/rate
     limit da síntese de notícias (que usa openai/gpt-oss-20b).
  3. Converte o roteiro em áudio PT-BR com edge-tts (TTS gratuito, rede MS Edge;
     não tem custo nem consome a cota da Groq).
  4. Faz upload do MP3 no bucket público `podcast` do Supabase e registra o
     episódio na tabela `podcast_episodios`.

Deve ser executado por agendador (cron semanal via GitHub Actions).

Variáveis usadas:
  NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY  (escrita no banco/storage)
  LLM_API_KEY                  (chave da Groq — mesma chave do site)
  PODCAST_LLM_MODEL            (padrão: qwen/qwen3.6-27b)
  PODCAST_VOICE                (voz edge-tts PT-BR; padrão: pt-BR-FranciscaNeural)
  PODCAST_DAYS                 (janela de dias; padrão: 7)
"""

from __future__ import annotations

import asyncio
import argparse
import datetime as dt
import json
import os
import tempfile
from pathlib import Path

import requests

# Reutiliza o rate-limit/shareamento do sintetizador (headers x-ratelimit-*).
from synthesizer import _headers

TTS_VOICE_PADRAO = "pt-BR-FranciscaNeural"
LLM_MODEL_PADRAO = "openai/gpt-oss-120b"
DIAS_PADRAO = 7
MAX_NOTICIAS = 20

ROTEIRO_SYSTEM = (
    """Você é o redator de roteiros do podcast semanal do Brasil Transparente, um portal \
neutro e independente de monitoramento político brasileiro.

Produza um texto falado em português do Brasil com duração de 15 a 18 minutos (2200 a \
2600 palavras). Obrigatório atingir essa extensão.

Formato:
- Abertura: "Você está ouvindo o Brasil Transparente, sua síntese semanal da verdade na \
política brasileira." e uma frase de contexto.
- 10 a 12 capítulos numerados ("Capítulo 1 — ..."), cada um com 250 a 330 palavras, \
cobrindo fatos reais das notícias fornecidas. Se houver poucas notícias, desenvolva o \
contexto de cada fato mantendo a extensão exigida.
- Encerramento: resumo final de 5 a 8 frases dos pontos mais importantes.
- Desfecho fixo: "Acompanhe o Brasil Transparente para continuar acompanhando os \
bastidores da política."

Regras: total imparcialidade, sem opinião, sem adjetivos valorativos, sem partidarismo, \
sem especulação. Diga apenas o que está nas notícias, citando os envolvidos por nome \
completo, a data e o veículo quando relevante.

Retorne APENAS o texto do roteiro pronto para locução, sem aspas, sem marcação, sem JSON."""
)


def _env(name: str, default: str | None = None) -> str | None:
    return os.environ.get(name, "").strip() or default


def _build_client():
    from supabase import create_client

    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError(
            "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias."
        )
    return create_client(url, key)


def _model_atual() -> str:
    return _env("PODCAST_LLM_MODEL", LLM_MODEL_PADRAO) or LLM_MODEL_PADRAO


def _gerar_roteiro(noticias: list[dict]) -> str | None:
    """Gera o roteiro com o modelo LLM dedicado do podcast (sem tocar no modelo de síntese)."""
    provider = (_env("LLM_PROVIDER", "groq") or "groq").strip().lower()
    if not _env("LLM_API_KEY"):
        print("[podcast] sem LLM_API_KEY — roteiro não gerado")
        return None

    itens = []
    for n in noticias[:MAX_NOTICIAS]:
        itens.append(
            {
                "titulo": n.get("titulo"),
                "data": n.get("publicado_em"),
                "resumo": (n.get("resumo") or "")[:400],
                "categoria": n.get("categoria"),
                "fonte": n.get("tipo_fonte"),
                "politico": (n.get("politico") or {}).get("nome"),
            }
        )
    user_prompt = (
        "Aqui estão as notícias monitoradas na última semana. Escreva o roteiro completo "
        "do episódio de hoje (duração de leitura de 15 a 18 minutos, com capítulos para os "
        "destaques abaixo), seguindo exatamente o formato do prompt de sistema.\n\n"
        + json.dumps(itens, ensure_ascii=False)
    )

    payload = {
        "model": _model_atual(),
        "messages": [
            {"role": "system", "content": ROTEIRO_SYSTEM},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 7000,
    }

    resp = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers=_headers(provider),
        json=payload,
        timeout=300,
    )
    if not resp.ok:
        print(f"[podcast] LLM falhou: status {resp.status_code} — {resp.text[:200]}")
        return None
    data = resp.json()
    try:
        texto = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        print("[podcast] resposta do LLM sem conteúdo")
        return None
    return (texto or "").strip()


def _tts_em_mp3(roteiro: str, voz: str) -> bytes:
    """Gera o áudio do roteiro em MP3 via edge-tts (TTS PT-BR gratuito)."""
    import edge_tts

    communicate = edge_tts.Communicate(roteiro, voice=voz)
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        asyncio.run(communicate.save(tmp.name))
        dados = Path(tmp.name).read_bytes()
    Path(tmp.name).unlink(missing_ok=True)
    return dados


def _upload_audio(client, episodio: str, audio: bytes) -> str:
    if not audio:
        raise RuntimeError("áudio vazio")
    client.storage.from_("podcast").upload(
        path=f"{episodio}.mp3",
        file=audio,
        file_options={"content-type": "audio/mpeg", "upsert": "true"},
    )
    return client.storage.from_("podcast").get_public_url(f"{episodio}.mp3")


def _upload_thumb(client, episodio: str, thumb: bytes) -> str:
    client.storage.from_("podcast").upload(
        path=f"{episodio}.jpg",
        file=thumb,
        file_options={"content-type": "image/jpeg", "upsert": "true"},
    )
    return client.storage.from_("podcast").get_public_url(f"{episodio}.jpg")


def _gerar_thumb(titulo: str) -> bytes:
    """Gera a thumbnail do episódio (JPEG 1200x675, paleta do site)."""
    import io

    from PIL import Image, ImageDraw, ImageFont

    LARGURA, ALTURA = 1200, 675

    def grad(c1: str, c2: str, t: float) -> tuple[int, int, int]:
        a = tuple(int(c1[i:i + 2], 16) for i in (1, 3, 5))
        b = tuple(int(c2[i:i + 2], 16) for i in (1, 3, 5))
        return tuple(round(a[i] + (b[i] - a[i]) * min(max(t, 0.0), 1.0)) for i in range(3))

    def fonte(tamanho):
        for caminho in (
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "DejaVuSans-Bold.ttf",
            "DejaVuSans.ttf",
        ):
            try:
                return ImageFont.truetype(caminho, tamanho)
            except OSError:
                continue
        return ImageFont.load_default(size=tamanho)

    img = Image.new("RGB", (LARGURA, ALTURA), "#0F4C81")
    draw = ImageDraw.Draw(img)

    for x in range(LARGURA):
        draw.line([(x, 0), (x, 130)], fill=grad("#1E6FB8", "#0B3A63", x / LARGURA))
    for y in range(90):
        draw.line([(0, ALTURA - 90 + y), (LARGURA, ALTURA - 90 + y)],
                  fill=grad("#C8102E", "#8E0B20", y / 90))

    f_logo = fonte(30)
    m = "BRASIL TRANSPARENTE"
    caixa = draw.textbbox((0, 0), m, font=f_logo)
    draw.text(((LARGURA - caixa[2]) // 2, 44), m, font=f_logo, fill="#FFFFFF")
    draw.rectangle(((LARGURA - 44) // 2, 92, (LARGURA + 44) // 2, 98), fill="#C8102E")

    f_titulo = fonte(76)
    while f_titulo.size > 34:
        caixa = draw.textbbox((0, 0), titulo, font=f_titulo)
        if caixa[2] - caixa[0] <= LARGURA - 160:
            break
        f_titulo = fonte(f_titulo.size - 6)
    caixa = draw.textbbox((0, 0), titulo, font=f_titulo)
    draw.text(((LARGURA - caixa[2]) // 2, (ALTURA - caixa[3]) // 2 - 8), titulo,
              font=f_titulo, fill="#FFFFFF")

    f_rodape = fonte(30)
    t2 = "PODCAST SEMANAL"
    caixa2 = draw.textbbox((0, 0), t2, font=f_rodape)
    draw.text(((LARGURA - caixa2[2]) // 2, ALTURA - 58), t2, font=f_rodape,
              fill="#FFFFFF")

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=88)
    return buf.getvalue()


def _duracao_aprox(texto: str) -> int:
    # ~150 palavras/min em locução brasileira; arredondando para segundos.
    palavras = len(texto.split())
    return max(30, round(palavras / 150 * 60))


def _registrar_episodio(client, titulo: str, descricao: str, roteiro: str,
                        audio_url: str, thumb_url: str | None = None) -> bool:
    data = {
        "titulo": titulo,
        "descricao": descricao,
        "roteiro": roteiro,
        "audio_url": audio_url,
        "duracao_seg": _duracao_aprox(roteiro),
        "publicado_em": dt.datetime.now(dt.timezone.utc).isoformat(),
    }
    if thumb_url:
        data["thumb_url"] = thumb_url
    resp = client.table("podcast_episodios").insert(data).execute()
    return bool(resp.data)


def _episodio_da_semana_ja_existe(client, titulo: str) -> bool:
    """Evita duplicar o episódio se o cron rodar mais de uma vez na mesma semana."""
    resp = (
        client.table("podcast_episodios")
        .select("id")
        .eq("titulo", titulo)
        .limit(1)
        .execute()
    )
    return bool((resp.data or []) if not getattr(resp, "error", None) else [])


def _carregar_noticias(client, days: int) -> list[dict]:
    desde = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days)).isoformat()
    resp = client.table("noticias").select(
        "id, titulo, resumo, categoria, tipo_fonte, publicado_em, url, "
        "contradicao_detectada, politico:politicos(nome)"
    ).eq("status", "publicado").gte("publicado_em", desde).order(
        "publicado_em", desc=True
    ).limit(40).execute()
    if getattr(resp, "error", None):
        return []
    # Só usa notícias já sintetizadas, senão o roteiro fica pobre/vazio.
    return [n for n in (resp.data or []) if (n.get("resumo") or "").strip()]


def _titulo_da_semana() -> str:
    hoje = dt.date.today()
    segunda = hoje - dt.timedelta(days=hoje.weekday())
    return f"Resumo da semana de {segunda.strftime('%d/%m')}"


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--days", type=int, default=DIAS_PADRAO,
                        help="janela em dias (padrão 7)")
    parser.add_argument("--dry-run", action="store_true",
                        help="não grava no banco nem no storage")
    parser.add_argument("--emit-only", action="store_true",
                        help="gera roteiro+áudio apenas (sem Supabase)")
    parser.add_argument("--noticias-json", metavar="ARQUIVO",
                        help="arquivo JSON com notícias (fixture p/ emit-only e dry-run)")
    args = parser.parse_args(argv)

    client = None
    if not args.emit_only:
        client = _build_client()

    noticias = []
    if args.noticias_json:
        with open(args.noticias_json, encoding="utf-8") as fp:
            noticias = json.load(fp)
    elif client:
        noticias = _carregar_noticias(client, args.days)
    if not noticias:
        print(f"[podcast] nenhuma notícia sintetizada nos últimos {args.days} dias")
        return 1

    titulo = _titulo_da_semana()

    if client and not args.dry_run and not args.emit_only:
        if _episodio_da_semana_ja_existe(client, titulo):
            print(f"[podcast] episódio '{titulo}' já registrado — nada a fazer")
            return 0

    roteiro = _gerar_roteiro(noticias)
    if not roteiro:
        print("[podcast] roteiro não gerado")
        return 1

    print(f"[podcast] roteiro gerado ({len(roteiro.split())} palavras)")
    print("-----")
    print(roteiro)
    print("-----")

    audio = _tts_em_mp3(roteiro, _env("PODCAST_VOICE", TTS_VOICE_PADRAO) or TTS_VOICE_PADRAO)
    print(f"[podcast] áudio gerado: {len(audio)} bytes")

    if args.emit_only or args.dry_run:
        return 0

    episodio = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d")
    audio_url = _upload_audio(client, episodio, audio)
    print(f"[podcast] áudio publicado: {audio_url}")

    thumb_url = None
    try:
        thumb = _gerar_thumb(titulo)
        thumb_url = _upload_thumb(client, episodio, thumb)
        print(f"[podcast] thumbnail publicada: {thumb_url}")
    except Exception as exc:  # noqa: BLE001 — a thumb não pode impedir o episódio
        print(f"[podcast] aviso: falha ao publicar thumbnail: {exc}")

    ok = _registrar_episodio(
        client,
        titulo,
        "Episódio semanal com os destaques monitorados pelo Brasil Transparente.",
        roteiro,
        audio_url,
        thumb_url,
    )
    if ok:
        print("[podcast] episódio registrado com sucesso")
        return 0
    print("[podcast] falha ao registrar episódio")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())