# Segurança

Controles de segurança aplicados globalmente e por rota no SupportFlow Backend.
Esta página consolida as informações que antes apareciam como uma _tag_ "Security"
no Swagger — o Swagger deve documentar **endpoints**, e os conceitos transversais
ficam aqui.

> A autorização real é sempre aplicada pelo backend a cada requisição. Nenhuma
> proteção de cliente (frontend/SDK) substitui essas verificações.

## Rate limits

Ativos quando `RATE_LIMIT_ENABLED=true`. Cada grupo possui janela e limite próprios
configuráveis por variáveis de ambiente:

| Escopo                               | Variáveis                        |
| ------------------------------------ | -------------------------------- |
| `POST /auth/login` e `/auth/refresh` | `AUTH_RATE_LIMIT_*`              |
| `POST /tickets`                      | `TICKET_CREATE_RATE_LIMIT_*`     |
| `POST /tickets/{id}/attachments`     | `ATTACHMENT_UPLOAD_RATE_LIMIT_*` |
| Operações de API Keys                | `API_KEY_RATE_LIMIT_*`           |
| Operações de Webhooks                | `WEBHOOK_RATE_LIMIT_*`           |

Respostas `429 Too Many Requests` incluem cabeçalhos padrão `RateLimit-*`
(`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`).

## Login lock

Após `LOGIN_MAX_FAILED_ATTEMPTS` tentativas inválidas, a conta é bloqueada
temporariamente e o login passa a responder `423 Locked` até expirar
`LOGIN_LOCK_DURATION_MS`. Isso mitiga ataques de força bruta sem revelar se o
e-mail existe.

## Validação de payload

Todos os corpos de requisição são validados com **Zod em modo strict**: campos
desconhecidos são rejeitados com `400 Bad Request`. Textos livres passam por
sanitização para evitar injeção de conteúdo malicioso.

## Eventos auditados

Ações sensíveis geram registros em `security_audit_logs` (trilha de auditoria
imutável — veja [Arquitetura](./architecture.md)):

- `LOGIN_FAILED`
- `LOGIN_LOCKED`
- `ACCESS_DENIED`
- `API_KEY_CREATED`
- `API_KEY_REVOKED`
- `USER_PERMISSION_ASSIGNED`

## API Keys

Integrações externas autenticam via header `x-api-key` no formato
`supportflow_sk_live_...`. A chave completa é exibida **apenas no momento da
criação**; o backend armazena somente um hash e o prefixo identificador.
Chaves podem ser revogadas e expiram conforme `expiresAt`. Veja
[Autenticação](./authentication.md).

## Headers utilizados

| Header          | Uso                                                                   |
| --------------- | --------------------------------------------------------------------- |
| `Authorization` | `Bearer <accessToken>` — autenticação JWT.                            |
| `x-api-key`     | Autenticação de integrações externas via API Key.                     |
| `x-tenant-id`   | UUID do tenant — obrigatório para `SUPER_ADMIN` acessar outro tenant. |
| `x-tenant-slug` | Slug do tenant — alternativa ao `x-tenant-id`.                        |
| `RateLimit-*`   | Retornados nas respostas para indicar consumo do rate limit.          |

## Referências

- [Autenticação](./authentication.md)
- [RBAC](./rbac.md)
- [Arquitetura](./architecture.md)
