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

| Conceito            | Implementação                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Multi-tenant**    | `tenantId` no JWT e em todas as queries de negócio                                                                        |
| **RBAC**            | `shared/security/rbac.ts` + middleware `authorize` + regras nos use cases                                                 |
| **SLA**             | Cálculo na abertura + monitoramento (warning/expired) + escalação automática                                              |
| **Auditoria**       | `TicketHistory` com eventos tipados                                                                                       |
| **Validação**       | Zod via `validateRequest` em body, params e query                                                                         |
| **Erros**           | Payload padronizado `{ statusCode, error, message, requestId? }`                                                          |
| **Observabilidade** | Pino estruturado, `requestId` por requisição, logs de negócio                                                             |
| **Segurança**       | Helmet, CORS, rate limits por endpoint, lock de login, auditoria de segurança, validação Zod strict, sanitização de texto |

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

| Variável                                    | Obrigatória | Padrão (dev)                                | Descrição                                                              |
| ------------------------------------------- | ----------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`                              | **Sim**     | —                                           | Connection string PostgreSQL (Prisma)                                  |
| `JWT_SECRET`                                | **Sim**     | —                                           | Segredo do access token (mín. 32 caracteres em `production`)           |
| `NODE_ENV`                                  | Não         | `development`                               | `development`, `test` ou `production`                                  |
| `PORT`                                      | Não         | `3000`                                      | Porta HTTP da API                                                      |
| `JWT_EXPIRES_IN`                            | Não         | `1d`                                        | Expiração do access token                                              |
| `JWT_REFRESH_SECRET`                        | **Sim**     | —                                           | Segredo do refresh token (mín. 32 caracteres em `production`)          |
| `JWT_REFRESH_EXPIRES_IN`                    | Não         | `7d`                                        | Expiração do refresh token                                             |
| `CORS_ORIGIN`                               | Não         | `http://localhost:5173`                     | Origem permitida pelo CORS                                             |
| `RATE_LIMIT_ENABLED`                        | Não         | `true`                                      | Habilita rate limit global e em `/auth/login`                          |
| `RATE_LIMIT_WINDOW_MS`                      | Não         | `900000`                                    | Janela do rate limit global (ms)                                       |
| `RATE_LIMIT_MAX_REQUESTS`                   | Não         | `100`                                       | Máximo de requisições por janela (global)                              |
| `AUTH_RATE_LIMIT_WINDOW_MS`                 | Não         | `900000`                                    | Janela do rate limit de login (ms)                                     |
| `AUTH_RATE_LIMIT_MAX_REQUESTS`              | Não         | `20`                                        | Máximo de tentativas de login por janela                               |
| `TICKET_CREATE_RATE_LIMIT_WINDOW_MS`        | Não         | `900000`                                    | Janela do rate limit de criação de tickets (ms)                        |
| `TICKET_CREATE_RATE_LIMIT_MAX_REQUESTS`     | Não         | `30`                                        | Máximo de criações de ticket por janela                                |
| `ATTACHMENT_UPLOAD_RATE_LIMIT_WINDOW_MS`    | Não         | `900000`                                    | Janela do rate limit de upload de anexos (ms)                          |
| `ATTACHMENT_UPLOAD_RATE_LIMIT_MAX_REQUESTS` | Não         | `20`                                        | Máximo de uploads por janela                                           |
| `API_KEY_RATE_LIMIT_WINDOW_MS`              | Não         | `900000`                                    | Janela do rate limit de API Keys (ms)                                  |
| `API_KEY_RATE_LIMIT_MAX_REQUESTS`           | Não         | `10`                                        | Máximo de operações de API Key por janela                              |
| `WEBHOOK_RATE_LIMIT_WINDOW_MS`              | Não         | `900000`                                    | Janela do rate limit de webhooks (ms)                                  |
| `WEBHOOK_RATE_LIMIT_MAX_REQUESTS`           | Não         | `15`                                        | Máximo de operações de webhook por janela                              |
| `LOGIN_MAX_FAILED_ATTEMPTS`                 | Não         | `5`                                         | Tentativas inválidas antes do lock temporário de conta                 |
| `LOGIN_LOCK_DURATION_MS`                    | Não         | `900000`                                    | Duração do lock de conta após brute force (ms)                         |
| `UPLOAD_MAX_SIZE_MB`                        | Não         | `10`                                        | Tamanho máximo de upload (MB)                                          |
| `UPLOAD_DIR`                                | Não         | `storage/attachments`                       | Diretório de anexos (relativo ao cwd ou absoluto)                      |
| `LOG_LEVEL`                                 | Não         | `debug` (dev), `warn` (test), `info` (prod) | Nível de log Pino (`trace`, `debug`, `info`, `warn`, `error`, `fatal`) |
| `SWAGGER_ENABLED`                           | Não         | `true`                                      | Documentação OpenAPI em `/api/docs` (`false` para desligar)            |
| `DATABASE_URL_TEST`                         | Integração  | porta `5433`                                | Banco exclusivo para testes E2E locais                                 |

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

