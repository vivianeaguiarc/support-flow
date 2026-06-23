/**
 * @swagger
 * /notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Listar notificações do usuário
 *     description: |
 *       Retorna as notificações do usuário autenticado, ordenadas da mais recente para a mais antiga,
 *       com dados resumidos do chamado relacionado.
 *
 *       Cada usuário vê **apenas suas próprias** notificações no tenant atual.
 *
 *       **Autenticação:** JWT Bearer obrigatório.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unread
 *         schema:
 *           type: boolean
 *         description: Quando `true`, retorna apenas notificações não lidas
 *         example: true
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Limite máximo de registros retornados
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Deslocamento para paginação baseada em offset
 *         example: 0
 *     responses:
 *       200:
 *         description: Lista de notificações (pode ser vazia)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NotificationWithTicket'
 *             example:
 *               - id: "cc0e8400-e29b-41d4-a716-446655440001"
 *                 tenantId: "660e8400-e29b-41d4-a716-446655440001"
 *                 recipientId: "880e8400-e29b-41d4-a716-446655440003"
 *                 ticketId: "550e8400-e29b-41d4-a716-446655440000"
 *                 type: "SLA_WARNING"
 *                 title: "SLA próximo do vencimento"
 *                 message: "O chamado TK-2026-004521 vence em menos de 24 horas"
 *                 readAt: null
 *                 createdAt: "2026-06-23T16:00:00.000Z"
 *                 ticket:
 *                   id: "550e8400-e29b-41d4-a716-446655440000"
 *                   protocol: "TK-2026-004521"
 *                   title: "Reclamação Ouvidoria — reembolso não creditado"
 *               - id: "cc0e8400-e29b-41d4-a716-446655440002"
 *                 tenantId: "660e8400-e29b-41d4-a716-446655440001"
 *                 recipientId: "880e8400-e29b-41d4-a716-446655440003"
 *                 ticketId: "550e8400-e29b-41d4-a716-446655440000"
 *                 type: "TICKET_ASSIGNED"
 *                 title: "Novo chamado atribuído"
 *                 message: "Você foi atribuído ao chamado TK-2026-004521"
 *                 readAt: "2026-06-23T16:30:00.000Z"
 *                 createdAt: "2026-06-23T15:00:00.000Z"
 *                 ticket:
 *                   id: "550e8400-e29b-41d4-a716-446655440000"
 *                   protocol: "TK-2026-004521"
 *                   title: "Reclamação Ouvidoria — reembolso não creditado"
 *               - id: "cc0e8400-e29b-41d4-a716-446655440003"
 *                 tenantId: "660e8400-e29b-41d4-a716-446655440001"
 *                 recipientId: "880e8400-e29b-41d4-a716-446655440003"
 *                 ticketId: "770e8400-e29b-41d4-a716-446655440002"
 *                 type: "TICKET_COMMENT_ADDED"
 *                 title: "Novo comentário no chamado"
 *                 message: "Comentário interno adicionado ao chamado TK-2026-003198"
 *                 readAt: null
 *                 createdAt: "2026-06-23T14:00:00.000Z"
 *                 ticket:
 *                   id: "770e8400-e29b-41d4-a716-446655440002"
 *                   protocol: "TK-2026-003198"
 *                   title: "Solicitação de segunda via de boleto"
 *       400:
 *         description: Parâmetros de query inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token JWT ausente ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 401
 *               message: "Unauthorized"
 *
 * /notifications/{id}/read:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Marcar notificação como lida
 *     description: |
 *       Marca uma notificação específica como lida (`readAt` preenchido).
 *       Operação idempotente — marcar novamente não gera erro.
 *
 *       Apenas o **destinatário** da notificação pode marcá-la como lida.
 *
 *       **Autenticação:** JWT Bearer obrigatório.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID da notificação
 *         example: "cc0e8400-e29b-41d4-a716-446655440001"
 *     responses:
 *       204:
 *         description: Notificação marcada como lida com sucesso
 *       401:
 *         description: Token JWT ausente ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Notificação não encontrada ou não pertence ao usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 404
 *               message: "Notification not found"
 *
 * /notifications/read-all:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Marcar todas as notificações como lidas
 *     description: |
 *       Marca **todas** as notificações não lidas do usuário autenticado como lidas
 *       no tenant atual. Retorna a quantidade de registros atualizados.
 *
 *       **Autenticação:** JWT Bearer obrigatório.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Notificações marcadas como lidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MarkAllNotificationsAsReadResponse'
 *             example:
 *               count: 5
 *       401:
 *         description: Token JWT ausente ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export {};
