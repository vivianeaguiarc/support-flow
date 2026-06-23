# Documentação da API — SupportFlow

API REST SaaS de **Atendimento ao Cliente, SAC e Ouvidoria**. Especificação **OpenAPI 3.0** gerada com `swagger-jsdoc` e servida via `swagger-ui-express`.

## Acessar a documentação

| Recurso         | URL                                 |
| --------------- | ----------------------------------- |
| Swagger UI      | http://localhost:3000/api/docs      |
| OpenAPI JSON    | http://localhost:3000/api/docs.json |
| Redirect legado | `/api-docs` → `/api/docs`           |

**Base da API:** `http://localhost:3000/api/v1`

Swagger **habilitado por padrão** (`SWAGGER_ENABLED=true`). Desligar: `SWAGGER_ENABLED=false`.

## Iniciar o servidor

```bash
cp .env.example .env
pnpm install
pnpm db:up
pnpm prisma:migrate
pnpm dev
```

## Autenticar no Swagger

1. Execute `POST /auth/login` com email e senha
2. Copie o `accessToken` da resposta (`{ accessToken, refreshToken }`)
3. Clique em **Authorize** e informe: `Bearer <accessToken>`
4. Teste endpoints protegidos

Renovação de sessão: `POST /auth/refresh` com `{ "refreshToken": "..." }` (rotação automática).

Encerrar sessão: `POST /auth/logout` com `{ "refreshToken": "..." }`.

## Módulos e endpoints

Todos os paths abaixo são relativos a `/api/v1` (exceto health também em `/health` na raiz).

### Authentication

| Método | Path            | Auth                         |
| ------ | --------------- | ---------------------------- |
| POST   | `/auth/login`   | Não                          |
| POST   | `/auth/refresh` | Não (body com refresh token) |
| POST   | `/auth/logout`  | Não (body com refresh token) |

### Users

| Método | Path          | Roles                                   |
| ------ | ------------- | --------------------------------------- |
| POST   | `/users`      | Público (`CUSTOMER`) ou `ADMIN` (staff) |
| GET    | `/users`      | `ADMIN`                                 |
| GET    | `/users/{id}` | `ADMIN`                                 |

### Tickets

| Método | Path                                 | Descrição                              |
| ------ | ------------------------------------ | -------------------------------------- |
| POST   | `/tickets`                           | Criar chamado                          |
| GET    | `/tickets`                           | Listar (filtros, paginação, ordenação) |
| GET    | `/tickets/{id}`                      | Buscar por ID                          |
| PATCH  | `/tickets/{id}/status`               | Atualizar status                       |
| PATCH  | `/tickets/{id}/assign`               | Atribuir agente                        |
| GET    | `/tickets/{id}/transitions`          | Transições permitidas                  |
| GET    | `/tickets/{id}/history`              | Histórico/auditoria                    |
| GET    | `/tickets/summary`                   | Resumo agregado                        |
| GET    | `/tickets/metrics`                   | Métricas e SLA                         |
| POST   | `/tickets/auto-assign`               | Atribuição automática                  |
| PATCH  | `/tickets/{id}/recalculate-priority` | Recalcular prioridade                  |
| POST   | `/tickets/{id}/route`                | Roteamento automático                  |

### Ticket Comments

| Método | Path                     |
| ------ | ------------------------ |
| POST   | `/tickets/{id}/comments` |
| GET    | `/tickets/{id}/comments` |

Comentários são **internos** (`INTERNAL`) — visíveis apenas para staff.

### Ticket Attachments

| Método | Path                                                              |
| ------ | ----------------------------------------------------------------- |
| POST   | `/tickets/{id}/attachments` (`multipart/form-data`, campo `file`) |
| GET    | `/tickets/{id}/attachments`                                       |
| DELETE | `/tickets/{id}/attachments/{attachmentId}`                        |

Tipos: PDF, PNG, JPEG, TXT. Máximo: 10 MB.

