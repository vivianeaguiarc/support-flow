/**
 * @swagger
 * /tickets/{id}/comments:
 *   post:
 *     tags:
 *       - Ticket Comments
 *     summary: Adicionar comentário interno
 *     description: |
 *       Registra um comentário interno no chamado de SAC/Ouvidoria. Comentários são
 *       **visíveis apenas para agentes e administradores** — o cliente não tem acesso.
 *
 *       Gera evento `COMMENT_ADDED` no histórico e notificação `TICKET_COMMENT_ADDED`.
 *
 *       **Permissões:** `AGENT` ou `ADMIN`.
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
 *         description: UUID do chamado
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentRequest'
 *           examples:
 *             acompanhamentoSac:
 *               summary: SAC — contato com cliente
 *               value:
 *                 content: "Ligação realizada às 14h — cliente informou que recebeu a segunda via do boleto por SMS"
 *             analiseOuvidoria:
 *               summary: Ouvidoria — análise de reclamação
 *               value:
 *                 content: "Reclamação validada: estorno de R$ 249,90 processado no cartão final 4532. Prazo de compensação: 2 dias úteis"
 *             escalonamento:
 *               summary: Encaminhamento interno
 *               value:
 *                 content: "Caso escalado para equipe financeira aguardando comprovante de estorno do gateway de pagamento"
 *     responses:
 *       201:
 *         description: Comentário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TicketComment'
 *             example:
 *               id: "aa0e8400-e29b-41d4-a716-446655440001"
 *               tenantId: "660e8400-e29b-41d4-a716-446655440001"
 *               ticketId: "550e8400-e29b-41d4-a716-446655440000"
 *               authorId: "880e8400-e29b-41d4-a716-446655440003"
 *               content: "Reclamação validada: estorno de R$ 249,90 processado no cartão final 4532"
 *               visibility: "INTERNAL"
 *               createdAt: "2026-06-23T14:30:00.000Z"
 *               updatedAt: "2026-06-23T14:30:00.000Z"
 *       400:
 *         description: Conteúdo inválido (vazio ou acima de 5000 caracteres)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 400
 *               message: "Comment content is required"
 *       401:
 *         description: Token JWT ausente ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Cliente ou agente de outro tenant sem permissão
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 403
 *               message: "Forbidden"
 *       404:
 *         description: Chamado não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 404
 *               message: "Ticket not found"
 *
 *   get:
 *     tags:
 *       - Ticket Comments
 *     summary: Listar comentários internos
 *     description: |
 *       Retorna todos os comentários internos do chamado em ordem cronológica (mais antigo primeiro),
 *       incluindo dados do autor.
 *
 *       **Permissões:** `AGENT` ou `ADMIN`.
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
 *         description: UUID do chamado
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Lista de comentários (vazia se não houver registros)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TicketCommentWithAuthor'
 *             example:
 *               - id: "aa0e8400-e29b-41d4-a716-446655440001"
 *                 tenantId: "660e8400-e29b-41d4-a716-446655440001"
 *                 ticketId: "550e8400-e29b-41d4-a716-446655440000"
 *                 authorId: "880e8400-e29b-41d4-a716-446655440003"
 *                 content: "Cliente contatado por telefone — aguardando comprovante de estorno"
 *                 visibility: "INTERNAL"
 *                 createdAt: "2026-06-23T10:00:00.000Z"
 *                 updatedAt: "2026-06-23T10:00:00.000Z"
 *                 author:
 *                   id: "880e8400-e29b-41d4-a716-446655440003"
 *                   name: "Maria Santos"
 *                   email: "maria.santos@supportflow.com"
 *               - id: "aa0e8400-e29b-41d4-a716-446655440002"
 *                 tenantId: "660e8400-e29b-41d4-a716-446655440001"
 *                 ticketId: "550e8400-e29b-41d4-a716-446655440000"
 *                 authorId: "990e8400-e29b-41d4-a716-446655440004"
 *                 content: "Estorno confirmado pelo financeiro — caso encaminhado para resolução"
 *                 visibility: "INTERNAL"
 *                 createdAt: "2026-06-23T11:30:00.000Z"
 *                 updatedAt: "2026-06-23T11:30:00.000Z"
 *                 author:
 *                   id: "990e8400-e29b-41d4-a716-446655440004"
 *                   name: "João Silva"
 *                   email: "joao.silva@supportflow.com"
 *       401:
 *         description: Token JWT ausente ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Cliente ou usuário sem permissão
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
