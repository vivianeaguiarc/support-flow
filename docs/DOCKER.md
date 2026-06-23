# Docker — SupportFlow Backend

Guia rápido para executar a API em container de produção.

## Pré-requisitos

- Docker 24+
- Docker Compose v2

## Variáveis obrigatórias

| Variável       | Descrição                                        |
| -------------- | ------------------------------------------------ |
| `DATABASE_URL` | Connection string PostgreSQL                     |
| `JWT_SECRET`   | Segredo JWT (mín. 32 caracteres em `production`) |
| `NODE_ENV`     | Use `production` no deploy                       |
| `CORS_ORIGIN`  | Origem permitida pelo CORS                       |

Opcionais: `PORT` (padrão `3000`), `JWT_EXPIRES_IN`, `SWAGGER_ENABLED`, rate limits.

A validação ocorre na inicialização via `src/config/env.ts` — a API não sobe se faltar variável obrigatória.

## Stack completa (API + PostgreSQL)

```bash
docker compose up --build
```

- API: http://localhost:3000
- Liveness: http://localhost:3000/health
- Readiness: http://localhost:3000/health/ready
- API REST: http://localhost:3000/api/v1/...

O entrypoint executa `prisma migrate deploy` antes de iniciar o servidor.

## Apenas o banco (desenvolvimento local)

```bash
docker compose up -d postgres
pnpm dev
```

## Build manual da imagem

```bash
pnpm docker:build
# ou
docker build -t supportflow-backend .
```

## Executar container isolado

```bash
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public" \
  -e JWT_SECRET="your-production-secret-with-at-least-32-chars" \
  -e CORS_ORIGIN="https://app.example.com" \
  supportflow-backend
```

## Deploy em PaaS (Render, Railway, Fly.io)

1. **Build command:** `docker build -t supportflow-backend .` (ou buildpack Docker)
2. **Start command:** `./scripts/docker-entrypoint.sh` (padrão do `Dockerfile`)
3. **Release command (opcional):** `pnpm prisma:deploy` — se a plataforma suportar etapa separada, rode migrations no release e use `pnpm start:prod` no start
4. Configure as variáveis de ambiente listadas acima
5. Aponte o health check da plataforma para `GET /health` (liveness) e/ou `GET /health/ready` (readiness)

## Volumes

Anexos de tickets são gravados em `storage/attachments`. Em produção, monte um volume persistente nesse caminho.
