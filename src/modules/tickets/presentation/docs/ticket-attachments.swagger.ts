/**
 * @swagger
 * /tickets/{id}/attachments:
 *   post:
 *     tags:
 *       - Ticket Attachments
 *     summary: Enviar anexo ao chamado
 *     description: |
 *       Faz upload de um arquivo ao chamado via `multipart/form-data`.
 *
 *       **Tipos permitidos:** PDF, PNG, JPG, JPEG
 *       **Tamanho máximo:** 10 MB
 *       **Campo do formulário:** `file` (obrigatório)
 *
 *       Gera evento `ATTACHMENT_ADDED` no histórico e notificação `TICKET_ATTACHMENT_ADDED`.
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: |
 *                   Arquivo a anexar. Extensões aceitas: `.pdf`, `.png`, `.jpg`, `.jpeg`.
 *                   Executáveis e outros formatos são rejeitados.
 *           encoding:
 *             file:
 *               contentType: application/pdf, image/png, image/jpeg
 *     responses:
 *       201:
 *         description: Anexo enviado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TicketAttachment'
 *             example:
 *               id: "bb0e8400-e29b-41d4-a716-446655440001"
 *               tenantId: "660e8400-e29b-41d4-a716-446655440001"
 *               ticketId: "550e8400-e29b-41d4-a716-446655440000"
 *               uploadedById: "880e8400-e29b-41d4-a716-446655440003"
 *               fileName: "1719158400000-comprovante-estorno.pdf"
 *               originalName: "comprovante-estorno.pdf"
 *               mimeType: "application/pdf"
 *               size: "245678"
 *               fileUrl: "/storage/attachments/1719158400000-comprovante-estorno.pdf"
 *               createdAt: "2026-06-23T15:00:00.000Z"
 *       400:
 *         description: Arquivo ausente, tipo não permitido, executável ou tamanho excedido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               arquivoObrigatorio:
 *                 summary: Nenhum arquivo enviado
 *                 value:
 *                   statusCode: 400
 *                   message: "File is required"
 *               tipoInvalido:
 *                 summary: Extensão não permitida
 *                 value:
 *                   statusCode: 400
 *                   message: "File type not allowed. Allowed types: .pdf, .png, .jpg, .jpeg"
 *               tamanhoExcedido:
 *                 summary: Arquivo maior que 10 MB
 *                 value:
 *                   statusCode: 400
 *                   message: "File too large. Maximum size: 10MB"
 *       401:
 *         description: Token JWT ausente ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Cliente, agente de outro tenant ou role sem permissão (cross-tenant retorna 403)
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
 *       - Ticket Attachments
 *     summary: Listar anexos do chamado
 *     description: |
 *       Retorna os anexos do chamado em ordem cronológica, incluindo dados de quem fez o upload.
 *
 *       **Permissões:** `AGENT` (qualquer do tenant) ou `CUSTOMER` (apenas chamados próprios).
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
 *         description: Lista de anexos (vazia se não houver registros)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TicketAttachmentWithUploader'
 *             example:
 *               - id: "bb0e8400-e29b-41d4-a716-446655440001"
 *                 tenantId: "660e8400-e29b-41d4-a716-446655440001"
 *                 ticketId: "550e8400-e29b-41d4-a716-446655440000"
 *                 uploadedById: "880e8400-e29b-41d4-a716-446655440003"
 *                 fileName: "1719158400000-comprovante-estorno.pdf"
 *                 originalName: "comprovante-estorno.pdf"
 *                 mimeType: "application/pdf"
 *                 size: "245678"
 *                 fileUrl: "/storage/attachments/1719158400000-comprovante-estorno.pdf"
 *                 createdAt: "2026-06-23T15:00:00.000Z"
 *                 uploadedBy:
 *                   id: "880e8400-e29b-41d4-a716-446655440003"
 *                   name: "Maria Santos"
 *                   email: "maria.santos@supportflow.com"
 *               - id: "bb0e8400-e29b-41d4-a716-446655440002"
 *                 tenantId: "660e8400-e29b-41d4-a716-446655440001"
 *                 ticketId: "550e8400-e29b-41d4-a716-446655440000"
 *                 uploadedById: "880e8400-e29b-41d4-a716-446655440003"
 *                 fileName: "1719158500000-print-tela-cobranca.png"
 *                 originalName: "print-tela-cobranca.png"
 *                 mimeType: "image/png"
 *                 size: "102400"
 *                 fileUrl: "/storage/attachments/1719158500000-print-tela-cobranca.png"
 *                 createdAt: "2026-06-23T15:05:00.000Z"
 *                 uploadedBy:
 *                   id: "880e8400-e29b-41d4-a716-446655440003"
 *                   name: "Maria Santos"
 *                   email: "maria.santos@supportflow.com"
 *       401:
 *         description: Token JWT ausente ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sem acesso ao chamado (inclui cross-tenant — retorna 403, não 404)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chamado não encontrado (UUID inexistente) ou pertencente a outro tenant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /tickets/{id}/attachments/{attachmentId}:
 *   delete:
 *     tags:
 *       - Ticket Attachments
 *     summary: Remover anexo
 *     description: |
 *       Remove o arquivo do storage e o registro do anexo no banco de dados.
 *       Gera evento `ATTACHMENT_REMOVED` no histórico do chamado.
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
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID do anexo
 *         example: "bb0e8400-e29b-41d4-a716-446655440001"
 *     responses:
 *       204:
 *         description: Anexo removido com sucesso
 *       401:
 *         description: Token JWT ausente ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Cliente, agente de outro tenant ou role sem permissão (cross-tenant retorna 403)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chamado ou anexo não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export {};
