# SupportFlow Backend

API REST para gestão de **Atendimento ao Cliente, SAC e Ouvidoria** em modelo **SaaS multi-tenant**. O SupportFlow centraliza o ciclo de vida dos chamados — abertura, triagem, atribuição, SLA, escalação, comentários, anexos, notificações e métricas operacionais — com autenticação JWT, controle de acesso por perfil (RBAC) e auditoria completa de alterações.

**Documentação interativa:** [support-flow-uath.onrender.com/api/docs/](https://support-flow-uath.onrender.com/api/docs/)

> Projeto de portfólio focado em backend. Frontend não faz parte do escopo atual.

---

## API em produção

A API está publicada no **Render** e pode ser explorada pela documentação interativa **Swagger/OpenAPI**:

| Recurso                    | URL                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| **Documentação (Swagger)** | **[support-flow-uath.onrender.com/api/docs/](https://support-flow-uath.onrender.com/api/docs/)** |
| OpenAPI (JSON)             | https://support-flow-uath.onrender.com/api/docs.json                                             |
| Base REST                  | https://support-flow-uath.onrender.com/api/v1                                                    |
| Health (liveness)          | https://support-flow-uath.onrender.com/health                                                    |
| Health (readiness)         | https://support-flow-uath.onrender.com/health/ready                                              |

Para testar endpoints protegidos: faça login em `POST /auth/login`, copie o `accessToken` e use **Authorize** (Bearer) no Swagger.

---

## Problema que resolve

Empresas de médio e grande porte precisam de um sistema unificado para:

- Registrar e acompanhar demandas de clientes (SAC) e manifestações de ouvidoria
- Garantir prazos de atendimento (SLA) e escalar casos críticos automaticamente
- Distribuir chamados entre equipes com rastreabilidade e isolamento por organização (tenant)
- Auditar quem alterou o quê, quando e em qual chamado

O SupportFlow Backend entrega essa base como **API modular**, pronta para integração com qualquer frontend ou canal (portal, e-mail, chat).

---

## Principais funcionalidades

### Chamados (tickets)

- Criação, listagem com **filtros**, **paginação** e **ordenação**
- Transições de status com regras de negócio (máquina de estados)
- Atribuição manual e **auto-atribuição** por carga de trabalho
- **Roteamento automático** (prioridade, categoria ouvidoria, menor fila)
- Cálculo automático de **prioridade** por palavras-chave e categoria
- **SLA** por tenant/categoria/prioridade, com monitoramento de warning e expiração
- **Escalação automática** quando o SLA vence
- **Histórico/auditoria** de eventos (status, prioridade, atribuição, comentários, anexos)
- **Resumo** e **métricas operacionais** por tenant

### Comentários e anexos

- Comentários internos em chamados (visibilidade `INTERNAL`)
- Upload de anexos com validação de tipo, tamanho e conteúdo (PDF, PNG, JPEG, TXT)

### Notificações

- Eventos: chamado criado, atribuído, mudança de status, comentário, anexo, SLA warning/expired, escalação
- Listagem, marcação como lida e isolamento por destinatário

### Autenticação e usuários

- Login com par **access + refresh token** (`POST /auth/login`, `/auth/refresh`, `/auth/logout`)
- Rotação de refresh token a cada renovação de sessão
- Perfis RBAC: `ADMIN`, `SUPERVISOR`, `AGENT`, `CUSTOMER`, `OMBUDSMAN`
- Registro público restrito a `CUSTOMER`; criação de perfis staff exige administrador autenticado
- Listagem de usuários isolada por tenant (`GET /users`, `GET /users/{id}` — apenas `ADMIN`)

> **Clientes (`Customer`)** são entidades internas referenciadas por `customerId` na abertura de chamados — não há endpoints REST públicos de CRUD de clientes.

### Operações e observabilidade

- Health check: `GET /health` (liveness) e `GET /health/ready` (readiness + banco)
- Logs estruturados com Pino
- Documentação **Swagger/OpenAPI** — [produção](https://support-flow-uath.onrender.com/api/docs/) · local: `/api/docs`

---

## Arquitetura

**Modular Monolith** com **Clean Architecture** nos módulos principais (`tickets`, `notifications`):

```
presentation/   → routes, controllers, DTOs (Zod), docs Swagger
application/    → use cases, services de orquestração
domain/         → entidades, enums, regras puras (SLA, transições de status)
infrastructure/ → repositórios Prisma, adapters
```

Fluxo de dependência (camadas externas → internas):

```
HTTP Request → Route → Middleware (auth, RBAC, validate) → Controller → Use Case → Repository → PostgreSQL
```

Conceitos transversais:

| Conceito            | Implementação                                                                |
| ------------------- | ---------------------------------------------------------------------------- |
| **Multi-tenant**    | `tenantId` no JWT e em todas as queries de negócio                           |
| **RBAC**            | `shared/security/rbac.ts` + middleware `authorize` + regras nos use cases    |
| **SLA**             | Cálculo na abertura + monitoramento (warning/expired) + escalação automática |
| **Auditoria**       | `TicketHistory` com eventos tipados                                          |
| **Validação**       | Zod via `validateRequest` em body, params e query                            |
| **Erros**           | Payload padronizado `{ statusCode, error, message, requestId? }`             |
| **Observabilidade** | Pino estruturado, `requestId` por requisição, logs de negócio                |
| **Segurança**       | Helmet, CORS, rate limit, JWT + refresh, redação de dados sensíveis nos logs |

---

## Estrutura de pastas

```
supportflow-backend/
├── .github/workflows/ci.yml    # Pipeline GitHub Actions
├── prisma/
│   ├── schema.prisma           # Modelo de dados
│   └── migrations/             # Migrations versionadas
├── scripts/
│   └── docker-entrypoint.sh    # Migrate + start em produção
├── src/
│   ├── app.ts                  # Composição Express (middlewares, rotas)
│   ├── main.ts                 # Bootstrap do servidor
│   ├── server.ts               # Entrypoint
│   ├── config/                 # Env (Zod), Swagger
│   ├── modules/
│   │   ├── auth/               # Login, refresh, logout
│   │   ├── users/              # Gestão de usuários
│   │   ├── tickets/            # Domínio principal (Clean Architecture)
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   ├── presentation/   # routes, controllers, docs/*.swagger.ts
│   │   │   └── integration/
│   │   ├── notifications/
│   │   ├── customers/          # Repositório interno (sem rotas REST)
│   │   ├── knowledge-base/     # Scaffold (roadmap)
│   │   └── support/            # Scaffold (roadmap)
│   ├── shared/
│   │   ├── http/               # Middlewares, health, errors
│   │   ├── security/           # JWT, hash de senha
│   │   ├── database/           # Prisma client
│   │   ├── logger/             # Pino
│   │   └── storage/            # Upload em disco
│   └── test/
│       ├── unit/               # Setup global de mocks
│       └── integration/          # Fixtures, DB de teste
├── docs/
│   ├── API_DOCUMENTATION.md    # Guia da API e Swagger
│   ├── deploy.md               # Deploy em produção
│   ├── staging.md              # Deploy em staging (Render/Railway)
│   └── DOCKER.md               # Guia de container
├── render.yaml                 # Blueprint Render
├── Dockerfile                  # Multi-stage (pnpm + Node 22)
├── docker-compose.yml          # PostgreSQL + API
├── vitest.config.ts            # Testes unitários
└── vitest.integration.config.ts
```

---

## Tecnologias

| Camada    | Stack                               |
| --------- | ----------------------------------- |
| Runtime   | Node.js 22+, TypeScript 6           |
| HTTP      | Express 5                           |
| ORM       | Prisma 7 + PostgreSQL 16            |
| Validação | Zod 4                               |
| Auth      | JWT (jsonwebtoken) + bcryptjs       |
| Docs      | swagger-jsdoc + swagger-ui-express  |
| Logs      | Pino + pino-http                    |
| Testes    | Vitest + Supertest                  |
| Qualidade | ESLint, Prettier, Husky, commitlint |
| Container | Docker multi-stage, Docker Compose  |
| CI        | GitHub Actions                      |

---

## Requisitos

- **Node.js** ≥ 22
- **pnpm** 9.15+ (`corepack enable`)
- **Docker** e **Docker Compose** (banco local ou stack completa)
- **PostgreSQL** 16 (via Docker ou instância externa)

---

## Variáveis de ambiente

A configuração é centralizada em `src/config/env.ts` (validação com Zod). A aplicação **não inicia** se variáveis obrigatórias estiverem ausentes ou inválidas.

### Configuração local

```bash
cp .env.example .env
# Ajuste DATABASE_URL, JWT_SECRET e demais valores conforme seu ambiente
pnpm env:check   # valida sem subir o servidor
```

Para produção, use `.env.production.example` como referência ao configurar o provedor de hospedagem (não commite segredos reais).

### Variáveis

| Variável                       | Obrigatória | Padrão (dev)                                | Descrição                                                              |
| ------------------------------ | ----------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`                 | **Sim**     | —                                           | Connection string PostgreSQL (Prisma)                                  |
| `JWT_SECRET`                   | **Sim**     | —                                           | Segredo do access token (mín. 32 caracteres em `production`)           |
| `NODE_ENV`                     | Não         | `development`                               | `development`, `test` ou `production`                                  |
| `PORT`                         | Não         | `3000`                                      | Porta HTTP da API                                                      |
| `JWT_EXPIRES_IN`               | Não         | `1d`                                        | Expiração do access token                                              |
| `JWT_REFRESH_SECRET`           | **Sim**     | —                                           | Segredo do refresh token (mín. 32 caracteres em `production`)          |
| `JWT_REFRESH_EXPIRES_IN`       | Não         | `7d`                                        | Expiração do refresh token                                             |
| `CORS_ORIGIN`                  | Não         | `http://localhost:5173`                     | Origem permitida pelo CORS                                             |
| `RATE_LIMIT_ENABLED`           | Não         | `true`                                      | Habilita rate limit global e em `/auth/login`                          |
| `RATE_LIMIT_WINDOW_MS`         | Não         | `900000`                                    | Janela do rate limit global (ms)                                       |
| `RATE_LIMIT_MAX_REQUESTS`      | Não         | `100`                                       | Máximo de requisições por janela (global)                              |
| `AUTH_RATE_LIMIT_WINDOW_MS`    | Não         | `900000`                                    | Janela do rate limit de login (ms)                                     |
| `AUTH_RATE_LIMIT_MAX_REQUESTS` | Não         | `20`                                        | Máximo de tentativas de login por janela                               |
| `UPLOAD_MAX_SIZE_MB`           | Não         | `10`                                        | Tamanho máximo de upload (MB)                                          |
| `UPLOAD_DIR`                   | Não         | `storage/attachments`                       | Diretório de anexos (relativo ao cwd ou absoluto)                      |
| `LOG_LEVEL`                    | Não         | `debug` (dev), `warn` (test), `info` (prod) | Nível de log Pino (`trace`, `debug`, `info`, `warn`, `error`, `fatal`) |
| `SWAGGER_ENABLED`              | Não         | `true`                                      | Documentação OpenAPI em `/api/docs` (`false` para desligar)            |
| `DATABASE_URL_TEST`            | Integração  | porta `5433`                                | Banco exclusivo para testes E2E locais                                 |

### Validar configuração

```bash
pnpm env:check
```

Se faltar alguma variável obrigatória, a saída lista cada campo com mensagem clara, por exemplo:

```
Invalid or missing environment variables:
  - DATABASE_URL: DATABASE_URL is required
  - JWT_SECRET: JWT_SECRET is required

Copy .env.example to .env and configure the required values.
```

O mesmo erro aparece ao executar `pnpm dev`, `pnpm start` ou `pnpm build` (o módulo `env.ts` é carregado na inicialização).

---

## Deploy em produção

Guia completo: **[docs/deploy.md](docs/deploy.md)** · Staging: **[docs/staging.md](docs/staging.md)**

**API publicada:** [support-flow-uath.onrender.com](https://support-flow-uath.onrender.com) · [Swagger](https://support-flow-uath.onrender.com/api/docs/)

Resumo:

- Imagem Docker multi-stage (`Dockerfile`) com `NODE_ENV=production`
- Entrypoint: `prisma migrate deploy` → `node dist/server.js` (seed **nunca** automático)
- Variáveis: [`.env.production.example`](.env.production.example) · Staging: [`.env.staging.example`](.env.staging.example)
- Blueprint Render (staging): [`render.yaml`](render.yaml) · Railway: [`railway.json`](railway.json)
- Health: `GET /health` (liveness) · `GET /health/ready` (readiness + banco)

```bash
pnpm docker:build
docker compose up --build   # stack local API + Postgres

# Seed demo em staging (manual, após deploy):
DATABASE_URL="postgresql://..." pnpm seed:staging
```

---

## Primeiro deploy no Render (staging)

### O que o Blueprint provisiona

| Recurso     | Nome                          | Detalhe                                       |
| ----------- | ----------------------------- | --------------------------------------------- |
| Web Service | `supportflow-api-staging`     | Docker (`Dockerfile`), health `/health/ready` |
| PostgreSQL  | `supportflow-db-staging`      | Banco `supportflow_staging`                   |
| Disk        | `supportflow-uploads-staging` | Uploads em `/app/storage/attachments`         |

### Build e start (Docker)

| Fase           | Comando                                               |
| -------------- | ----------------------------------------------------- |
| **Build**      | `docker build -f Dockerfile .` (automático no Render) |
| **Start**      | `./scripts/docker-entrypoint.sh`                      |
| **Migrations** | `pnpm prisma:deploy` dentro do entrypoint             |
| **API**        | `node dist/server.js`                                 |

O Render injeta `PORT` automaticamente — a API escuta `process.env.PORT`.

### Publicar via Blueprint

1. Garanta que `main` no GitHub contém `render.yaml` e `Dockerfile`
2. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
3. Conecte o repositório `vivianeaguiarc/support-flow`
4. Defina **`CORS_ORIGIN`** quando solicitado (URL do frontend staging ou placeholder HTTPS)
5. **Apply** e aguarde o build (~5–10 min no Starter)
6. Após **Live**, copie a **External Database URL**
7. Seed manual (da sua máquina):
   ```bash
   export DATABASE_URL="postgresql://...?sslmode=require"
   pnpm seed:staging
   ```

### Validar após deploy

```bash
BASE_URL=https://support-flow-uath.onrender.com pnpm validate:staging
```

Ou manualmente:

| Check     | URL                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------- |
| Liveness  | https://support-flow-uath.onrender.com/health                                                        |
| Readiness | https://support-flow-uath.onrender.com/health/ready                                                  |
| Swagger   | [https://support-flow-uath.onrender.com/api/docs/](https://support-flow-uath.onrender.com/api/docs/) |
| Login     | `POST https://support-flow-uath.onrender.com/api/v1/auth/login`                                      |

Credenciais demo (após seed): `admin.demo@supportflow.com` / `DemoSupport123!`

Guia detalhado: **[docs/staging.md](docs/staging.md)**

---

## Como rodar localmente

```bash
# 1. Dependências
pnpm install

# 2. Banco (se ainda não estiver rodando)
pnpm db:up

# 3. Migrations em desenvolvimento
pnpm prisma:migrate

# 4. (Opcional) Dados demo para Swagger
pnpm prisma:deploy
pnpm seed

# 5. Servidor com hot reload
pnpm dev
```

A API ficará disponível em http://localhost:3000.

| Ambiente     | Swagger                                                      | Base REST                                     |
| ------------ | ------------------------------------------------------------ | --------------------------------------------- |
| **Produção** | [api/docs](https://support-flow-uath.onrender.com/api/docs/) | https://support-flow-uath.onrender.com/api/v1 |
| Local        | http://localhost:3000/api/docs                               | http://localhost:3000/api/v1                  |

Health local: http://localhost:3000/health

---

## Observabilidade (logs e tracing)

A API usa **Pino** para logs estruturados em JSON (ou `pino-pretty` em desenvolvimento).

### Request tracing

- Cada requisição recebe um `requestId` (UUID), gerado automaticamente ou reutilizado do header `X-Request-Id`.
- O mesmo valor é retornado no header de resposta `X-Request-Id` e incluído em respostas de erro (`requestId` no JSON).
- O contexto da requisição fica disponível via `AsyncLocalStorage` para logs de negócio e erros.

### Níveis de log

Configure com `LOG_LEVEL` (padrão: `debug` em dev, `warn` em testes, `info` em produção).

### Eventos de negócio logados

| Evento                  | Quando                                        |
| ----------------------- | --------------------------------------------- |
| `ticket.created`        | Ticket criado com sucesso                     |
| `ticket.status_changed` | Status alterado                               |
| `ticket.assigned`       | Ticket atribuído a agente                     |
| `ticket.escalated`      | Escalonamento por SLA                         |
| `auth.login_failed`     | Credenciais inválidas no login                |
| `auth.refresh_failed`   | Refresh token inválido/revogado/expirado      |
| `auth.unauthorized`     | Falha de autenticação JWT em rotas protegidas |

### Dados sensíveis

Senhas, tokens JWT, refresh tokens, `Authorization` e cookies são **redigidos** nos logs (`[Redacted]`). Campos sensíveis também são omitidos em logs de negócio via `sanitizeLogData`.

### Testar localmente

```bash
# Logs detalhados
LOG_LEVEL=debug pnpm dev

# Simular tracing com header customizado
curl -i -H "X-Request-Id: meu-id-debug" http://localhost:3000/api/v1/health

# Forçar erro e ver requestId na resposta
curl -i -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"x@y.com","password":"wrong"}'
```

Health checks (`/health`, `/health/ready`, `/api/v1/health`) não geram log HTTP automático para reduzir ruído.

---

## Migrations

| Comando                                           | Uso                                                                    |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| `pnpm prisma:migrate`                             | Criar/aplicar migrations em **desenvolvimento** (`prisma migrate dev`) |
| `pnpm prisma:deploy`                              | Aplicar migrations em **produção/CI** (`prisma migrate deploy`)        |
| `pnpm prisma:validate`                            | Validar schema Prisma                                                  |
| `pnpm prisma:generate`                            | Gerar Prisma Client                                                    |
| `pnpm prisma:studio`                              | UI visual do banco                                                     |
| `pnpm prisma:seed` / `pnpm db:seed` / `pnpm seed` | Popula dados demo idempotentes                                         |
| `pnpm db:reset:demo`                              | Remove e recria apenas o tenant demo                                   |

Em Docker/produção, as migrations rodam automaticamente via `scripts/docker-entrypoint.sh`. O **seed não roda automaticamente** — execute manualmente quando necessário.

## Dados Demo

Base fictícia e idempotente para testes locais, validação em staging/produção e apresentação do portfólio. O seed **não roda automaticamente** no deploy — execute manualmente após as migrations.

### O que é criado

| Recurso                | Detalhes                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Tenant**             | `SupportFlow Demo` (`slug: demo`)                                                                             |
| **Usuários**           | Admin, agente e cliente (roles `ADMIN`, `AGENT`, `CUSTOMER`)                                                  |
| **Cliente (entidade)** | Registro interno usado como `customerId` na abertura de chamados                                              |
| **Categorias**         | SAC Geral (72h), Ouvidoria (48h), Suporte Técnico (24h)                                                       |
| **Chamados**           | 6 tickets com status distintos (`OPEN`, `IN_PROGRESS`, `WAITING_CUSTOMER`, `ESCALATED`, `RESOLVED`, `CLOSED`) |
| **Interações**         | Comentários internos, histórico de eventos e notificações demo                                                |

### Credenciais (somente ambiente demo)

| Perfil          | E-mail                          | Senha padrão      |
| --------------- | ------------------------------- | ----------------- |
| Admin           | `admin.demo@supportflow.com`    | `DemoSupport123!` |
| Agente          | `agent.demo@supportflow.com`    | `DemoSupport123!` |
| Cliente (login) | `customer.demo@supportflow.com` | `DemoSupport123!` |

| Entidade                      | Valor                                  |
| ----------------------------- | -------------------------------------- |
| `customerId` (abrir chamados) | `00000000-0000-4000-8000-000000000002` |
| Tenant slug                   | `demo`                                 |

Senhas são armazenadas com **bcrypt** (mesmo mecanismo da autenticação da API). Credenciais customizáveis via `SEED_DEMO_*` em [`.env.example`](.env.example).

### Como executar

```bash
# Local — após migrations
pnpm prisma:deploy
pnpm db:seed
# aliases equivalentes: pnpm prisma:seed | pnpm seed

# Staging/produção (exige flag explícita)
SEED_DEMO_ENABLED=true NODE_ENV=production DATABASE_URL="postgresql://..." pnpm db:seed
# ou
pnpm seed:staging

# Recriar do zero apenas os dados demo (remove tenant demo e repopula)
pnpm db:reset:demo
```

O seed é **idempotente**: `upsert` por chaves estáveis (`id`, `tenantId+email`, `tenantId+protocol`). Rodar novamente atualiza senhas e conteúdo sem duplicar registros.

**Produção:** exige `SEED_DEMO_ENABLED=true`. Não é executado no entrypoint Docker.

### Testar no Swagger

1. Abra a [documentação em produção](https://support-flow-uath.onrender.com/api/docs/) ou http://localhost:3000/api/docs
2. `POST /auth/login` com:
   ```json
   { "email": "admin.demo@supportflow.com", "password": "DemoSupport123!" }
   ```
3. Copie o `accessToken` → **Authorize** → `Bearer <token>`
4. Explore, por exemplo:
   - `GET /tickets` — lista os 6 chamados demo
   - `GET /tickets/{id}/comments` — comentários internos
   - `GET /notifications` — notificações do usuário logado
   - `POST /tickets` — novo chamado usando o `customerId` acima

---

## Testes

### Validar antes de commitar (espelha o CI do GitHub Actions)

```bash
# Pipeline completo — quality + integração/E2E
pnpm ci:full

# Equivalente manual:
pnpm ci:check && pnpm test:db:prepare && pnpm prisma:deploy && pnpm test:integration
```

| Script                | Espelha o job CI                                                       |
| --------------------- | ---------------------------------------------------------------------- |
| `pnpm ci:check`       | **Quality checks** (format, lint, typecheck, prisma, unitários, build) |
| `pnpm ci:integration` | **Integration tests** (generate, migrate deploy, E2E)                  |
| `pnpm ci:full`        | Ambos os jobs, em sequência                                            |

Requisitos para integração: Docker rodando (Postgres em `localhost:5433` via `docker compose`).

### Comandos individuais

```bash
# Preparar banco de teste (Docker + database supportflow_test)
pnpm test:db:prepare

# Testes unitários (135, inclui cobertura Swagger)
pnpm test

# Testes de integração/E2E (160) — requer PostgreSQL em localhost:5433
pnpm test:integration
# alias equivalente
pnpm test:e2e

# Cobertura
pnpm test:coverage
```

---

## Swagger / OpenAPI

Documentação interativa gerada a partir de JSDoc em `*.swagger.ts` (validada por `src/config/swagger.spec.ts`).

Guia detalhado: **[docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)**

### Produção

| Recurso       | URL                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------ |
| UI interativa | **[support-flow-uath.onrender.com/api/docs/](https://support-flow-uath.onrender.com/api/docs/)** |
| Spec JSON     | https://support-flow-uath.onrender.com/api/docs.json                                             |
| Redirects     | `/api-docs` → `/api/docs`                                                                        |

### Local

| Recurso       | URL                                 |
| ------------- | ----------------------------------- |
| UI interativa | http://localhost:3000/api/docs      |
| Spec JSON     | http://localhost:3000/api/docs.json |
| Redirects     | `/api-docs` → `/api/docs`           |

**Habilitado por padrão** (`SWAGGER_ENABLED=true`). Para desligar: `SWAGGER_ENABLED=false`.

### Autenticar no Swagger

1. `POST /auth/login` → copie `accessToken`
2. Clique em **Authorize** → informe `Bearer <accessToken>`
3. Teste endpoints protegidos

### Endpoints documentados (prefixo `/api/v1`)

| Tag                | Rotas                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| Authentication     | `POST /auth/login`, `/auth/refresh`, `/auth/logout`                                                    |
| Users              | `POST/GET /users`, `GET /users/{id}`                                                                   |
| Tickets            | CRUD, status, assign, transitions, history, summary, metrics, auto-assign, route, recalculate-priority |
| Ticket Comments    | `POST/GET /tickets/{id}/comments`                                                                      |
| Ticket Attachments | `POST/GET /tickets/{id}/attachments`, `DELETE .../{attachmentId}` (multipart)                          |
| Notifications      | `GET /notifications`, `PATCH /{id}/read`, `PATCH /read-all`                                            |
| Health             | `GET /health`, `GET /health/ready`                                                                     |

---

## Scripts disponíveis

| Script                                            | Descrição                                               |
| ------------------------------------------------- | ------------------------------------------------------- |
| `pnpm dev`                                        | Servidor com `tsx watch`                                |
| `pnpm build`                                      | Compila TypeScript (`dist/`)                            |
| `pnpm start` / `pnpm start:prod`                  | Executa build compilado                                 |
| `pnpm start:docker`                               | Entrypoint Docker (migrate + start)                     |
| `pnpm migrate:deploy`                             | Aplica migrations em produção (`prisma migrate deploy`) |
| `pnpm docker:build`                               | Build da imagem Docker                                  |
| `pnpm docker:run`                                 | Executa container local (requer env vars)               |
| `pnpm env:check`                                  | Valida variáveis de ambiente                            |
| `pnpm lint` / `pnpm lint:fix`                     | ESLint                                                  |
| `pnpm format` / `pnpm format:check`               | Prettier                                                |
| `pnpm typecheck`                                  | `tsc --noEmit`                                          |
| `pnpm ci:check`                                   | Pipeline quality (format, lint, typecheck, test, build) |
| `pnpm ci:integration`                             | Pipeline integração (prisma generate/deploy + E2E)      |
| `pnpm ci:full`                                    | Pipeline completo local (espelha GitHub Actions)        |
| `pnpm db:up` / `pnpm db:down`                     | Sobe/para containers Docker                             |
| `pnpm test:db:prepare`                            | Prepara banco para integração                           |
| `pnpm prisma:migrate`                             | Migrations em desenvolvimento                           |
| `pnpm prisma:deploy`                              | Migrations em produção/CI                               |
| `pnpm prisma:validate`                            | Valida schema Prisma                                    |
| `pnpm prisma:generate`                            | Gera Prisma Client                                      |
| `pnpm prisma:studio`                              | UI visual do banco                                      |
| `pnpm prisma:seed` / `pnpm db:seed` / `pnpm seed` | Popula dados demo idempotentes                          |
| `pnpm db:reset:demo`                              | Remove e recria apenas o tenant demo                    |
| `pnpm seed:staging`                               | Seed demo em staging (`SEED_DEMO_ENABLED=true`)         |
| `pnpm test` / `pnpm test:integration`             | Testes unitários / E2E                                  |
| `pnpm test:watch` / `pnpm test:coverage`          | Watch mode / cobertura                                  |

---

## CI/CD

Workflow **GitHub Actions** (`.github/workflows/ci.yml`), executado em todo `push` e `pull_request`:

### Job `Quality checks`

1. Checkout
2. Setup pnpm 9 + Node.js 22 (com cache)
3. `pnpm install --frozen-lockfile`
4. `pnpm format:check`
5. `pnpm lint`
6. `pnpm typecheck`
7. `pnpm prisma:validate`
8. `pnpm prisma:generate`
9. `pnpm test` (unitários)
10. `pnpm build`

### Job `Integration tests (E2E)`

Executa em paralelo ao job de qualidade, com **PostgreSQL 16** como service container (sem banco externo):

1. Checkout + setup pnpm/Node (com cache)
2. `pnpm install --frozen-lockfile`
3. `pnpm prisma:generate`
4. `pnpm prisma:deploy` — aplica migrations no Postgres do CI
5. `pnpm test:integration` — **160** testes E2E com Supertest + banco real

Variáveis no CI:

```text
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/supportflow_test?schema=public
```

Deploy staging via blueprint Render ([`render.yaml`](render.yaml)) ou Railway ([`railway.json`](railway.json)). Guias: [docs/staging.md](docs/staging.md) · [docs/deploy.md](docs/deploy.md).

---

## Decisões técnicas

1. **Express puro (não NestJS)** — controle explícito de middlewares e menor curva para demonstrar arquitetura manual.
2. **Clean Architecture nos módulos críticos** — `tickets` e `notifications` separam regras de negócio de HTTP e Prisma, facilitando testes e evolução.
3. **Multi-tenant por coluna (`tenantId`)** — isolamento simples e eficiente para SaaS B2B nesta fase.
4. **Prisma + PostgreSQL** — migrations versionadas, tipagem forte e adapter PG para produção.
5. **Zod na borda HTTP** — validação declarativa e mensagens de erro consistentes.
6. **JWT + refresh tokens com rotação** — sessões renováveis sem reautenticar a cada expiração do access token.
7. **Testes em duas camadas** — unitários rápidos (use cases com mocks) + integração com banco real (Supertest).
8. **Docker multi-stage** — imagem enxuta, usuário não-root, health check e migrate no entrypoint.
9. **Swagger habilitado por padrão** — cobertura validada por teste (`swagger.spec.ts`); `SWAGGER_ENABLED=false` desliga se necessário.
10. **Observabilidade** — logs Pino estruturados, `requestId` por requisição, eventos de negócio auditáveis.
11. **Histórico como trilha de auditoria** — eventos imutáveis em `TicketHistory`, não apenas log de aplicação.
12. **Cross-tenant → 403** — acesso a recurso de outro tenant retorna Forbidden (não mascara como 404).

---

## Roadmap backend

- [ ] Endpoint autenticado de **download de anexos** (sem expor `storagePath`)
- [ ] Comentários com visibilidade **pública** para clientes
- [ ] Módulo **knowledge-base** (artigos de ajuda)
- [ ] Refatorar módulos `auth` e `users` para Clean Architecture
- [ ] Scheduler/cron para SLA e escalação em background
- [x] Seed de dados iniciais (tenant + admin) para deploy
- [x] Deploy automatizado staging (blueprint Render + Railway + docs/staging.md)

---

## Autora

**Viviane Aguiar**

- LinkedIn: [linkedin.com/in/vivianeaguiarc](https://linkedin.com/in/vivianeaguiarc)
- Portfolio: [vivianeaguiardev.com.br](https://vivianeaguiardev.com.br)

---

## Licença

ISC
