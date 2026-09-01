# ==================================================
# Brasil Transparente — Worker de ingestão agendada
# Python 3.13 (alinhado ao requirements.lock.txt com hashes)
# ==================================================
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=America/Sao_Paulo

WORKDIR /app

# Instalação rigorosa: hashes fixados (supply chain security).
COPY requirements.lock.txt .
RUN pip install --no-cache-dir --require-hashes --no-deps -r requirements.lock.txt

# Código de ingestão.
COPY . ./scripts
WORKDIR /app/scripts

CMD ["python", "worker.py"]