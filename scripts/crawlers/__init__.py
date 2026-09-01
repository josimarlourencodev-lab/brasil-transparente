"""Pacote de crawlers do Brasil Transparente."""

from .base import FetchError, ParseError, dedupe, fetch_feed, fetch_many, parse_feed

__all__ = ["FetchError", "ParseError", "dedupe", "fetch_feed", "fetch_many", "parse_feed"]