## Multi-tenant (isolamento por organização)

O SupportFlow usa o modelo **Tenant** (organização) com `tenantId` em todas as entidades sensíveis. Cada requisição autenticada opera dentro de um **tenant scope** derivado do JWT e, opcionalmente, de hints externos.

### Resolução do tenant por requisição

Ordem de precedência dos hints (antes do JWT):

1. **Subdomínio** — `{slug}.TENANT_BASE_DOMAIN` (ex.: `acme.supportflow.com` → slug `acme`)
2. **Header `x-tenant-id`** — UUID da organização
3. **Header `x-tenant-slug`** — slug da organização

Após autenticação, o middleware aplica o escopo:

| Papel                              | Comportamento                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `AGENT`, `ADMIN`, `CUSTOMER`, etc. | Sempre restrito ao `tenantId` do JWT; header de outro tenant → `403 Cross-tenant access denied`        |
| `SUPER_ADMIN`                      | Pode operar em qualquer tenant via header/subdomínio; feature flags globais são exclusivas deste papel |

O tenant efetivo fica em `authUser.scopedTenantId` e é usado por `resolveTenantId()` nos serviços.

### Entidades com `tenantId`

Users, customers, tickets, comments, attachments, history, notifications, knowledge articles, automation rules/executions, API keys, webhooks/deliveries, satisfaction surveys, categories.

**Feature flags** permanecem **globais da plataforma** (sem `tenantId`), gerenciadas apenas por `SUPER_ADMIN`.

### Helpers

| Arquivo                                                  | Função                                             |
| -------------------------------------------------------- | -------------------------------------------------- |
| `src/shared/http/middlewares/tenant-scope.middleware.ts` | Resolve contexto + aplica escopo                   |
| `src/shared/tenant/resolve-tenant.ts`                    | Extrai hints de header/subdomínio                  |
| `src/shared/tenant/tenant-scope.ts`                      | `withTenantScope()` para queries Prisma            |
| `src/shared/security/tenant-access.ts`                   | `assertTicketForTenant`, `assertCrossTenantAccess` |

### Demo seed

O seed cria **duas organizações**:

- **Tenant A** (`demo`) — dados completos de demonstração
- **Tenant B** (`demo-b`) — organização secundária com admin `admin.demo-b@supportflow.com`

---

## Hardening de segurança da API

Camadas adicionais além de JWT/RBAC/multi-tenant:

### Proteções HTTP

- **Helmet** com HSTS (produção), `Referrer-Policy`, `Cross-Origin-Resource-Policy`
- **CORS** restrito à origem configurada, métodos explícitos e headers permitidos (`Authorization`, `x-api-key`, `x-tenant-id`, etc.)
- **Rate limit global** + limites específicos por operação sensível (ver tabela abaixo)
- **Payload JSON** limitado a `1mb`

### Brute force e lock de login

Após `LOGIN_MAX_FAILED_ATTEMPTS` senhas inválidas consecutivas, a conta recebe lock temporário (`LOGIN_LOCK_DURATION_MS`, HTTP `423`). Tentativas bem-sucedidas resetam o contador. Rate limit por IP em `/auth/login` e `/auth/refresh` permanece ativo.

### Validação e sanitização

- Schemas Zod em modo **strict** (rejeitam campos desconhecidos)
- Campos textuais sensíveis passam por `sanitizeText()` (remove tags HTML e padrões perigosos)
- Erros inesperados retornam mensagem genérica em produção/teste (detalhes só em `development`)

