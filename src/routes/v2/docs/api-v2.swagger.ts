/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check da API v2
 *     description: |
 *       Endpoint de prova de conceito da versão 2 da API.
 *       Retorna status do serviço com metadados da versão (`apiVersion: v2`).
 *     responses:
 *       200:
 *         description: Serviço operacional
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: supportflow-backend
 *                 apiVersion:
 *                   type: string
 *                   example: v2
 *                 environment:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /tickets:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Listar chamados (API v2)
 *     description: |
 *       Prova de conceito da API v2 reutilizando o domínio de tickets da v1.
 *       Contrato evoluirá de forma independente nas próximas iterações.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantIdHeader'
 *       - $ref: '#/components/parameters/TenantSlugHeader'
 *     responses:
 *       200:
 *         description: Lista paginada de chamados
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 */
