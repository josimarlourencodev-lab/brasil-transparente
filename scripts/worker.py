#!/usr/bin/env python3
"""Worker autônomo de ingestão agendada (usado no container `worker`).

Roda o pipeline de ingestão a cada INTERVALO_MINUTOS usando APScheduler.
Mantém o container vivo com hot-reload de configuração (lê fontes a cada ciclo).
"""

from __future__ import annotations

import os

from apscheduler.schedulers.blocking import BlockingScheduler

from ingest import main as run_ingest

INTERVALO_MINUTOS = int(os.environ.get("INGEST_INTERVAL_MINUTOS", "360"))


def job():
    print("\n=== ciclo de ingestão iniciando ===")
    try:
        run_ingest([])
    except SystemExit as exc:
        print(f"ingestão encerrou com código {exc.code}")
    except Exception as exc:
        print(f"erro no ciclo de ingestão: {exc}")
    print("=== ciclo de ingestão finalizado ===")


if __name__ == "__main__":
    scheduler = BlockingScheduler(timezone="America/Sao_Paulo")
    scheduler.add_job(job, "interval", minutes=INTERVALO_MINUTOS, id="ingestao", max_instances=1, coalesce=True)
    print(f"Worker iniciado. Intervalo: {INTERVALO_MINUTOS} minutos.")
    job()
    scheduler.start()