# ==================================================
# Brasil Transparente — Frontend (Next.js)
# Alvo `dev`: hot-reload (volumes montados via compose)
# Alvo `ci`:  build de produção + start (pipeline CI)
# ==================================================
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS dev
COPY . .
EXPOSE 3000
CMD ["pnpm", "run", "dev"]

FROM deps AS ci
COPY . .
RUN pnpm run build
EXPOSE 3000
CMD ["pnpm", "run", "start"]