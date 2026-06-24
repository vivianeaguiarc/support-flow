/**
 * @swagger
 * /analytics/overview:
 *   get:
 *     summary: Visão geral do dashboard
 *     description: |
 *       Retorna métricas consolidadas de chamados para o dashboard analítico.
 *       Apenas administradores e supervisores podem acessar.
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data inicial do período
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data final do período
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
 *         description: Métricas consolidadas do dashboard
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AnalyticsOverview'
 *             example:
 *               success: true
 *               message: Operation completed successfully
 *               data:
 *                 totalTickets: 150
 *                 openTickets: 45
 *                 inProgressTickets: 32
 *                 resolvedTickets: 42
 *                 closedTickets: 14
 *                 slaBreachedTickets: 8
 *                 slaComplianceRate: 85.5
 *                 avgResolutionTimeHours: 24.5
 *                 ticketsCreatedByPeriod:
 *                   - period: '2026-06-01'
 *                     count: 12
 *                   - period: '2026-06-02'
 *                     count: 18
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /analytics/tickets-by-status:
 *   get:
 *     summary: Chamados agrupados por status
 *     tags: [Analytics]
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
 *         description: Distribuição de chamados por status
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AnalyticsTicketsByStatus'
 *             example:
 *               success: true
 *               message: Operation completed successfully
 *               data:
 *                 total: 150
 *                 byStatus:
 *                   OPEN: 45
 *                   IN_PROGRESS: 32
 *                   WAITING_CUSTOMER: 12
 *                   ESCALATED: 5
 *                   RESOLVED: 42
 *                   CLOSED: 14
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /analytics/tickets-by-priority:
 *   get:
 *     summary: Chamados agrupados por prioridade
 *     tags: [Analytics]
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
 *         description: Distribuição de chamados por prioridade
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AnalyticsTicketsByPriority'
 *             example:
 *               success: true
 *               message: Operation completed successfully
 *               data:
 *                 total: 150
 *                 byPriority:
 *                   LOW: 60
 *                   MEDIUM: 50
 *                   HIGH: 30
 *                   URGENT: 10
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /analytics/sla:
 *   get:
 *     summary: Métricas de SLA
 *     tags: [Analytics]
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
 *         description: Indicadores de SLA
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AnalyticsSla'
 *             example:
 *               success: true
 *               message: Operation completed successfully
 *               data:
 *                 onTime: 20
 *                 warning: 5
 *                 breached: 3
 *                 total: 28
 *                 slaComplianceRate: 85.5
 *                 slaBreachedTickets: 8
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /analytics/agents-performance:
 *   get:
 *     summary: Produtividade por atendente
 *     tags: [Analytics]
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
 *         description: Métricas de produtividade por atendente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AnalyticsAgentsPerformance'
 *             example:
 *               success: true
 *               message: Operation completed successfully
 *               data:
 *                 agents:
 *                   - agentId: '550e8400-e29b-41d4-a716-446655440000'
 *                     agentName: Maria Santos
 *                     assignedTickets: 25
 *                     resolvedTickets: 18
 *                     openTickets: 7
 *                     slaBreachedTickets: 2
 *                     avgResolutionTimeHours: 22.3
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

export {};
