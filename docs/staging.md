# Deploy em staging — SupportFlow Backend

Guia para validar a API em ambiente real **antes do go-live**, usando **Render** (recomendado) ou **Railway**.

> Staging usa `NODE_ENV=production` (mesmo runtime que produção), mas com banco e URLs separados.

---

## Visão geral do fluxo

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│ Git push    │ ──► │ Build (Docker)   │ ──► │ prisma migrate      │
│ main branch │     │ multi-stage      │     │ deploy (entrypoint) │
└─────────────┘     └──────────────────┘     └──────────┬──────────┘
                                                          │
                                                          ▼
                                               ┌─────────────────────┐
                                               │ node dist/server.js │
                                               │ Pino JSON logs      │
                                               │ Swagger /api/docs   │
                                               └─────────────────────┘

Seed (manual, pós-deploy):
  SEED_DEMO_ENABLED=true + DATABASE_URL → pnpm seed:staging
```

| Etapa      | O que acontece                                                    |
| ---------- | ----------------------------------------------------------------- |
| **Build**  | `Dockerfile` multi-stage: install → prisma generate → `tsc` build |
| **Start**  | `scripts/docker-entrypoint.sh` → `prisma migrate deploy` → API    |
| **Seed**   | **Manual** — nunca automático no container                        |
| **Health** | Plataforma consulta `GET /health/ready`                           |

---

## Pré-requisitos

- Repositório no GitHub
- Conta Render ou Railway
- `pnpm ci:full` passando localmente antes do primeiro deploy

---

## Variáveis de ambiente (staging)

Referência completa: [`.env.staging.example`](../.env.staging.example)

| Variável             | Obrigatória | Valor staging                                  |
| -------------------- | ----------- | ---------------------------------------------- |
| `NODE_ENV`           | Sim         | `production`                                   |
| `DATABASE_URL`       | Sim         | Postgres gerenciado (sem `localhost`)          |
| `JWT_SECRET`         | Sim         | 32+ caracteres aleatórios                      |
| `JWT_REFRESH_SECRET` | Sim         | 32+ caracteres aleatórios                      |
| `CORS_ORIGIN`        | Sim         | URL do frontend staging (HTTPS)                |
| `LOG_LEVEL`          | Não         | `info` (logs JSON estruturados)                |
| `SWAGGER_ENABLED`    | Não         | `true` (validar API via Swagger)               |
| `SEED_DEMO_ENABLED`  | Não         | `false` no serviço web (**nunca** `true` aqui) |
| `SKIP_MIGRATIONS`    | Não         | `false` (migrations no entrypoint)             |
| `UPLOAD_DIR`         | Não         | `storage/attachments` (+ disk persistente)     |

**Nunca versione secrets.** Configure no painel Render/Railway.

---

## Deploy no Render (recomendado)

### Opção A — Blueprint (automático)

1. **Render Dashboard** → **New** → **Blueprint**
2. Conecte o repositório GitHub
3. Render lê [`render.yaml`](../render.yaml) e provisiona:
   - Web Service: `supportflow-api-staging`
   - PostgreSQL: `supportflow-db-staging`
4. Defina manualmente no painel:
   - `CORS_ORIGIN` → URL do frontend staging (ou placeholder temporário)
5. **Create resources** e aguarde o primeiro deploy

### Opção B — Manual

1. Crie **PostgreSQL** (Starter) → copie **Internal Database URL**
2. Crie **Web Service**:
   - **Environment:** Docker
   - **Dockerfile path:** `./Dockerfile`
   - **Health Check Path:** `/health/ready`
   - **Disk:** mount `/app/storage/attachments` (1 GB)
3. Variáveis: copie de `.env.staging.example`
4. `JWT_SECRET` / `JWT_REFRESH_SECRET`: gere com `openssl rand -base64 48`

### Build e start (Render + Docker)

| Fase      | Comando                                                          |
| --------- | ---------------------------------------------------------------- |
| **Build** | `docker build` (Render executa automaticamente via `Dockerfile`) |
| **Start** | `./scripts/docker-entrypoint.sh` (CMD padrão da imagem)          |

O entrypoint executa:

```bash
pnpm prisma:deploy    # prisma migrate deploy
node dist/server.js   # API
```

### URLs após deploy

Substitua `<service>` pelo nome do serviço Render:

| Recurso      | URL                                            |
| ------------ | ---------------------------------------------- |
| API base     | `https://<service>.onrender.com/api/v1`        |
| Swagger UI   | `https://<service>.onrender.com/api/docs`      |
| OpenAPI JSON | `https://<service>.onrender.com/api/docs.json` |
| Liveness     | `https://<service>.onrender.com/health`        |
| Readiness    | `https://<service>.onrender.com/health/ready`  |

---

## Deploy no Railway

1. **New Project** → **Deploy from GitHub repo**
2. Adicione plugin **PostgreSQL** (injeta `DATABASE_URL`)
3. Railway detecta [`railway.json`](../railway.json):
   - Builder: Dockerfile
   - Health check: `/health/ready`
