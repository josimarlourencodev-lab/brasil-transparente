"""Testes unitários do parser RSS/Atom."""

import pytest

from crawlers.base import ParseError, dedupe, parse_feed

RSS_XML = """<?xml version="1.0" encoding="utf-8" ?>
<rss version="2.0"><channel><title>Canal</title>
  <item>
    <title>Senado aprova projeto de lei</title>
    <link>https://exemplo.gov.br/1</link>
    <pubDate>Fri, 28 Aug 2026 13:48:10 -0300</pubDate>
  </item>
  <item>
    <title>Relatoria oferece parecer</title>
    <link>https://exemplo.gov.br/2</link>
    <pubDate>Tue, 01 Sep 2026 09:00:00 GMT</pubDate>
  </item>
  <item>
    <title>Sem publicação ainda</title>
    <pubDate>Wed, 02 Sep 2026 10:00:00 +0000</pubDate>
  </item>
</channel></rss>""".encode()

ATOM_XML = """<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Gov Feed</title>
  <entry>
    <title>Licitação aberta no edital</title>
    <link rel="alternate" href="https://gov.br/servico/1"/>
    <updated>2026-09-01T10:30:00Z</updated>
  </entry>
</feed>""".encode()


def test_parse_rss():
    items = parse_feed(RSS_XML)
    assert len(items) == 2
    assert items[0]["titulo"] == "Senado aprova projeto de lei"
    assert items[0]["url"] == "https://exemplo.gov.br/1"
    assert items[0]["publicado_em"] == "2026-08-28T16:48:10+00:00"


def test_item_sem_url_e_descartado():
    items = parse_feed(RSS_XML)
    assert all(i["url"] for i in items)


def test_parse_atom():
    items = parse_feed(ATOM_XML)
    assert len(items) == 1
    assert items[0]["titulo"] == "Licitação aberta no edital"
    assert items[0]["url"] == "https://gov.br/servico/1"
    assert items[0]["publicado_em"] == "2026-09-01T10:30:00+00:00"


def test_parse_sem_link_usa_guid():
    guid_xml = RSS_XML.replace(
        b"<pubDate>Wed, 02 Sep 2026 10:00:00 +0000</pubDate>",
        b"<guid>https://exemplo.gov.br/3</guid><pubDate>Wed, 02 Sep 2026 10:00:00 +0000</pubDate>",
    )
    items = parse_feed(guid_xml)
    assert items[-1]["url"] == "https://exemplo.gov.br/3"


def test_parse_feed_vazio_sobe_erro():
    with pytest.raises(ParseError):
        parse_feed(b"<rss></rss>")


def test_parse_lixo_sobe_erro():
    with pytest.raises(ParseError):
        parse_feed(b"not a feed at all")


def test_dedup_por_url_preserva_ordem():
    itens = [
        {"url": "https://a.com/1", "titulo": "A"},
        {"url": "https://a.com/1", "titulo": "A duplicada"},
        {"url": "https://b.com/2", "titulo": "B"},
        {"url": "https://a.com/1", "titulo": "A triplicada"},
    ]
    unicos = dedupe(itens)
    assert len(unicos) == 2
    assert unicos[0]["titulo"] == "A"
    assert unicos[1]["titulo"] == "B"