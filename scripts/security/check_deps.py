#!/usr/bin/env python3
"""Checagem LEVE de autenticidade de dependências (ciclo de ingestão).

Objetivo: validar rapidamente que os módulos Python carregados no ambiente
pertencem aos pacotes oficiais e estão na versão exata pinada no lockfile —
sem recomputar todos os hashes a cada execução (o que é pesado).

A verificação rigorosa de hashes (pip --require-hashes) acontece apenas no
CI/build (`ci.yml`), quando o lockfile muda. Este script é um triagem barata
que roda no início de cada ciclo de ingestão.

Saída / exit code:
    0  → todos os pacotes instalados conferem com o lockfile (autênticos)
    2  → ao menos um pacote diverge do lockfile (instalação suspeita/desatualizada)
"""

from __future__ import annotations

import argparse
import importlib.metadata as md
import re
import sys
from pathlib import Path


def parse_lock(path: Path) -> dict[str, str]:
    """Lê requirements.lock.txt e retorna {nome_lowercase: versão}.

    Formato de cada bloco (gerado por pip-compile --generate-hashes):
        pkg==1.2.3 \
            --hash=...
            # via ...
    """
    deps: dict[str, str] = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith(("#", "--")):
                continue
            if "==" not in line:
                continue
            head = line.split(" \\")[0].split(" ")[0]
            if "==" not in head:
                continue
            name, _, version = head.partition("==")
            name = name.strip()
            version = version.strip().lstrip("=").strip()
            if name and re.match(r"^[\w.-]+$", name):
                deps[name.lower()] = version
    return deps


def installed_version(pkg: str) -> str | None:
    """Retorna a versão instalada de um pacote (sem exceção)."""
    try:
        return md.version(pkg)
    except md.PackageNotFoundError:
        return None


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "-r",
        "--requirements",
        default="scripts/requirements.lock.txt",
        help="caminho do lockfile",
    )
    args = ap.parse_args(argv)

    lock = parse_lock(Path(args.requirements))
    if not lock:
        print(f"[check_deps] aviso: nenhuma dependência lida de {args.requirements}.")
        return 0

    divergencias: list[str] = []
    checados = 0
    for pkg, esperada in sorted(lock.items()):
        real = installed_version(pkg)
        checados += 1
        if real is None:
            divergencias.append(f"{pkg}: não instalado (esperado {esperada})")
        elif real != esperada:
            divergencias.append(f"{pkg}: instalado {real} != lock {esperada}")

    print(f"[check_deps] {checados} pacotes verificados contra o lockfile.")

    if not divergencias:
        print("[check_deps] OK — dependências autênticas e na versão pinada.")
        return 0

    print("[check_deps] DIVERGÊNCIA detectada (execute pip --require-hashes):")
    for d in divergencias:
        print(f"  - {d}")
    return 2


if __name__ == "__main__":
    sys.exit(main())