### Auditoria de segurança (`security_audit_logs`)

Eventos persistidos: `LOGIN_FAILED`, `LOGIN_LOCKED`, `ACCESS_DENIED`, `API_KEY_CREATED`, `API_KEY_REVOKED`, `USER_PERMISSION_ASSIGNED`.

### Rate limits por endpoint

| Endpoint / grupo                         | Variáveis de ambiente            |
| ---------------------------------------- | -------------------------------- |
| `POST /auth/login`, `POST /auth/refresh` | `AUTH_RATE_LIMIT_*`              |
| `POST /tickets`                          | `TICKET_CREATE_RATE_LIMIT_*`     |
| `POST /tickets/:id/attachments`          | `ATTACHMENT_UPLOAD_RATE_LIMIT_*` |
| `POST/PATCH /api-keys/*`                 | `API_KEY_RATE_LIMIT_*`           |
| `POST/PATCH /webhooks/*`                 | `WEBHOOK_RATE_LIMIT_*`           |

---

## Event Bus interno (Domain Events)

O backend usa um **Event Bus in-process** para desacoplar efeitos colaterais dos use cases de tickets. Após persistir o estado e o histórico, o use case publica um **domain event**; handlers registrados reagem de forma assíncrona (sem bloquear a transação principal).

### Fluxo

```mermaid
sequenceDiagram
  participant UC as Use Case
  participant DB as PostgreSQL
  participant EB as EventBus
  participant H as Handlers

  UC->>DB: Persiste ticket + histórico
  UC->>EB: publish(DomainEvent)
  EB->>H: audit / notification / automation / webhook
  Note over H: Falha isolada por handler (Promise.allSettled)
```

1. **Use case** valida regras de domínio, persiste no banco e grava `TicketHistory` (auditoria persistida).
2. **`eventBus.publish()`** emite o evento com `eventId`, `correlationId` (do ALS da requisição), `aggregateId` e `payload` tipado.
3. **Handlers** inscritos executam em paralelo: auditoria de negócio (`logBusinessEvent`), notificações, automações (BullMQ) e webhooks (BullMQ).
4. Falha em um handler **não interrompe** os demais; erros são logados como `domain_event.handler_failed`.

### Eventos disponíveis

| Evento                     | Nome (`eventName`)      | Quando é publicado         |
| -------------------------- | ----------------------- | -------------------------- |
| `TicketCreatedEvent`       | `ticket.created`        | Abertura de ticket         |
| `TicketAssignedEvent`      | `ticket.assigned`       | Atribuição ou reatribuição |
| `TicketStatusChangedEvent` | `ticket.status_changed` | Mudança de status          |
| `TicketResolvedEvent`      | `ticket.resolved`       | Status → `RESOLVED`        |
| `TicketClosedEvent`        | `ticket.closed`         | Status → `CLOSED`          |
| `SlaWarningEvent`          | `sla.warning`           | SLA próximo do vencimento  |
| `SlaBreachedEvent`         | `sla.breached`          | SLA estourado              |
| `CsatSubmittedEvent`       | `csat.submitted`        | Pesquisa CSAT enviada      |

### Handlers registrados

Registro central em `src/shared/events/register-event-handlers.ts`, chamado em `createApp()`:

| Handler                       | Responsabilidade                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| `ticket-audit.handler`        | Logs estruturados de negócio (`ticket.created`, `ticket.assigned`, `ticket.status_changed`) |
| `ticket-notification.handler` | `NotificationEventService` (in-app/e-mail)                                                  |
| `ticket-automation.handler`   | `AutomationEngine.processEvent` → fila BullMQ                                               |
| `ticket-webhook.handler`      | `WebhookDispatcher.dispatch` → fila BullMQ                                                  |

### Código principal

| Arquivo                                        | Papel                           |
| ---------------------------------------------- | ------------------------------- |
| `src/shared/events/domain-event.ts`            | Contrato `DomainEvent`          |
| `src/shared/events/event-bus.ts`               | `publish` / `subscribe` + logs  |
| `src/shared/events/ticket/ticket-events.ts`    | Factories dos eventos de ticket |
| `src/shared/events/register-event-handlers.ts` | Wiring dos handlers             |

