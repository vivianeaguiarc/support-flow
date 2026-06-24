/**
 * @swagger
 * tags:
 *   - name: Security
 *     description: |
 *       Controles de segurança aplicados globalmente e por rota.
 *
 *       **Rate limits** (quando `RATE_LIMIT_ENABLED=true`):
 *       - `POST /auth/login` e `POST /auth/refresh` — `AUTH_RATE_LIMIT_*`
 *       - `POST /tickets` — `TICKET_CREATE_RATE_LIMIT_*`
 *       - `POST /tickets/{id}/attachments` — `ATTACHMENT_UPLOAD_RATE_LIMIT_*`
 *       - Operações de API Keys — `API_KEY_RATE_LIMIT_*`
 *       - Operações de Webhooks — `WEBHOOK_RATE_LIMIT_*`
 *
 *       Respostas `429` incluem cabeçalhos `RateLimit-*`.
 *
 *       **Login lock**: após `LOGIN_MAX_FAILED_ATTEMPTS` falhas, a conta retorna `423` até `LOGIN_LOCK_DURATION_MS`.
 *
 *       **Payloads**: schemas em modo strict rejeitam campos desconhecidos (`400`).
 *
 *       **Auditoria**: eventos `LOGIN_FAILED`, `LOGIN_LOCKED`, `ACCESS_DENIED`, `API_KEY_CREATED`, `API_KEY_REVOKED`, `USER_PERMISSION_ASSIGNED`.
 */
