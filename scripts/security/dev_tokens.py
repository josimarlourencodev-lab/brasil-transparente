#!/usr/bin/env python3
"""Gera credenciais JWT HMAC-SHA256 para o PostgREST local (desenvolvimento).

O Supabase Cloud expõe a API em https://<projeto>.supabase.co usando o padrão
PostgREST. Em dev local reproduzimos o mesmo padrão com um PostgREST no Docker,
e os papéis "anon"/"service_role" são atribuídos via JWT HS256.

Este script grava ou renova o arquivo `.env.local.dev` com:
  * PGRST_JWT_SECRET      (segredo de assinatura dos tokens)
  * NEXT_PUBLIC_SUPABASE_ANON_KEY   (JWT role=anon  → leitura pública)
  * SUPABASE_SERVICE_ROLE_KEY       (JWT role=service_role → escrita + bypass RLS)
  * ADMIN_PASSWORD                 (senha do painel de auditoria /admin)

Nenhum secret é gravado em git; o arquivo é coberto pelo .gitignore.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from pathlib import Path

JWT_ALG = "HS256"


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def make_jwt(secret: str, role: str, ttl_days: int = 365) -> str:
    header = {"alg": JWT_ALG, "typ": "JWT"}
    payload = {
        "role": role,
        "iss": "brasil-transparente-dev",
        "iat": int(time.time()),
        "exp": int(time.time()) + ttl_days * 86400,
    }
    signing_input = b64url(json.dumps(header, separators=(",", ":")).encode()) + "." + b64url(
        json.dumps(payload, separators=(",", ":")).encode()
    )
    signature = hmac.new(secret.encode(), signing_input.encode(), hashlib.sha256).digest()
    return signing_input + "." + b64url(signature)


def main() -> None:
    project = Path(__file__).resolve().parents[2]  # raiz do repositório
    env_path = project / ".env.local.dev"

    if env_path.exists():
        old = {}
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                old[k.strip()] = v.strip()
        secret = old.get("PGRST_JWT_SECRET") or secrets.token_urlsafe(32)
        admin_password = old.get("ADMIN_PASSWORD") or secrets.token_urlsafe(24)
    else:
        secret = secrets.token_urlsafe(32)
        admin_password = secrets.token_urlsafe(24)

    timestamp = time.strftime("%Y-%m-%d %H:%M %Z", time.gmtime())
    content = (
        "# ================================================\n"
        "# Credenciais geradas para o PostgREST local (dev).\n"
        f"# Regenerado: {timestamp}\n"
        "\n"
        "# Segredo usado pelo PostgREST para validar JWT (não versionar).\n"
        f"PGRST_JWT_SECRET={secret}\n"
        "\n"
        "# JWT role=service_role (escrita e bypass de RLS — use SOMENTE no worker/backend).\n"
        f"SUPABASE_SERVICE_ROLE_KEY={make_jwt(secret, 'service_role')}\n"
        "\n"
        "# JWT role=anon (leitura pública usada pelo frontend/público).\n"
        f"NEXT_PUBLIC_SUPABASE_ANON_KEY={make_jwt(secret, 'anon')}\n"
        "\n"
        "# Senha do painel de auditoria (/admin). Use em produção uma passphrase forte.\n"
        f"ADMIN_PASSWORD={admin_password}\n"
    )
    env_path.write_text(content, encoding="utf-8")
    print(f"OK: {env_path}")
    print("Chaves anon/service_role, segredo JWT e ADMIN_PASSWORD gerados (HS256).")


if __name__ == "__main__":
    main()