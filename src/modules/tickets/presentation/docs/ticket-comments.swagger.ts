/**
 * @swagger
 * /tickets/{id}/comments:
 *   post:
 *     tags:
 *       - Comments
 *     summary: Adicionar comentário ao chamado
 *     description: |
 *       Registra um comentário na timeline do chamado. A visibilidade controla quem
 *       enxerga o comentário:
 *
 *       - `PUBLIC`: visível para o cliente e para a equipe.
 *       - `INTERNAL`: restrito à equipe de atendimento (cliente não tem acesso).
 *
 *       Regras de visibilidade:
 *       - `CUSTOMER` só pode criar comentários `PUBLIC` no próprio chamado.
 *       - `AGENT`/`SUPERVISOR`/`ADMIN` podem criar `PUBLIC` ou `INTERNAL`; quando o
 *         campo `visibility` é omitido, o padrão é `INTERNAL`.
 *
 *       Gera evento `COMMENT_ADDED` no histórico e notificação `TICKET_COMMENT_ADDED`.
 *
 *       **Permissões:** `CUSTOMER` (próprio chamado, apenas `PUBLIC`), `AGENT`,
 *       `SUPERVISOR` ou `ADMIN`.
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
 *             respostaPublicaAoCliente:
 *               summary: Resposta pública ao cliente
 *               value:
 *                 content: "Olá! Já emitimos a segunda via do boleto e enviamos para o seu e-mail. Qualquer dúvida, estamos à disposição."
 *                 visibility: "PUBLIC"
 *             comentarioCliente:
 *               summary: Comentário do cliente (sempre público)
 *               value:
 *                 content: "Recebi o boleto, obrigado pelo retorno rápido!"
 *             notaInterna:
 *               summary: Nota interna da equipe
 *               value:
 *                 content: "Reclamação validada: estorno de R$ 249,90 processado no cartão final 4532. Prazo de compensação: 2 dias úteis"
 *                 visibility: "INTERNAL"
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
 *         description: |
 *           Acesso negado. Ocorre quando o cliente tenta criar um comentário `INTERNAL`,
 *           quando o usuário acessa um chamado fora do seu tenant (cross-tenant retorna 403)
 *           ou quando o cliente tenta comentar em chamado que não é seu.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 403
 *               message: "Customers can only create public comments"
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
 *       - Comments
 *     summary: Listar comentários do chamado
 *     description: |
 *       Retorna os comentários do chamado em ordem cronológica (mais antigo primeiro),
 *       incluindo dados não sensíveis do autor.
 *
 *       A visibilidade é aplicada conforme o papel do usuário:
 *       - `CUSTOMER` recebe apenas comentários `PUBLIC` do próprio chamado.
 *       - `AGENT`/`SUPERVISOR`/`ADMIN` recebem todos os comentários (`PUBLIC` e `INTERNAL`).
 *
 *       **Permissões:** `CUSTOMER` (próprio chamado), `AGENT`, `SUPERVISOR` ou `ADMIN`.
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
