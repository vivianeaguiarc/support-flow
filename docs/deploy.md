# Deploy em produção — SupportFlow Backend

Guia para publicar a API em **Render**, **Railway**, **VPS** ou qualquer ambiente **Docker-based**.

> **Staging:** valide primeiro em ambiente real — veja **[docs/staging.md](./staging.md)** (blueprint `render.yaml`, seed manual, checklist).

## Visão geral

| Etapa               | O que acontece                                                             |
| ------------------- | -------------------------------------------------------------------------- |
| **Build**           | Instala dependências, gera Prisma Client, compila TypeScript               |
| **Release / Start** | `prisma migrate deploy` → inicia `node dist/server.js`                     |
| **Runtime**         | `NODE_ENV=production`, logs JSON (Pino), validação de env na inicialização |

A imagem Docker usa **multi-stage build**, usuário **não-root** (`nodejs`) e **health check** nativo.

---

## Pré-requisitos

- PostgreSQL gerenciado (Render Postgres, Railway Postgres, Supabase, RDS, etc.)
- Secrets fortes para `JWT_SECRET` e `JWT_REFRESH_SECRET` (mín. 32 caracteres)
- Domínio do frontend para `CORS_ORIGIN`

---

## Variáveis obrigatórias

Consulte [`.env.production.example`](../.env.production.example) como referência.

| Variável             | Obrigatória | Descrição                               |
| -------------------- | ----------- | --------------------------------------- |
| `NODE_ENV`           | Sim         | Deve ser `production`                   |
| `DATABASE_URL`       | Sim         | PostgreSQL gerenciado (sem `localhost`) |
| `JWT_SECRET`         | Sim         | Mín. 32 caracteres                      |
| `JWT_REFRESH_SECRET` | Sim         | Mín. 32 caracteres                      |
| `CORS_ORIGIN`        | Sim         | URL do frontend (HTTPS)                 |

A API **não inicia** se alguma variável obrigatória estiver ausente ou inválida (`src/config/env.ts`).

---

## Dockerfile e entrypoint

### Build da imagem

```bash
pnpm docker:build
# ou
docker build -t supportflow-backend .
```

### O que o entrypoint faz

O script [`scripts/docker-entrypoint.sh`](../scripts/docker-entrypoint.sh) executa, em ordem:

1. Verifica se `DATABASE_URL` está definida
2. Executa `pnpm prisma:deploy` (a menos que `SKIP_MIGRATIONS=true`)
3. Inicia a API com `exec node dist/server.js`

```bash
# Fluxo interno
prisma migrate deploy   # aplica migrations pendentes
node dist/server.js     # API em produção
```

Use `SKIP_MIGRATIONS=true` quando a plataforma rodar migrations em uma etapa de **release** separada (ver Railway/Render abaixo).

### Scripts npm

| Script                | Uso                                   |
| --------------------- | ------------------------------------- |
| `pnpm start:prod`     | Apenas inicia a API (sem migrations)  |
| `pnpm start:docker`   | Entrypoint completo (migrate + start) |
| `pnpm migrate:deploy` | Apenas migrations                     |
| `pnpm env:check`      | Valida variáveis de ambiente          |

---

## Health checks

| Endpoint            | Tipo          | Uso                                                |
| ------------------- | ------------- | -------------------------------------------------- |
| `GET /health`       | **Liveness**  | Processo vivo; não consulta o banco                |
| `GET /health/ready` | **Readiness** | Verifica conectividade com PostgreSQL (`SELECT 1`) |

### Validar localmente

```bash
# Stack Docker completa
docker compose up --build -d

# Liveness
curl -s http://localhost:3000/health | jq

# Readiness (aguarda migrations + banco)
curl -s http://localhost:3000/health/ready | jq
```

Resposta esperada (readiness OK):

```json
{
  "status": "ready",
  "service": "supportflow-backend",
  "timestamp": "2026-06-23T12:00:00.000Z",
  "checks": { "database": "up" }
}
```

---

## Configurar secrets em produção

**Nunca** versione `.env` com secrets reais. Configure no painel da plataforma ou em um secret manager:

1. Gere secrets aleatórios (ex.: `openssl rand -base64 48`)
2. Defina `JWT_SECRET` e `JWT_REFRESH_SECRET` com pelo menos 32 caracteres
3. Copie a connection string do PostgreSQL gerenciado para `DATABASE_URL`
4. Ajuste `CORS_ORIGIN` para o domínio do frontend
5. Opcional: `LOG_LEVEL=info`, `SWAGGER_ENABLED=true`

Validação local das variáveis (com env exportadas):

