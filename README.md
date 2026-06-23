# SupportFlow Backend

API REST para gestão de **Atendimento ao Cliente, SAC e Ouvidoria** em modelo **SaaS multi-tenant**. O SupportFlow centraliza o ciclo de vida dos chamados — abertura, triagem, atribuição, SLA, escalação, comentários, anexos, notificações e métricas operacionais — com autenticação JWT, controle de acesso por perfil (RBAC) e auditoria completa de alterações.

> Projeto de portfólio focado em backend. Frontend não faz parte do escopo atual.

**Autora:** [Viviane Aguiar](https://vivianeaguiardev.com.br) · [LinkedIn](https://linkedin.com/in/vivianeaguiarc) · [Portfolio](https://vivianeaguiardev.com.br)

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

- Login com JWT (`ADMIN`, `SUPERVISOR`, `AGENT`, `CUSTOMER`, `OMBUDSMAN`)
- Registro público restrito a `CUSTOMER`; criação de perfis staff exige administrador autenticado
- Listagem de usuários isolada por tenant

### Operações e observabilidade

- Health check: `GET /health` (liveness) e `GET /health/ready` (readiness + banco)
- Logs estruturados com Pino
- Documentação **Swagger/OpenAPI** (`/api/docs`, habilitado por padrão)

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

| Conceito         | Implementação                                                           |
| ---------------- | ----------------------------------------------------------------------- |
| **Multi-tenant** | `tenantId` no JWT e em todas as queries de negócio                      |
| **RBAC**         | Middleware `authorize` + regras nos use cases                           |
| **SLA**          | Cálculo na abertura + job de monitoramento (warning/expired)            |
| **Auditoria**    | `TicketHistory` com eventos tipados                                     |
| **Validação**    | Zod via `validateRequest` em body, params e query                       |
| **Segurança**    | Helmet, CORS, rate limit global e no login, JWT, sanitização de uploads |

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
│   │   ├── auth/               # Login JWT
│   │   ├── users/              # Gestão de usuários
│   │   ├── tickets/            # Domínio principal (Clean Architecture)
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   ├── presentation/
│   │   │   └── integration/    # Testes E2E do módulo
│   │   ├── notifications/
│   │   ├── customers/
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
├── Dockerfile                  # Multi-stage (pnpm + Node 22)
├── docker-compose.yml          # PostgreSQL + API
├── docs/DOCKER.md              # Guia detalhado de container
└── vitest.config.ts            # Testes unitários
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
| `SWAGGER_ENABLED`              | Não         | ligado fora de `production`                 | Documentação OpenAPI em `/api/docs`                                    |
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

Guia completo: **[docs/deploy.md](docs/deploy.md)**

Resumo:

- Imagem Docker multi-stage (`Dockerfile`) com `NODE_ENV=production`
- Entrypoint: `prisma migrate deploy` → `node dist/server.js`
- Variáveis de exemplo: [`.env.production.example`](.env.production.example)
- Blueprint Render: [`render.yaml`](render.yaml)
- Health: `GET /health` (liveness) · `GET /health/ready` (readiness + banco)

```bash
pnpm docker:build
docker compose up --build   # stack local API + Postgres
```

---

## Como rodar localmente

```bash
# 1. Dependências
pnpm install

# 2. Banco (se ainda não estiver rodando)
pnpm db:up

# 3. Migrations em desenvolvimento
pnpm prisma:migrate

# 4. Servidor com hot reload
pnpm dev
```

A API ficará disponível em http://localhost:3000.

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

| Comando                | Uso                                                                    |
| ---------------------- | ---------------------------------------------------------------------- |
| `pnpm prisma:migrate`  | Criar/aplicar migrations em **desenvolvimento** (`prisma migrate dev`) |
| `pnpm prisma:deploy`   | Aplicar migrations em **produção/CI** (`prisma migrate deploy`)        |
| `pnpm prisma:validate` | Validar schema Prisma                                                  |
| `pnpm prisma:generate` | Gerar Prisma Client                                                    |
| `pnpm prisma:studio`   | UI visual do banco                                                     |

Em Docker/produção, as migrations rodam automaticamente via `scripts/docker-entrypoint.sh`.

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

# Testes unitários (131)
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

Com o servidor em execução (modo development):

| Recurso       | URL                                 |
| ------------- | ----------------------------------- |
| UI interativa | http://localhost:3000/api/docs      |
| Spec JSON     | http://localhost:3000/api/docs.json |

O Swagger fica **habilitado por padrão** em todos os ambientes. Para desligar em produção: `SWAGGER_ENABLED=false`.

Documentação gerada a partir de JSDoc nos arquivos `*.swagger.ts` de cada módulo.

---

## Scripts disponíveis

| Script                              | Descrição                                               |
| ----------------------------------- | ------------------------------------------------------- |
| `pnpm dev`                          | Servidor com `tsx watch`                                |
| `pnpm build`                        | Compila TypeScript (`dist/`)                            |
| `pnpm start` / `pnpm start:prod`    | Executa build compilado                                 |
| `pnpm start:docker`                 | Entrypoint Docker (migrate + start)                     |
| `pnpm migrate:deploy`               | Aplica migrations em produção (`prisma migrate deploy`) |
| `pnpm docker:build`                 | Build da imagem Docker                                  |
| `pnpm docker:run`                   | Executa container local (requer env vars)               |
| `pnpm env:check`                    | Valida variáveis de ambiente                            |
| `pnpm lint` / `pnpm lint:fix`       | ESLint                                                  |
| `pnpm format` / `pnpm format:check` | Prettier                                                |
| `pnpm typecheck`                    | `tsc --noEmit`                                          |
| `pnpm ci:check`                     | Pipeline quality (format, lint, typecheck, test, build) |
| `pnpm ci:integration`               | Pipeline integração (prisma generate/deploy + E2E)      |
| `pnpm ci:full`                      | Pipeline completo local (espelha GitHub Actions)        |
| `pnpm db:up` / `pnpm db:down`       | Sobe/para containers Docker                             |
| `pnpm test:db:prepare`              | Prepara banco para integração                           |

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
5. `pnpm test:integration` — ~149 testes E2E com Supertest + banco real

Variáveis no CI:

```text
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/supportflow_test?schema=public
```

Deploy automatizado via blueprint Render ([`render.yaml`](render.yaml)). Guia completo em [docs/deploy.md](docs/deploy.md).

---

## Decisões técnicas

1. **Express puro (não NestJS)** — controle explícito de middlewares e menor curva para demonstrar arquitetura manual.
2. **Clean Architecture nos módulos críticos** — `tickets` e `notifications` separam regras de negócio de HTTP e Prisma, facilitando testes e evolução.
3. **Multi-tenant por coluna (`tenantId`)** — isolamento simples e eficiente para SaaS B2B nesta fase.
4. **Prisma + PostgreSQL** — migrations versionadas, tipagem forte e adapter PG para produção.
5. **Zod na borda HTTP** — validação declarativa e mensagens de erro consistentes.
6. **Testes em duas camadas** — unitários rápidos (use cases com mocks) + integração com banco real (Supertest).
7. **Docker multi-stage** — imagem enxuta, usuário não-root, health check e migrate no entrypoint.
8. **Swagger habilitado por padrão** — `SWAGGER_ENABLED=false` desliga em produção se necessário.
9. **Histórico como trilha de auditoria** — eventos imutáveis em `TicketHistory`, não apenas log de aplicação.

---

## Roadmap backend

- [ ] Endpoint autenticado de **download de anexos** (sem expor `storagePath`)
- [ ] Comentários com visibilidade **pública** para clientes
- [ ] Módulo **knowledge-base** (artigos de ajuda)
- [ ] Refatorar módulos `auth` e `users` para Clean Architecture
- [ ] Scheduler/cron para SLA e escalação em background
- [ ] Seed de dados iniciais (tenant + admin) para deploy
- [ ] Deploy automatizado staging (GitHub Actions → Render/Railway)

---

## Autora

**Viviane Aguiar**

- LinkedIn: [linkedin.com/in/vivianeaguiarc](https://linkedin.com/in/vivianeaguiarc)
- Portfolio: [vivianeaguiardev.com.br](https://vivianeaguiardev.com.br)

---

## Licença

ISC
