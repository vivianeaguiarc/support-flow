# Autenticação

O SupportFlow suporta dois mecanismos de autenticação: **JWT Bearer** (usuários) e
**API Key** (integrações externas).

## Fluxo de login

1. `POST /auth/login` com `{ email, password }`.
2. A resposta retorna `{ accessToken, refreshToken }`.
3. Use o `accessToken` no header `Authorization: Bearer <accessToken>`.
4. Recupere o usuário autenticado em `GET /auth/me`.

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "admin.demo@supportflow.com", "password": "DemoSupport123!" }
```

## Refresh token

O `accessToken` é de curta duração. Quando expirar (`401`), troque o
`refreshToken` por um novo par:

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{ "refreshToken": "<refreshToken>" }
```

Em `POST /auth/logout` o refresh token é invalidado.

## Bearer JWT

- Header: `Authorization: Bearer <accessToken>`.
- O token carrega `sub` (userId), `role` e `tenantId`.
- Rotas protegidas validam assinatura, expiração e escopo de tenant.

## Cookie HttpOnly / BFF

O backend é **stateless** e baseado em `Authorization: Bearer`. Quando o frontend
adota o padrão BFF, ele pode guardar os tokens em cookies `HttpOnly` no próprio
BFF e repassar o `Bearer` ao backend. O contrato do backend não muda: ele apenas
lê o header `Authorization`. Não há, neste momento, autenticação por cookie
diretamente no backend.

## API Key

Para integrações servidor-a-servidor:

- Crie a chave em `POST /api-keys` (a chave completa é exibida **uma única vez**).
- Envie em cada requisição o header `x-api-key: supportflow_sk_live_...`.
- Revogue com `PATCH /api-keys/{id}/revoke` ou remova com `DELETE /api-keys/{id}`.

## Fluxo recomendado para frontend

1. `POST /auth/login` → armazenar tokens (preferir cookies `HttpOnly` via BFF).
2. `GET /auth/me` no bootstrap para hidratar o usuário/role.
3. Interceptar `401` → tentar `POST /auth/refresh` → repetir a requisição.
4. Em falha de refresh → encerrar sessão e redirecionar ao login.
5. Aplicar RBAC visual a partir da role (veja [RBAC](./rbac.md)) — sem confiar
   nele como segurança final.

## Referências

- [Segurança](./security.md)
- [RBAC](./rbac.md)
- [Versionamento da API](./api-versioning.md)