### Notifications

| Método | Path                                                 |
| ------ | ---------------------------------------------------- |
| GET    | `/notifications` (`?unread=true`, `limit`, `offset`) |
| PATCH  | `/notifications/{id}/read`                           |
| PATCH  | `/notifications/read-all`                            |

### Health

| Método | Path            | Descrição                |
| ------ | --------------- | ------------------------ |
| GET    | `/health`       | Liveness                 |
| GET    | `/health/ready` | Readiness (+ PostgreSQL) |

> Clientes (`Customer`) não possuem rotas REST — use `customerId` ao criar tickets.

## Enums principais

- **TicketStatus:** `OPEN`, `IN_PROGRESS`, `WAITING_CUSTOMER`, `ESCALATED`, `RESOLVED`, `CLOSED`
- **TicketPriority:** `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- **UserRole:** `ADMIN`, `SUPERVISOR`, `AGENT`, `CUSTOMER`, `OMBUDSMAN`
- **NotificationType:** `TICKET_CREATED`, `TICKET_ASSIGNED`, `TICKET_STATUS_CHANGED`, `TICKET_COMMENT_ADDED`, `TICKET_ATTACHMENT_ADDED`, `SLA_WARNING`, `SLA_EXPIRED`

Schemas completos em `src/config/swagger.ts` e nos arquivos `*.swagger.ts`.

## Segurança

### JWT Bearer

Endpoints protegidos exigem:

```
Authorization: Bearer <accessToken>
```

Exceções sem Bearer: `/auth/login`, `/auth/refresh`, `/auth/logout`, `/health`, `/health/ready`, `POST /users` (registro público de `CUSTOMER`).

### RBAC e multi-tenant

- Cada role tem permissões definidas em `src/shared/security/rbac.ts`
- `tenantId` no JWT isola dados por organização
- Acesso cross-tenant retorna **403 Forbidden** (não 404)

## Códigos de status

| Código | Uso                                   |
| ------ | ------------------------------------- |
| 200    | Sucesso                               |
| 201    | Criado                                |
| 204    | Sucesso sem corpo                     |
| 400    | Validação / regra de negócio          |
| 401    | Não autenticado                       |
| 403    | Sem permissão / cross-tenant          |
| 404    | Recurso inexistente                   |
| 409    | Conflito (ex. email duplicado)        |
| 429    | Rate limit                            |
| 500    | Erro interno                          |
| 503    | Readiness falhou (banco indisponível) |

## Formato de erro

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Ticket not found",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Em `development`/`test`, o campo `details` pode incluir informações adicionais de validação.

## Exemplos curl

### Login

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agente@example.com","password":"senha123"}'
```

### Criar chamado

```bash
curl -X POST http://localhost:3000/api/v1/tickets \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Reclamação Ouvidoria",
    "description": "Estorno não creditado após 15 dias úteis",
    "customerId": "550e8400-e29b-41d4-a716-446655440000",
    "priority": "URGENT"
  }'
```

### Upload de anexo

```bash
curl -X POST http://localhost:3000/api/v1/tickets/{id}/attachments \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@comprovante.pdf"
```

## Manter a documentação

Arquivos JSDoc:

- `src/modules/auth/docs/auth.swagger.ts`
- `src/modules/users/docs/users.swagger.ts`
- `src/modules/tickets/presentation/docs/*.swagger.ts`
- `src/modules/notifications/presentation/docs/notifications.swagger.ts`
- `src/shared/http/docs/health.swagger.ts`

Cobertura validada por `src/config/swagger.spec.ts` (roda em `pnpm test`).

Ao adicionar rotas:

1. Crie/atualize o `*.swagger.ts` do módulo
2. Adicione o path em `swagger.spec.ts` (`EXPECTED_PATHS`)
3. Rode `pnpm ci:check`

## Importar no Postman/Insomnia

Baixe a spec: http://localhost:3000/api/docs.json