### Logs estruturados

- `domain_event.published` — ao publicar (inclui `eventId`, `eventName`, `aggregateId`, `correlationId`).
- `domain_event.handler_failed` — falha isolada de handler (inclui `handlerName` e `err`).

---

## Observabilidade (logs, tracing e métricas)

A API usa **Pino** para logs estruturados em JSON (ou `pino-pretty` em desenvolvimento), **OpenTelemetry** para tracing distribuído e **Prometheus** (`prom-client`) para métricas operacionais.

### Request tracing e correlation ID

- Cada requisição recebe um `requestId` (UUID), gerado automaticamente ou reutilizado do header `X-Request-Id`.
- Um `correlationId` é propagado via header `X-Correlation-Id`; se ausente, reutiliza o `requestId`.
- Ambos aparecem nos logs estruturados (`requestId`, `correlationId`) e nos headers de resposta.
- Com OpenTelemetry ativo (`OTEL_ENABLED=true`), logs HTTP também incluem `trace_id` e `span_id` do span ativo.

### OpenTelemetry

Instrumentação automática de:

| Componente        | Instrumentação                                    |
| ----------------- | ------------------------------------------------- |
| HTTP              | `@opentelemetry/instrumentation-http`             |
| Express           | `@opentelemetry/instrumentation-express`          |
| Prisma/PostgreSQL | `@prisma/instrumentation`                         |
| Redis (ioredis)   | `@opentelemetry/instrumentation-ioredis`          |
| BullMQ jobs       | spans manuais nos workers (`job.process <queue>`) |

**Variáveis de ambiente:**

| Variável                      | Padrão                | Descrição                                    |
| ----------------------------- | --------------------- | -------------------------------------------- |
| `OTEL_ENABLED`                | `false`               | Ativa o SDK OpenTelemetry                    |
| `OTEL_SERVICE_NAME`           | `supportflow-backend` | Nome do serviço nos traces                   |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | —                     | URL base OTLP (ex.: `http://localhost:4318`) |
| `METRICS_ENABLED`             | `true`                | Coleta métricas Prometheus e middleware HTTP |

**Exportadores:**

- **Desenvolvimento** (`OTEL_ENABLED=true`, sem OTLP): traces no console.
- **Produção** (futuro): configure `OTEL_EXPORTER_OTLP_ENDPOINT` para enviar traces e métricas OTLP.
- **Prometheus**: endpoint `GET /api/v1/metrics` (requer `METRICS_ENABLED=true`).

### Endpoints de observabilidade

| Método | Rota                           | Descrição                                     |
| ------ | ------------------------------ | --------------------------------------------- |
| `GET`  | `/api/v1/health/observability` | Health JSON com DB, Redis, resumo HTTP e jobs |
| `GET`  | `/api/v1/metrics`              | Métricas Prometheus (text/plain)              |

Métricas expostas incluem: total de requisições, duração média, taxa de erro, jobs processados/falhos, tempo médio de jobs, gauges `database_up` e `redis_up`.

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

# Simular tracing com headers customizados
curl -i -H "X-Request-Id: meu-id-debug" -H "X-Correlation-Id: corr-abc" http://localhost:3000/api/v1/health

# Health de observabilidade
curl -s http://localhost:3000/api/v1/health/observability | jq

# Métricas Prometheus
curl -s http://localhost:3000/api/v1/metrics | head

