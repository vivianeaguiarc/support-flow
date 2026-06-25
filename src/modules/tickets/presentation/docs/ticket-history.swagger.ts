/**
 * @swagger
 * /tickets/{ticketId}/history:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Histórico de alterações do chamado
 *     description: |
 *       Retorna a trilha de auditoria do chamado: criação, mudanças de status,
 *       prioridade, atribuição, comentários internos, anexos e violações de SLA.
 *
 *       **Permissões:** equipe de atendimento (`ADMIN`, `AGENT`, `SUPERVISOR`, `OMBUDSMAN`)
 *       visualiza o histórico completo. Clientes (`CUSTOMER`) veem apenas eventos
 *       públicos (`CREATED`, `STATUS_CHANGED`) dos próprios chamados.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID do chamado
 *     responses:
 *       200:
 *         description: Histórico cronológico do chamado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TicketHistoryListResponse'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sem permissão para acessar o chamado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chamado não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
