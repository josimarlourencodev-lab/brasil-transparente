# ==================================================
# Brasil Transparente — Frontend (Next.js)
# Alvo `dev`: hot-reload (volumes montados via compose)
# Alvo `ci`:  build de produção + start (pipeline CI)
# ==================================================
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund

FROM deps AS dev
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM deps AS ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]