/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     tags:
 *       - Administration
 *     summary: Listar registros de auditoria imutável
 *     description: >
 *       Retorna a trilha de auditoria append-only com hash encadeado, em formato
 *       paginado (`data` + `meta`). Suporta filtros por período, ordenação segura
 *       e busca textual case-insensitive em campos não sensíveis
 *       (`action`, `entity`, `entityId`, `userId`, além de `ip`/`requestId`
 *       quando presentes em metadata).
 *       Disponível apenas para administradores e supervisores
 *       (permissão `audit.read`).
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Página atual (1-indexed).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Tamanho da página (máximo 100).
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: >
 *           Início do período (ISO date string) aplicado em `createdAt`.
 *           Retorna 400 para datas inválidas.
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: >
 *           Fim do período (ISO date string) aplicado em `createdAt`.
 *           Retorna 400 para datas inválidas.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, action, entity, userId]
 *           default: createdAt
 *         description: Campo de ordenação (apenas campos seguros e existentes).
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Direção da ordenação.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 200
 *         description: >
 *           Busca textual case-insensitive em `action`, `entity`, `entityId`,
 *           `userId` e em `ip`/`requestId` (quando presentes em metadata).
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista paginada de registros de auditoria
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedAuditLogResponse'
 *       400:
 *         description: "Parâmetros de consulta inválidos (ex.: data ISO inválida)"
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 */

/**
 * @swagger
 * /admin/audit-logs/verify:
 *   get:
 *     tags:
 *       - Administration
 *     summary: Verificar integridade da cadeia de auditoria
 *     description: >
 *       Recalcula o hash de cada registro e valida o encadeamento, sem alterar
 *       nenhum log. Retorna um status claro (`INTACT`, `EMPTY`, `COMPROMISED`),
 *       o total verificado, o primeiro e último ids da cadeia e, se houver, o
 *       id do registro comprometido. Mantém campos legados para compatibilidade.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Resultado da verificação de integridade
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, data, message]
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AuditIntegrityVerificationResponse'
 *                 message:
 *                   type: string
 *                   example: Audit chain verification completed
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 */