4. Configure as demais variáveis em **Variables** (ver `.env.staging.example`)
5. Monte volume persistente em `/app/storage/attachments` se usar uploads

### Release command (opcional)

Se preferir migrations fora do start:

| Setting           | Valor                 |
| ----------------- | --------------------- |
| Release command   | `pnpm migrate:deploy` |
| Start command     | `pnpm start:prod`     |
| `SKIP_MIGRATIONS` | `true`                |

Padrão recomendado: entrypoint único (migrate + start).

---

## Migrations

As migrations rodam **automaticamente** a cada deploy/start do container:

```bash
# scripts/docker-entrypoint.sh
pnpm prisma:deploy   # = prisma migrate deploy
exec node dist/server.js
```

Para pular (se a plataforma rodar migrations separadamente):

```bash
SKIP_MIGRATIONS=true
```

Verificar manualmente contra staging:

```bash
DATABASE_URL="postgresql://..." pnpm prisma:deploy
```

---

## Seed demo (manual)

O seed **não roda** no entrypoint nem no deploy. Exige `SEED_DEMO_ENABLED=true` **apenas no comando manual**.

### Da sua máquina (recomendado)

```bash
# 1. Copie a External Database URL do Render/Railway
export DATABASE_URL="postgresql://user:pass@host:5432/supportflow_staging?sslmode=require"

# 2. Execute o seed idempotente
pnpm seed:staging
# ou
./scripts/seed-staging.sh
```

### Credenciais demo padrão

| Recurso     | Valor                                               |
| ----------- | --------------------------------------------------- |
| Admin       | `admin.demo@supportflow.com` / `DemoSupport123!`    |
| Agent       | `agent.demo@supportflow.com` / `DemoSupport123!`    |
| Customer    | `customer.demo@supportflow.com` / `DemoSupport123!` |
| Customer ID | `00000000-0000-4000-8000-000000000002`              |

---

## Validar staging

### 1. Health checks

```bash
BASE=https://supportflow-api-staging.onrender.com

# Liveness (processo vivo)
curl -s "$BASE/health" | jq

# Readiness (banco conectado)
curl -s "$BASE/health/ready" | jq
```

Resposta readiness OK:

```json
{
  "status": "ready",
  "service": "supportflow-backend",
  "checks": { "database": "up" }
}
```

### 2. Swagger

1. Abra `https://<service>.onrender.com/api/docs`
2. `POST /api/v1/auth/login` com credenciais demo
3. **Authorize** → Bearer `{accessToken}`
4. Teste `GET /api/v1/tickets`, `POST /api/v1/tickets`, etc.

### 3. Logs estruturados

No painel Render/Railway, os logs aparecem em **JSON** (Pino):

```json
{
  "level": 30,
  "port": 3000,
  "env": "production",
  "swagger": true,
  "msg": "Server started"
}
```

Configure `LOG_LEVEL=info` (ou `warn` para menos ruído).

---

## Checklist staging

- [ ] `pnpm ci:full` passou localmente
- [ ] PostgreSQL gerenciado criado (não localhost)
- [ ] `DATABASE_URL` configurada no painel
- [ ] `JWT_SECRET` e `JWT_REFRESH_SECRET` com 32+ chars
- [ ] `CORS_ORIGIN` definido
- [ ] Health check: `/health/ready`
- [ ] Disk/volume em `/app/storage/attachments`
- [ ] `SWAGGER_ENABLED=true`
- [ ] `SEED_DEMO_ENABLED=false` no serviço web
- [ ] Primeiro deploy concluído (migrations aplicadas)
- [ ] Seed manual executado (`pnpm seed:staging`)
- [ ] Login testado no Swagger
- [ ] `/health` e `/health/ready` retornam 200

---

## Staging vs produção

| Aspecto   | Staging                           | Produção                    |
| --------- | --------------------------------- | --------------------------- |
| Blueprint | `render.yaml` (nomes `*-staging`) | Duplicar com nomes `*-prod` |
| Banco     | `supportflow_staging`             | `supportflow`               |
| Swagger   | `true` (validação)                | `true` ou `false`           |
| Seed      | Manual pós-deploy                 | Manual ou desabilitado      |
| CORS      | URL staging                       | URL produção                |

---

## Troubleshooting

| Problema               | Solução                                               |
| ---------------------- | ----------------------------------------------------- |
| Deploy falha no build  | Verifique logs Docker; rode `pnpm docker:build` local |
| Loop de restart        | `DATABASE_URL` inválida; confira `sslmode=require`    |
| 503 em `/health/ready` | Postgres ainda iniciando; aguarde 1–2 min             |
| Seed bloqueado         | Use `SEED_DEMO_ENABLED=true` **só** no comando manual |
| Swagger 404            | Confirme `SWAGGER_ENABLED=true` e reinicie o serviço  |

---

## Próximo passo

Após validar staging (health, Swagger, fluxo de tickets, auth), duplique a configuração para **produção** com secrets e banco separados.

Ver também: [deploy.md](./deploy.md) (guia geral de produção).
