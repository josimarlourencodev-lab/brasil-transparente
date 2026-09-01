"""Testes unitários da camada de sanitização anti-XSS."""

from sanitize import clean_text, clean_url, is_safe, sanitize_item, strip_tags


def test_strip_script_tag():
    assert "<script>" not in strip_tags("Notícia <script>alert(1)</script> importante")
    assert strip_tags("falso<script>x</script>") == "falso x "


def test_strip_iframe_object_style():
    texto = 'x <iframe src="//evil">y</iframe><style>bad</style>z'
    limpo = strip_tags(texto)
    assert "<iframe" not in limpo
    assert "<style" not in limpo


def test_unescape_entities():
    assert strip_tags("Governo &quot;disponível&quot;") == 'Governo "disponível"'


def test_clean_text_colapsa_espacos():
    assert clean_text("  a\n\t b   c  ") == "a b c"


def test_clean_url_rejeita_esquema_perigoso():
    assert clean_url("javascript:alert(1)") == ""
    assert clean_url("data:text/html,<b>") == ""
    assert clean_url("vbscript:x") == ""


def test_clean_url_rejeita_crlf():
    assert clean_url("https://x.com/a\r\nvulneravel") == "https://x.com/a"
    # CRLF + espaço transforma chave em caminho inválido → bloqueado
    assert clean_url("https://x.com/ok\r\nX-Injected: 1") == "https://x.com/ok"


def test_clean_url_exige_esquema_seguro():
    assert clean_url("ftp://x.com") == ""
    assert clean_url("//cdn.exemplo.com/a.png") == "//cdn.exemplo.com/a.png"


def test_sanitize_item_remove_injecao():
    item = {
        "titulo": "<img src=x onerror=alert(1)>Título</img>",
        "url": "https://exemplo.com/noticia",
        "resumo": "<script>sabotage()</script>resumo",
    }
    out = sanitize_item(item)
    assert "onerror" not in out["titulo"].lower()
    assert "<script>" not in out["resumo"]
    assert is_safe(out)


def test_sanitize_item_descarta_url_invalida():
    out = sanitize_item({"titulo": "X", "url": "javascript:alert(1)"})
    assert is_safe(out) is False


def test_is_safe_exige_titulo_e_url():
    assert is_safe({"titulo": "", "url": "https://x.com"}) is False
    assert is_safe({"titulo": "t", "url": "https://x.com"}) is True