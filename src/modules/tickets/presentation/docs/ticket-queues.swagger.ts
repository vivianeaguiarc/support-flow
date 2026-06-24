/**
 * @swagger
 * /tickets/my-queue:
 *   get:
 *     tags:
 *       - Ticket Queues
 *     summary: Fila pessoal do atendente
 *     description: |
 *       Retorna tickets atribuídos ao usuário autenticado.
 *       Suporta filtros por `status` e `priority`.
 *
 *       **Permissões:** `AGENT`, `SUPERVISOR`, `ADMIN`.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/TicketStatus'
 *       - in: query
 *         name: priority
 *         schema:
 *           $ref: '#/components/schemas/TicketPriority'
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
 *         description: Tickets da fila pessoal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiPaginatedSuccessResponse'
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
 * /tickets/unassigned:
 *   get:
 *     tags:
 *       - Ticket Queues
 *     summary: Fila de tickets sem responsável
 *     description: |
 *       Retorna tickets sem atendente atribuído.
 *
 *       **Permissões:** `SUPERVISOR`, `ADMIN`.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/TicketStatus'
 *       - in: query
 *         name: priority
 *         schema:
 *           $ref: '#/components/schemas/TicketPriority'
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
 *         description: Tickets sem responsável
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiPaginatedSuccessResponse'
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
