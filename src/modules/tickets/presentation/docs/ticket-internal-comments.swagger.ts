/**
 * @swagger
 * /tickets/{ticketId}/internal-comments:
 *   post:
 *     tags:
 *       - Comments
 *     summary: Adicionar comentário interno ao chamado
 *     description: |
 *       Registra um comentário interno visível apenas para a equipe de atendimento.
 *       Clientes (`CUSTOMER`) não têm acesso a esta rota.
 *
 *       Gera evento `COMMENT_ADDED` no histórico e notificação `TICKET_COMMENT_ADDED`.
 *
 *       **Permissões:** `ADMIN`, `AGENT` ou `SUPERVISOR`.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentRequest'
 *     responses:
 *       201:
 *         description: Comentário interno criado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TicketComment'
 *       400:
 *         description: Conteúdo inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sem permissão (ex. cliente)
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
 *
 *   get:
 *     tags:
 *       - Comments
 *     summary: Listar comentários internos do chamado
 *     description: |
 *       Retorna comentários internos em ordem cronológica (mais antigo primeiro),
 *       incluindo dados do autor.
 *
 *       **Permissões:** `ADMIN`, `AGENT` ou `SUPERVISOR`.
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
 *         description: Lista de comentários internos
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TicketCommentWithAuthor'
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
 *       404:
 *         description: Chamado não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export {};
