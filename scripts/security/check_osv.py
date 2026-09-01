#!/usr/bin/env python3
"""Verifica dependências pinadas contra OSV.dev (GitHub Advisory / PyPA).

Modo de uso:
    python3 scripts/security/check_osv.py                        # lê arquivos padrão
    python3 scripts/security/check_osv.py -r scripts/requirements.txt
    python3 scripts/security/check_osv.py -j package.json
    python3 scripts/security/check_osv.py -r a.txt -j package.json

Saída:
    0  → sem vulnerabilidades conhecidas
    1  → ao menos uma vulnerabilidade conhecida (exit code apropriado para CI)
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from urllib.request import Request, urlopen

OSV_QUERY_URL = "https://api.osv.dev/v1/query"
TIMEOUT_SECONDS = 30

# Em produção (dotfile), cobrir eventualmente requirements.lock.txt
DEFAULT_FILES = ["scripts/requirements.lock.txt", "package.json"]


def parse_requirements(path: str) -> dict[str, str]:
    """Retorna {nome: versão} a partir de um requirements.txt ."""
    deps: dict[str, str] = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith(("#", "-", "--")):
                continue
            # ignora linhas tipo " ; extra ..."
            line = line.split(";")[0].strip()
            if "==" not in line:
                continue
            name, _, version = line.partition("==")
            name = name.strip()
            version = version.strip().lstrip("=").strip()
            if name and re.match(r"^[\w.-]+$", name):
                deps[name.lower()] = version
    return deps


def parse_package_json(path: str) -> dict[str, str]:
    """Retorna {nome: versão} das seções dependencies/devDependencies."""
    deps: dict[str, str] = {}
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    for section in ("dependencies", "devDependencies"):
        for name, version in (data.get(section) or {}).items():
            m = re.search(r"\d+\.\d+\.\d+", version)
            if m:
                deps[name] = m.group(0)
    return deps


def query_osv(ecosystem: str, name: str, version: str) -> list[dict]:
    payload = json.dumps(
        {
            "package": {"ecosystem": ecosystem, "name": name},
            "version": version,
        }
    ).encode("utf-8")
    req = Request(
        OSV_QUERY_URL,
        data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "brasil-transparente-audit/0.1"},
        method="POST",
    )
    with urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    return body.get("vulns", [])


def is_actually_affected(vuln: dict, version: str) -> bool:
    """Verifica se `version` está realmente dentro das faixas afetadas.

    O OSV, para PyPI, costuma reportar a própria versão que corrige o problema
    (falso positivo na borda do range) e também a lista explícita de versões
    afetadas já podada. Esta função reavalia contra fontes oficiais:
      * >lista explícita ``versions``: se não contém a versão ⇒ não afetado;
      * >ranges ``[introduced, fixed)``: afetado somente no intervalo (inclusive
        no limite), aceitando os tipos SEMVER e ECOSYSTEM.
    """
    def _parse(v: str) -> tuple:
        return tuple(int(n) for n in re.findall(r"\d+", v)) or (0,)

    def _cmp(a: tuple, b: tuple) -> int:
        if a == b:
            return 0
        return -1 if a < b else 1

    for affected in vuln.get("affected", []):
        versions = affected.get("versions") or []
        if versions:
            # O OSV já podou a lista de versões afetadas.
            if version in versions:
                return True
            # Lista explícita presente e a versão não está nela ⇒ não afetado.
            return False
        for rng in affected.get("ranges", []):
            if rng.get("type") not in ("SEMVER", "ECOSYSTEM"):
                continue
            introduced = "0"
            fixed = None
            for e in rng.get("events") or []:
                if "introduced" in e:
                    introduced = e["introduced"]
                elif "fixed" in e:
                    fixed = e["fixed"]
            if fixed is None:
                # Sem correção registrada: mantém o alerta do OSV.
                return True
            if 0 <= _cmp(_parse(version), _parse(introduced)) and _cmp(_parse(version), _parse(fixed)) < 0:
                return True
    return False


def audit(name: str, version: str, ecosystem: str, verbose: bool) -> tuple[int, list]:
    try:
        raw_vulns = query_osv(ecosystem, name, version)
    except Exception as exc:
        print(f"[skip] {name}=={version}: falha ao consultar OSV ({exc})")
        return 0, []
    vulns: list[dict] = []
    for v in raw_vulns:
        if not is_actually_affected(v, version):
            continue
        vulns.append(v)
    if vulns:
        print(f"[VULN] {ecosystem}/{name}=={version}: {len(vulns)} vulnerabilidade(s)")
        for v in vulns:
            summary = (v.get("summary") or v.get("details") or "")[:160]
            print(f"       - {v.get('id')}: {summary}")
        return len(vulns), vulns
    if verbose:
        print(f"[ok]   {ecosystem}/{name}=={version}")
    return 0, []


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("-r", "--requirements", action="append", default=[])
    parser.add_argument("-j", "--package-json", action="append", default=[])
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()

    items: list[tuple[str, str, str]] = []
    req_files = list(args.requirements)
    pkg_files = list(args.package_json)

    # Padrão: se nada foi informado explicitamente, usa os arquivos padrão.
    if not req_files and not pkg_files:
        req_files = [p for p in DEFAULT_FILES if p != "package.json"]
        pkg_files = [p for p in DEFAULT_FILES if p == "package.json"]
    else:
        # Quando chamado com apenas um tipo de arquivo, não força o outro.
        if not args.requirements:
            req_files = []
        if not args.package_json:
            pkg_files = []

    total_vulns = 0
    reported: set[tuple[str, str]] = set()

    for path in req_files:
        for name, version in parse_requirements(path).items():
            if (name, version) in reported:
                continue
            reported.add((name, version))
            n, _ = audit(name, version, "PyPI", args.verbose)
            total_vulns += n

    for path in pkg_files:
        for name, version in parse_package_json(path).items():
            if (name, version) in reported:
                continue
            reported.add((name, version))
            n, _ = audit(name, version, "npm", args.verbose)
            total_vulns += n

    print("-" * 60)
    if total_vulns:
        print(f"RESULTADO: {total_vulns} vulnerabilidade(s) conhecida(s) encontrada(s).")
        return 1
    print("RESULTADO: nenhuma vulnerabilidade conhecida nas versões pinadas.")
    return 0


if __name__ == "__main__":
    sys.exit(main())