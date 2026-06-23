/**
 * @swagger
 * /notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Listar notificações
 *     description: Lista as notificações do usuário autenticado com paginação
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Itens por página
 *       - in: query
 *         name: unread
 *         schema:
 *           type: boolean
 *         description: Filtrar apenas não lidas
 *       - in: query
 *         name: type
 *         schema:
 *           $ref: '#/components/schemas/NotificationType'
 *         description: Filtrar por tipo de notificação
 *     responses:
 *       200:
 *         description: Lista de notificações
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *             example:
 *               - id: "550e8400-e29b-41d4-a716-446655440000"
 *                 tenantId: "660e8400-e29b-41d4-a716-446655440001"
 *                 recipientId: "770e8400-e29b-41d4-a716-446655440002"
 *                 ticketId: "880e8400-e29b-41d4-a716-446655440003"
 *                 type: "TICKET_ASSIGNED"
 *                 title: "Novo chamado atribuído"
 *                 message: "Você foi atribuído ao chamado TK-2024-001234"
 *                 readAt: null
 *                 createdAt: "2024-06-23T12:30:00.000Z"
 *               - id: "550e8400-e29b-41d4-a716-446655440004"
 *                 tenantId: "660e8400-e29b-41d4-a716-446655440001"
 *                 recipientId: "770e8400-e29b-41d4-a716-446655440002"
 *                 ticketId: "880e8400-e29b-41d4-a716-446655440005"
 *                 type: "SLA_WARNING"
 *                 title: "Chamado próximo do vencimento"
 *                 message: "O chamado TK-2024-001235 vence em menos de 24 horas"
 *                 readAt: "2024-06-23T13:00:00.000Z"
 *                 createdAt: "2024-06-23T12:00:00.000Z"
 *       401:
 *         description: Não autenticado
 *
 * /notifications/{id}/read:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Marcar notificação como lida
 *     description: Marca uma notificação específica como lida
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da notificação
 *     responses:
 *       200:
 *         description: Notificação marcada como lida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Notificação não encontrada
 *
 * /notifications/read-all:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Marcar todas como lidas
 *     description: Marca todas as notificações do usuário como lidas
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Todas as notificações marcadas como lidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: Número de notificações marcadas
 *                   example: 15
 *       401:
 *         description: Não autenticado
 */

export {};