# Ativar OpenTelemetry localmente (traces no console)
OTEL_ENABLED=true pnpm dev
curl -i -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"x@y.com","password":"wrong"}'
```

Health checks (`/health`, `/health/ready`, `/health/observability`, `/api/v1/health`, `/api/v1/metrics`) não geram log HTTP automático para reduzir ruído.

---

## Feature Flags

Feature flags globais permitem habilitar ou desabilitar funcionalidades da plataforma sem deploy.

### Chaves built-in

| Key           | Funcionalidade                 | Padrão (sem registro) |
| ------------- | ------------------------------ | --------------------- |
| `webhooks`    | Entregas de webhooks           | habilitado            |
| `automation`  | Motor de automações            | habilitado            |
| `reports.csv` | Exportações CSV                | habilitado            |
| `csat`        | Pesquisas de satisfação (CSAT) | habilitado            |

Chaves desconhecidas sem registro no banco são tratadas como **desabilitadas**.

### Endpoints admin

| Método   | Rota                               | Descrição      |
| -------- | ---------------------------------- | -------------- |
| `POST`   | `/api/v1/admin/feature-flags`      | Criar flag     |
| `GET`    | `/api/v1/admin/feature-flags`      | Listar flags   |
| `PATCH`  | `/api/v1/admin/feature-flags/:key` | Atualizar flag |
| `DELETE` | `/api/v1/admin/feature-flags/:key` | Remover flag   |

Apenas usuários com role `ADMIN` podem gerenciar flags.

### Validação em código

```typescript
import { assertFeatureEnabled } from './shared/feature-flags/require-feature-flag.js';
import { requireFeatureFlag } from './shared/feature-flags/require-feature-flag.js';
import { FeatureFlagKey } from './modules/feature-flags/domain/feature-flag-keys.js';

// Em services/use cases
await assertFeatureEnabled(FeatureFlagKey.CSAT);

// Em rotas Express
router.get('/path', requireFeatureFlag(FeatureFlagKey.REPORTS_CSV), handler);
```

### Cache

Leituras usam cache em memória (TTL 60s). Com `QUEUE_ENABLED=true`, o Redis também é usado como cache best-effort. Alterações invalidam o cache automaticamente.

### Auditoria

Toda criação, atualização ou remoção gera registro em `feature_flag_audits` e evento de negócio (`feature_flag.created`, `feature_flag.updated`, `feature_flag.deleted`).

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

A suíte de testes está dividida em **unitários** (rápidos, com mocks) e **integração/E2E** (Supertest + PostgreSQL real isolado).

### Banco de teste

- Banco dedicado: `supportflow_test` em `localhost:5433`
- Configurado via `DATABASE_URL_TEST` em `src/test/integration/env-setup.ts`
- **Não usa dados de produção** nem o seed demo de portfólio
- Cada arquivo de integração executa `resetTestDatabase()` no `beforeEach` (truncate + cascade)
- Migrations aplicadas no `beforeAll` (`db push` local / `migrate deploy` no CI)

### Cobertura E2E dos fluxos principais

Arquivo canônico: `src/test/integration/core-api-flows.integration.spec.ts`

| Área             | Cenários cobertos                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Autenticação** | Registro público de `CUSTOMER`, login, JWT em rotas protegidas, 401 sem/ com token inválido                                                       |
| **Chamados**     | Criar, listar, buscar por ID, atribuir agente, atualizar status, encerrar (`RESOLVED` → `CLOSED`)                                                 |
| **Permissões**   | Admin em rotas administrativas; agente gerencia tickets; cliente bloqueado em ações staff; cliente não acessa ticket de outro; cross-tenant → 403 |
| **Validação**    | Payload inválido → 400; recurso inexistente → 404; regra de negócio (status sem atribuição) → 400 controlado                                      |

Outros módulos possuem suites dedicadas em `src/modules/**/integration/*.integration.spec.ts` (auth refresh, RBAC, SLA, comentários, anexos, notificações, métricas, etc.).

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

# Testes unitários (inclui Swagger spec e seed config)
pnpm test

# Testes de integração/E2E — requer PostgreSQL em localhost:5433
pnpm test:db:prepare   # primeira vez ou após subir Docker
pnpm test:integration
# alias equivalente
pnpm test:e2e

# Cobertura
pnpm test:coverage
```

| Script                  | Descrição                                                  |
| ----------------------- | ---------------------------------------------------------- |
| `pnpm test`             | Unitários (Vitest, exclui `*.integration.spec.ts`)         |
| `pnpm test:integration` | E2E com banco real (`supportflow_test`)                    |
| `pnpm test:e2e`         | Alias de `test:integration`                                |
| `pnpm test:db:prepare`  | Sobe Docker e cria `supportflow_test`                      |
| `pnpm ci:check`         | Quality: format, lint, typecheck, prisma, unitários, build |
| `pnpm ci:integration`   | Prisma deploy + E2E (usado no CI)                          |
| `pnpm ci:full`          | Pipeline completo local                                    |

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
5. `pnpm test:integration` — **171** testes E2E com Supertest + banco real

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
