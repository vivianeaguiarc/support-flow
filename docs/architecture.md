# Arquitetura

Visão geral das decisões arquiteturais do SupportFlow Backend.

## Clean Architecture

O código é organizado em camadas com dependências apontando para dentro:

- **domain** — entidades, enums e regras de negócio puras (sem framework).
- **application** — casos de uso e serviços que orquestram o domínio.
- **infrastructure** — repositórios (Prisma), provedores de fila, e-mail, etc.
- **presentation** — controllers, rotas, DTOs e documentação Swagger.

Isso mantém as regras de negócio isoladas de detalhes de I/O e facilita testes.

## DDD

Cada módulo (`tickets`, `auth`, `notifications`, `webhooks`, `outbox`, `audit`,
`rbac`, ...) é um _bounded context_ com sua própria linguagem ubíqua, agregados e
casos de uso, seguindo princípios de Domain-Driven Design.

## Event Bus

Mudanças relevantes (ticket criado, atribuído, resolvido, etc.) publicam eventos
de domínio. Consumidores reagem de forma desacoplada (notificações, webhooks,
métricas), sem acoplar o caso de uso à reação.

## Outbox Pattern

Para garantir que eventos **nunca se percam** mesmo com falha da aplicação, o
evento é gravado na tabela `outbox` na **mesma transação** da operação de negócio.
Um relay assíncrono lê eventos pendentes e os publica, atualizando o status
(`PENDING → PROCESSING → PROCESSED/FAILED`) com retry, backoff exponencial e
dead-letter. Endpoints administrativos: `GET /admin/outbox` e
`GET /admin/outbox/metrics`.

## BullMQ

Processamento assíncrono (e-mails, entregas de webhook, relay do outbox, jobs
agendados) roda sobre filas **BullMQ** (Redis). Há suporte a retries, backoff,
dead-letter e monitoramento via `GET /admin/jobs` e `GET /admin/jobs/metrics`.

## Observabilidade

- **Logs estruturados** (pino) com `requestId` para correlação.
- **Métricas Prometheus** em `/metrics` (`METRICS_ENABLED=true`).
- **Health checks** em `/health`, `/health/ready` e `/health/observability`.
- Tracing opcional via OpenTelemetry.

## Auditoria imutável

Ações sensíveis são registradas em uma trilha **append-only** com **hash
encadeado** (SHA-256): cada registro inclui o hash do anterior, de modo que
qualquer alteração quebra a cadeia. `UPDATE`/`DELETE` são bloqueados na aplicação
e no banco. Endpoints: `GET /admin/audit-logs` e `GET /admin/audit-logs/verify`.

## Multi-tenant

Todos os dados são isolados por organização (`tenantId`). Usuários comuns ficam
restritos ao tenant do JWT; `SUPER_ADMIN` pode operar em outro tenant informando
`x-tenant-id`/`x-tenant-slug`. Repositórios sempre filtram por tenant.

## Feature flags

Comportamentos podem ser ligados/desligados por tenant via feature flags
(`/admin/feature-flags`), permitindo _rollouts_ graduais e desativação rápida de
funcionalidades.

## Referências

- [Segurança](./security.md)
- [RBAC](./rbac.md)
- [Versionamento da API](./api-versioning.md)
