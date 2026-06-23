/**
 * @swagger
 * /tickets:
 *   post:
 *     tags:
 *       - Tickets
 *     summary: Criar novo chamado
 *     description: Cria um novo chamado no sistema. Cliente pode criar para si mesmo, agente pode criar para qualquer cliente.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTicketRequest'
 *           examples:
 *             clienteSimples:
 *               summary: Chamado simples de cliente
 *               value:
 *                 title: "Problema com acesso ao sistema"
 *                 description: "Não consigo fazer login na plataforma desde ontem"
 *                 customerId: "550e8400-e29b-41d4-a716-446655440000"
 *             agenteCompleto:
 *               summary: Chamado completo criado por agente
 *               value:
 *                 title: "Cobrança duplicada no cartão"
 *                 description: "Cliente relata que foi cobrado duas vezes pela mesma assinatura no mês de junho"
 *                 customerId: "550e8400-e29b-41d4-a716-446655440000"
 *                 priority: "HIGH"
 *                 categoryId: "660e8400-e29b-41d4-a716-446655440001"
 *                 assignedToId: "770e8400-e29b-41d4-a716-446655440002"
 *     responses:
 *       201:
 *         description: Chamado criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Listar chamados
 *     description: Lista chamados com filtros, paginação e ordenação. Agentes veem todos do tenant, clientes veem apenas seus chamados.
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
 *           default: 10
 *         description: Itens por página
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/TicketStatus'
 *         description: Filtrar por status
 *       - in: query
 *         name: priority
 *         schema:
 *           $ref: '#/components/schemas/TicketPriority'
 *         description: Filtrar por prioridade
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por categoria
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por cliente
 *       - in: query
 *         name: assignedToId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por agente responsável
 *       - in: query
 *         name: unassigned
 *         schema:
 *           type: boolean
 *         description: Filtrar apenas não atribuídos
 *       - in: query
 *         name: overdue
 *         schema:
 *           type: boolean
 *         description: Filtrar apenas vencidos (SLA)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar em protocolo, título e descrição
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filtrar data de criação a partir de
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filtrar data de criação até
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, slaDueAt, priority]
 *           default: createdAt
 *         description: Campo de ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordem de classificação
 *     responses:
 *       200:
 *         description: Lista paginada de chamados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedTickets'
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *
 * /tickets/summary:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Resumo de chamados
 *     description: Retorna estatísticas agregadas dos chamados (totais, por status, por prioridade, etc)
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
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: assignedToId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Resumo dos chamados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TicketSummary'
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *
 * /tickets/metrics:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Métricas gerenciais
 *     description: Retorna métricas operacionais como tempo médio de resolução, taxa de SLA e performance por agente
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
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: assignedToId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Métricas dos chamados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TicketMetrics'
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas AGENT e ADMIN)
 *
 * /tickets/auto-assign:
 *   post:
 *     tags:
 *       - Tickets
 *     summary: Atribuição automática de chamados
 *     description: Atribui automaticamente chamados não atribuídos para agentes elegíveis com base na carga de trabalho
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Resultado da atribuição automática
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 assigned:
 *                   type: integer
 *                   description: Número de chamados atribuídos
 *                   example: 5
 *                 tickets:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticketId:
 *                         type: string
 *                         format: uuid
 *                       assignedToId:
 *                         type: string
 *                         format: uuid
 *                       agentName:
 *                         type: string
 *                         example: "João Silva"
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas AGENT e ADMIN)
 *
 * /tickets/{id}:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Buscar chamado por ID
 *     description: Retorna detalhes de um chamado específico
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do chamado
 *     responses:
 *       200:
 *         description: Detalhes do chamado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Chamado não encontrado
 *
 * /tickets/{id}/status:
 *   patch:
 *     tags:
 *       - Tickets
 *     summary: Atualizar status do chamado
 *     description: Altera o status do chamado seguindo as regras de transição de estado
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do chamado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTicketStatusRequest'
 *           examples:
 *             iniciarAtendimento:
 *               summary: Iniciar atendimento
 *               value:
 *                 status: "IN_PROGRESS"
 *             aguardarCliente:
 *               summary: Aguardar resposta do cliente
 *               value:
 *                 status: "WAITING_CUSTOMER"
 *             resolver:
 *               summary: Resolver chamado
 *               value:
 *                 status: "RESOLVED"
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Transição de status inválida
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas AGENT)
 *       404:
 *         description: Chamado não encontrado
 *
 * /tickets/{id}/assign:
 *   patch:
 *     tags:
 *       - Tickets
 *     summary: Atribuir chamado a um agente
 *     description: Atribui ou reatribui um chamado para um agente específico
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do chamado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignTicketRequest'
 *           examples:
 *             atribuir:
 *               summary: Atribuir a um agente
 *               value:
 *                 assignedToId: "770e8400-e29b-41d4-a716-446655440002"
 *     responses:
 *       200:
 *         description: Chamado atribuído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas AGENT)
 *       404:
 *         description: Chamado ou agente não encontrado
 *
 * /tickets/{id}/recalculate-priority:
 *   patch:
 *     tags:
 *       - Tickets
 *     summary: Recalcular prioridade do chamado
 *     description: Recalcula automaticamente a prioridade do chamado com base em regras de negócio
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do chamado
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               forceRecalculation:
 *                 type: boolean
 *                 description: Forçar recálculo mesmo se prioridade foi definida manualmente
 *                 default: false
 *     responses:
 *       200:
 *         description: Prioridade recalculada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas AGENT e ADMIN)
 *       404:
 *         description: Chamado não encontrado
 *
 * /tickets/{id}/route:
 *   post:
 *     tags:
 *       - Tickets
 *     summary: Rotear chamado automaticamente
 *     description: Roteia o chamado para o agente mais adequado com base em prioridade, categoria e carga de trabalho
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do chamado
 *     responses:
 *       200:
 *         description: Chamado roteado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RouteTicketResponse'
 *       400:
 *         description: Chamado não pode ser roteado (já resolvido/fechado)
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas AGENT e ADMIN)
 *       404:
 *         description: Chamado não encontrado
 *
 * /tickets/{id}/transitions:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Obter transições de status possíveis
 *     description: Retorna os status para os quais o chamado pode transitar a partir do estado atual
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do chamado
 *     responses:
 *       200:
 *         description: Transições possíveis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentStatus:
 *                   $ref: '#/components/schemas/TicketStatus'
 *                 allowedTransitions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TicketStatus'
 *             example:
 *               currentStatus: "OPEN"
 *               allowedTransitions: ["IN_PROGRESS", "WAITING_CUSTOMER", "CLOSED"]
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Chamado não encontrado
 *
 * /tickets/{id}/history:
 *   get:
 *     tags:
 *       - Ticket History
 *     summary: Obter histórico do chamado
 *     description: Retorna todas as alterações e eventos registrados no chamado
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do chamado
 *     responses:
 *       200:
 *         description: Histórico do chamado
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TicketHistory'
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Chamado não encontrado
 *
 * /tickets/{id}/comments:
 *   post:
 *     tags:
 *       - Ticket Comments
 *     summary: Adicionar comentário interno
 *     description: Adiciona um comentário interno ao chamado (não visível para o cliente)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do chamado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentRequest'
 *           examples:
 *             comentario:
 *               summary: Comentário de acompanhamento
 *               value:
 *                 content: "Cliente foi contatado por telefone e confirmou o recebimento do reembolso"
 *     responses:
 *       201:
 *         description: Comentário adicionado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TicketComment'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas AGENT e ADMIN)
 *       404:
 *         description: Chamado não encontrado
 *
 *   get:
 *     tags:
 *       - Ticket Comments
 *     summary: Listar comentários do chamado
 *     description: Lista todos os comentários internos do chamado em ordem cronológica
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do chamado
 *     responses:
 *       200:
 *         description: Lista de comentários
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TicketComment'
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas AGENT e ADMIN)
 *       404:
 *         description: Chamado não encontrado
 *
 * /tickets/{id}/attachments:
 *   post:
 *     tags:
 *       - Ticket Attachments
 *     summary: Fazer upload de anexo
 *     description: Faz upload de um arquivo anexo ao chamado (PDF, PNG, JPG, JPEG, TXT, máx 5MB)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do chamado
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
 *                 description: Arquivo a ser enviado (PDF, PNG, JPG, JPEG, TXT)
 *     responses:
 *       201:
 *         description: Anexo enviado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TicketAttachment'
 *       400:
 *         description: Arquivo inválido (tipo ou tamanho)
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas AGENT e ADMIN)
 *       404:
 *         description: Chamado não encontrado
 *
 *   get:
 *     tags:
 *       - Ticket Attachments
 *     summary: Listar anexos do chamado
 *     description: Lista todos os arquivos anexados ao chamado
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do chamado
 *     responses:
 *       200:
 *         description: Lista de anexos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TicketAttachment'
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Chamado não encontrado
 *
 * /tickets/{id}/attachments/{attachmentId}:
 *   delete:
 *     tags:
 *       - Ticket Attachments
 *     summary: Remover anexo
 *     description: Remove um anexo do chamado (arquivo e registro)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do chamado
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do anexo
 *     responses:
 *       204:
 *         description: Anexo removido com sucesso
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas AGENT e ADMIN)
 *       404:
 *         description: Chamado ou anexo não encontrado
 */

export {};
