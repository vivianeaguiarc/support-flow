/**
 * @swagger
 * /reports/tickets.csv:
 *   get:
 *     summary: Exportar chamados em CSV
 *     description: |
 *       Gera um arquivo CSV com os chamados do tenant, respeitando os filtros informados.
 *       Apenas administradores e supervisores podem exportar relatórios.
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/TicketStatus'
 *       - in: query
 *         name: priority
 *         schema:
 *           $ref: '#/components/schemas/TicketPriority'
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Arquivo CSV de chamados
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             example: attachment; filename="tickets.csv"
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               example: |
 *                 protocol,title,status,priority,customerName,customerEmail,agentName,categoryName,slaDueAt,closedAt,createdAt,updatedAt
 *                 TK-001,Chamado teste,OPEN,HIGH,Cliente,cliente@test.com,Agente,,2026-06-30T18:00:00.000Z,,2026-06-01T10:00:00.000Z,2026-06-01T10:00:00.000Z
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /reports/agents-performance.csv:
 *   get:
 *     summary: Exportar produtividade por atendente em CSV
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/TicketStatus'
 *       - in: query
 *         name: priority
 *         schema:
 *           $ref: '#/components/schemas/TicketPriority'
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Arquivo CSV de produtividade por atendente
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             example: attachment; filename="agents-performance.csv"
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               example: |
 *                 agentId,agentName,assignedTickets,resolvedTickets,openTickets,slaBreachedTickets,avgResolutionTimeHours
 *                 550e8400-e29b-41d4-a716-446655440000,Maria Santos,25,18,7,2,22.3
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /reports/sla.csv:
 *   get:
 *     summary: Exportar relatório de SLA em CSV
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/TicketStatus'
 *       - in: query
 *         name: priority
 *         schema:
 *           $ref: '#/components/schemas/TicketPriority'
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Arquivo CSV com indicadores de SLA por chamado
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             example: attachment; filename="sla.csv"
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               example: |
 *                 protocol,title,status,priority,agentName,slaDueAt,slaStatus,hoursRemaining,hoursOverdue,slaCompliant
 *                 TK-001,Chamado teste,IN_PROGRESS,HIGH,Maria Santos,2026-06-30T18:00:00.000Z,WARNING,4,0,
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

export {};
