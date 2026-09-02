"""Testes do registro/classificação de fontes por categoria."""

from urllib.parse import unquote_plus

from crawlers.registro import (
    SOURCE_CATEGORIES,
    Sources,
    load_sources,
    politico_search_urls,
)


def test_categorias_sao_as_esperadas():
    assert list(SOURCE_CATEGORIES) == ["oficiais", "imprensa", "independentes", "politicos"]


def test_classificacao_por_feed_url():
    s = Sources(
        by_category={
            "oficiais": ["https://www12.senado.leg.br/noticias/rss"],
            "imprensa": ["https://g1.globo.com/rss/g1/politica/"],
            "independentes": ["https://blog.investigativo.com/rss"],
            "politicos": ["https://news.google.com/rss/search?q=lula"],
        }
    )
    assert s.category_of(feed_url="https://www12.senado.leg.br/noticias/rss") == "oficiais"
    assert s.category_of(feed_url="https://g1.globo.com/rss/g1/politica/") == "imprensa"
    assert s.category_of(feed_url="https://blog.investigativo.com/rss") == "independentes"
    assert s.category_of(feed_url="https://news.google.com/rss/search?q=lula") == "politicos"


def test_classificacao_desconhecida_cai_em_imprensa_neutra():
    s = Sources(
        by_category={
            "oficiais": [],
            "imprensa": [],
            "independentes": [],
            "politicos": [],
        }
    )
    assert s.category_of(feed_url="https://estranho.example.com/rss") == "imprensa"


def test_load_sources_retorna_categorias_de_feed():
    s = load_sources()
    # oficiais/imprensa/independentes vêm dos padrões; conterao feeds.
    for c in ("oficiais", "imprensa", "independentes"):
        assert len(s.by_category[c]) > 0


def test_all_urls_sem_duplicatas():
    s = load_sources()
    urls = s.all_urls()
    assert len(urls) == len(set(urls))


def test_politico_search_urls_gera_uma_url_por_termo():
    polis = [
        {"nome": "Lula", "termos_busca": ["lula", "lula da silva"]},
        {"nome": "Renan Santos", "termos_busca": ["renan santos"]},
    ]
    urls = politico_search_urls(polis)
    # Lula: nome + "lula" + "lula da silva" = 3 únicos; Renan: nome + "renan santos" = 2 → 5
    assert len(urls) == 5
    assert all(u.startswith("https://news.google.com/rss/search?q=") for u in urls)
    assert "lula" in unquote_plus(urls[0]).lower()


def test_politico_search_urls_vazio():
    assert politico_search_urls([]) == []
    assert politico_search_urls([{"nome": "", "termos_busca": []}]) == []
