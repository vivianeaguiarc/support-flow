# Docker — SupportFlow Backend

Guia rápido para executar a API em container. Para **deploy em produção** (Render, Railway, VPS), veja [deploy.md](./deploy.md).

## Pré-requisitos

- Docker 24+
- Docker Compose v2

## Stack completa (API + PostgreSQL)

```bash
docker compose up --build
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/api/docs
- Liveness: http://localhost:3000/health
- Readiness: http://localhost:3000/health/ready

O entrypoint executa `prisma migrate deploy` antes de iniciar o servidor.

## Apenas o banco (desenvolvimento local)

```bash
docker compose up -d postgres
pnpm dev
```

## Build manual

```bash
pnpm docker:build
```

## Variáveis

Consulte [`.env.production.example`](../.env.production.example) para produção e [`.env.example`](../.env.example) para desenvolvimento.