```bash
export $(grep -v '^#' .env.production.example | xargs)  # apenas para teste local
pnpm env:check
```

---

## Deploy no Render

Um blueprint de **staging** está disponível em [`render.yaml`](../render.yaml). Guia passo a passo: **[staging.md](./staging.md)**.

### Passos manuais

1. Crie um **PostgreSQL** no Render e copie a **Internal Database URL**
2. Crie um **Web Service** com:
   - **Environment:** Docker
   - **Dockerfile path:** `./Dockerfile`
   - **Health Check Path:** `/health/ready`
3. Configure as variáveis de ambiente (ver `.env.production.example`)
4. Monte um **disk** persistente em `/app/storage/attachments` se usar uploads
5. Deploy — o entrypoint aplica migrations automaticamente

### URLs úteis após deploy

- API: `https://<service>.onrender.com/api/v1`
- Swagger: `https://<service>.onrender.com/api/docs`
- Health: `https://<service>.onrender.com/health`

---

## Deploy no Railway

1. Conecte o repositório GitHub
2. Adicione um plugin **PostgreSQL** — Railway injeta `DATABASE_URL`
3. Configure o serviço:
   - **Builder:** Dockerfile
   - **Start command:** `./scripts/docker-entrypoint.sh` (padrão da imagem)
4. Defina as demais variáveis no painel **Variables**
5. **Health check:** path `/health/ready`, porta `$PORT`

### Release command (opcional)

Se preferir migrations fora do start:

- **Release command:** `pnpm migrate:deploy`
- **Start command:** `pnpm start:prod`
- **Env:** `SKIP_MIGRATIONS=true`

---

## Deploy em VPS (Docker)

Exemplo mínimo em um servidor Linux com Docker:

```bash
# 1. Build
docker build -t supportflow-backend .

# 2. Run com variáveis e volume persistente
docker run -d \
  --name supportflow-api \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://user:pass@db-host:5432/supportflow?schema=public&sslmode=require" \
  -e JWT_SECRET="your-production-secret-with-at-least-32-chars" \
  -e JWT_REFRESH_SECRET="your-refresh-secret-with-at-least-32-chars" \
  -e CORS_ORIGIN="https://app.example.com" \
  -e LOG_LEVEL=info \
  -e SWAGGER_ENABLED=true \
  -v supportflow_uploads:/app/storage/attachments \
  supportflow-backend
```

### Nginx reverse proxy (resumo)

```nginx
server {
  listen 443 ssl;
  server_name api.example.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

A API já usa `trust proxy` quando `NODE_ENV=production`.

---

## Observabilidade em produção

- **Logs:** JSON estruturado via Pino (`LOG_LEVEL=info` recomendado)
- **Request tracing:** header `X-Request-Id` em todas as respostas de erro
- **Sem stack trace** em respostas HTTP em produção
- **Sem secrets** nos logs (redação de tokens, senhas e headers sensíveis)

---

## Swagger

Por padrão, Swagger fica **habilitado** (`SWAGGER_ENABLED` default `true`).

- UI: `/api/docs`
- OpenAPI JSON: `/api/docs.json`

Para desabilitar em produção: `SWAGGER_ENABLED=false`.

---

## Checklist pré-deploy

- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` aponta para PostgreSQL gerenciado (não localhost)
- [ ] `JWT_SECRET` e `JWT_REFRESH_SECRET` com 32+ caracteres aleatórios
- [ ] `CORS_ORIGIN` com URL HTTPS do frontend
- [ ] Health check configurado em `/health/ready`
- [ ] Volume persistente para `storage/attachments` (se uploads)
- [ ] `pnpm env:check` passa com as variáveis de produção
- [ ] Migrations aplicadas (`prisma migrate deploy`)
- [ ] Seed demo executado manualmente se necessário (`pnpm seed:staging` — ver [staging.md](./staging.md))

---

## Troubleshooting

| Problema                                   | Causa provável                               | Solução                                                        |
| ------------------------------------------ | -------------------------------------------- | -------------------------------------------------------------- |
| Container reinicia em loop                 | `DATABASE_URL` inválida ou banco inacessível | Verifique readiness; confira SSL (`sslmode=require`)           |
| `Invalid or missing environment variables` | Secret curto ou localhost em prod            | Revise `env.ts` e `.env.production.example`                    |
| Migrations falham                          | Schema desatualizado ou permissões           | Rode `prisma migrate deploy` manualmente com a mesma URL       |
| 503 em `/health/ready`                     | Postgres não pronto                          | Aguarde o banco; verifique `depends_on` / health da plataforma |
