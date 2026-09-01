#!/usr/bin/env python3
"""Gera os ícones PWA de /public/icons (PNG, apenas stdlib).

Não adiciona dependências de imagem (zlib/struct da stdlib são suficientes).
"""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

BLUE = (0x0F, 0x4C, 0x81, 0xFF)
WHITE = (0xFF, 0xFF, 0xFF, 0xFF)
RED = (0xC8, 0x10, 0x2E, 0xFF)


def chunk(tag: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + tag
        + data
        + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    )


def write_png(path: Path, size: int, pixels: list[list[tuple]]) -> None:
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filtro None
        for x in range(size):
            raw.extend(pixels[y][x])
    idat = zlib.compress(bytes(raw), 9)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", idat)
        + chunk(b"IEND", b"")
    )
    path.write_bytes(png)


def render(size: int) -> list[list[tuple]]:
    """Ícone: fundo azul; faixa branca horizontal; alvo vermelho central."""
    half = size // 2
    band_h = max(1, round(size * 0.14))
    circle_r = round(size * 0.20)
    circle_cx = half
    circle_cy = half
    rows = []
    for y in range(size):
        row = []
        for x in range(size):
            if abs(x - circle_cx) ** 2 + abs(y - circle_cy) ** 2 <= circle_r ** 2:
                row.append(RED)
            elif band_h > y - half + band_h // 2 >= 0 and abs(x - half) > circle_r + size * 0.01:
                row.append(WHITE)
            else:
                row.append(BLUE)
        rows.append(row)
    return rows


def main() -> None:
    out = Path(__file__).resolve().parents[2] / "public" / "icons"
    out.mkdir(parents=True, exist_ok=True)
    for size in (192, 512):
        write_png(out / f"icon-{size}.png", size, render(size))
        print(f"OK {out / f'icon-{size}.png'} ({size}x{size})")


if __name__ == "__main__":
    main()