"""Testes do registro/classificação de fontes por categoria."""

from crawlers.registro import SOURCE_CATEGORIES, Sources, load_sources


def test_categorias_sao_as_esperadas():
    assert list(SOURCE_CATEGORIES) == ["oficiais", "imprensa", "independentes"]


def test_classificacao_por_feed_url():
    s = Sources(
        by_category={
            "oficiais": ["https://www12.senado.leg.br/noticias/rss"],
            "imprensa": ["https://g1.globo.com/rss/g1/politica/"],
            "independentes": ["https://blog.investigativo.com/rss"],
        }
    )
    assert s.category_of(feed_url="https://www12.senado.leg.br/noticias/rss") == "oficiais"
    assert s.category_of(feed_url="https://g1.globo.com/rss/g1/politica/") == "imprensa"
    assert s.category_of(feed_url="https://blog.investigativo.com/rss") == "independentes"


def test_classificacao_desconhecida_cai_em_imprensa_neutra():
    s = Sources(
        by_category={
            "oficiais": [],
            "imprensa": [],
            "independentes": [],
        }
    )
    assert s.category_of(feed_url="https://estranho.example.com/rss") == "imprensa"


def test_load_sources_retorna_todas_categorias():
    s = load_sources()
    assert all(s.by_category[c] for c in SOURCE_CATEGORIES)


def test_all_urls_sem_duplicatas():
    s = load_sources()
    urls = s.all_urls()
    assert len(urls) == len(set(urls))