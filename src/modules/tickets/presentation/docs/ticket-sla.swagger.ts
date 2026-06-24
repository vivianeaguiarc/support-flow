/**
 * @swagger
 * /tickets/sla:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Resumo de SLA dos chamados
 *     description: |
 *       Retorna totais de chamados ativos com SLA classificados como `ON_TIME`, `WARNING` ou `BREACHED`.
 *
 *       **Permissões:** `AGENT`, `SUPERVISOR` ou `ADMIN`.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Totais de SLA por status
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TicketSlaSummary'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sem permissão
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /tickets/sla/breached:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Listar chamados com SLA violado
 *     description: |
 *       Retorna apenas chamados ativos cujo `slaDueAt` já foi ultrapassado.
 *
 *       **Permissões:** `AGENT`, `SUPERVISOR` ou `ADMIN`.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista paginada de chamados com SLA violado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiPaginatedSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BreachedSlaTicket'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sem permissão
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export {};
