/**
 * @swagger
 * /tickets:
 *   post:
 *     tags:
 *       - Tickets
 *     summary: Criar novo chamado
 *     description: |
 *       Cria um chamado de SAC ou Ouvidoria no tenant do usuário autenticado.
 *
 *       **Permissões:** `CUSTOMER` (apenas para si) ou `AGENT` (para qualquer cliente do tenant).
 *
 *       **Autenticação:** JWT Bearer obrigatório.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTicketRequest'
 *           examples:
 *             sacSegundaVia:
 *               summary: SAC — segunda via de boleto
 *               value:
 *                 title: "Solicitação de segunda via de boleto"
 *                 description: "Cliente não recebeu o boleto por e-mail e precisa da segunda via com vencimento em 5 dias úteis"
 *                 customerId: "550e8400-e29b-41d4-a716-446655440000"
 *                 priority: "MEDIUM"
 *                 categoryId: "660e8400-e29b-41d4-a716-446655440001"
 *             ouvidoriaReembolso:
 *               summary: Ouvidoria — reembolso não creditado
 *               value:
 *                 title: "Reclamação formal — estorno não creditado"
 *                 description: "Após 15 dias úteis do protocolo SAC BR-2026-8891, o valor de R$ 249,90 ainda não foi estornado no cartão final 4532"
 *                 customerId: "550e8400-e29b-41d4-a716-446655440000"
 *                 priority: "URGENT"
 *                 categoryId: "770e8400-e29b-41d4-a716-446655440002"
 *             agenteAtribuicao:
 *               summary: Agente — criação com atribuição imediata
 *               value:
 *                 title: "Cobrança duplicada no plano anual"
 *                 description: "Cliente relata duas cobranças de R$ 1.199,00 no mesmo mês para a assinatura corporativa"
 *                 customerId: "550e8400-e29b-41d4-a716-446655440000"
 *                 priority: "HIGH"
 *                 categoryId: "660e8400-e29b-41d4-a716-446655440001"
 *                 assignedToId: "880e8400-e29b-41d4-a716-446655440003"
 *     responses:
 *       201:
 *         description: Chamado criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *             example:
 *               id: "550e8400-e29b-41d4-a716-446655440000"
 *               tenantId: "660e8400-e29b-41d4-a716-446655440001"
 *               protocol: "TK-2026-004521"
 *               title: "Reclamação formal — estorno não creditado"
 *               description: "Após 15 dias úteis do protocolo SAC BR-2026-8891, o valor ainda não foi estornado"
 *               status: "OPEN"
 *               priority: "URGENT"
 *               customerId: "770e8400-e29b-41d4-a716-446655440002"
 *               categoryId: "880e8400-e29b-41d4-a716-446655440003"
 *               assignedToId: null
 *               slaDueAt: "2026-06-25T18:00:00.000Z"
 *               closedAt: null
 *               createdAt: "2026-06-23T10:30:00.000Z"
 *               updatedAt: "2026-06-23T10:30:00.000Z"
 *       400:
 *         description: Dados inválidos (validação Zod)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 400
 *               message: "Description must be at least 10 characters"
 *       401:
 *         description: Token JWT ausente ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 401
 *               message: "Unauthorized"
 *       403:
 *         description: Sem permissão para criar chamado para o cliente informado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 403
 *               message: "Forbidden"
 *
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Listar chamados
 *     description: |
 *       Retorna lista paginada de chamados com filtros, busca textual e ordenação.
 *
 *       **Permissões:** `AGENT` vê todos do tenant; `CUSTOMER` vê apenas os próprios chamados.
 *
 *       **Autenticação:** JWT Bearer obrigatório.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/TicketStatus'
 *         description: Filtrar por status do chamado
 *         example: OPEN
 *       - in: query
 *         name: priority
 *         schema:
 *           $ref: '#/components/schemas/TicketPriority'
 *         description: Filtrar por prioridade
 *         example: URGENT
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por categoria (ex. Ouvidoria, Cobrança)
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por cliente
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por agente responsável (alias de `assignedToId`)
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
 *         description: Quando `true`, retorna apenas chamados sem agente atribuído (não combinar com `assignedTo` ou `assignedToId`)
 *         example: true
 *       - in: query
 *         name: team
 *         schema:
 *           type: string
 *           enum: [AGENT, SUPERVISOR, ADMIN]
 *         description: Filtrar por papel do atendente responsável
 *       - in: query
 *         name: overdue
 *         schema:
 *           type: boolean
 *         description: Quando `true`, retorna apenas chamados com SLA vencido
 *         example: true
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Busca em protocolo, título, descrição, nome e e-mail do cliente
 *         example: "ouvidoria reembolso"
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data de criação inicial (inclusiva)
 *         example: "2026-06-01T00:00:00.000Z"
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data de criação final (inclusiva)
 *         example: "2026-06-30T23:59:59.999Z"
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
 *         description: Quantidade de itens por página (máx. 100)
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
 *         description: Direção da ordenação
 *     responses:
 *       200:
 *         description: Lista paginada de chamados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedTickets'
 *       400:
 *         description: Parâmetros de query inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 400
 *               message: "unassigned cannot be combined with assignedToId"
 *       401:
 *         description: Token JWT ausente ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Role não autorizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /tickets/summary:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Resumo agregado de chamados
 *     description: |
 *       Retorna totais e contagens por status e prioridade, com suporte aos mesmos filtros da listagem (exceto paginação).
 *
 *       **Permissões:** `AGENT` ou `CUSTOMER` (cliente vê apenas seus chamados).
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *         description: Apenas chamados sem atribuição
 *       - in: query
 *         name: overdue
 *         schema:
 *           type: boolean
 *         description: Apenas chamados com SLA vencido
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca em protocolo, título e descrição
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data de criação inicial
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data de criação final
 *     responses:
 *       200:
 *         description: Resumo dos chamados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TicketSummary'
 *             example:
 *               total: 150
 *               open: 45
 *               inProgress: 32
 *               waitingCustomer: 12
 *               escalated: 5
 *               resolved: 42
 *               closed: 14
 *               overdue: 8
 *               unassigned: 15
 *               byStatus:
 *                 OPEN: 45
 *                 IN_PROGRESS: 32
 *                 WAITING_CUSTOMER: 12
 *                 ESCALATED: 5
 *                 RESOLVED: 42
 *                 CLOSED: 14
 *               byPriority:
 *                 LOW: 60
 *                 MEDIUM: 50
 *                 HIGH: 30
 *                 URGENT: 10
 *       400:
 *         description: Filtros inválidos
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
 *       403:
 *         description: Sem permissão
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /tickets/metrics:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Métricas operacionais e de SLA
 *     description: |
 *       Retorna indicadores gerenciais: tempo médio de resolução, taxa de cumprimento de SLA,
 *       volume de resolvidos/vencidos e performance por agente.
 *
 *       **Permissões:** `AGENT`, `SUPERVISOR`, `OMBUDSMAN` (apenas escalados) ou `ADMIN` para métricas.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar métricas por categoria (ex. Ouvidoria)
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Considerar chamados criados a partir desta data
 *         example: "2026-06-01T00:00:00.000Z"
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Considerar chamados criados até esta data
 *         example: "2026-06-30T23:59:59.999Z"
 *     responses:
 *       200:
 *         description: Métricas calculadas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TicketMetrics'
 *             example:
 *               avgResolutionTimeHours: 18.5
 *               slaComplianceRate: 87.3
 *               resolvedTickets: 42
 *               overdueTickets: 8
 *               agentPerformance:
 *                 - agentId: "880e8400-e29b-41d4-a716-446655440003"
 *                   agentName: "Maria Santos"
 *                   resolvedTickets: 15
 *                   avgResolutionTimeHours: 16.2
 *                 - agentId: "990e8400-e29b-41d4-a716-446655440004"
 *                   agentName: "João Silva"
 *                   resolvedTickets: 12
 *                   avgResolutionTimeHours: 21.8
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
 *       403:
 *         description: Apenas AGENT e ADMIN podem acessar métricas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 403
 *               message: "Forbidden"
 *
 * /tickets/bulk/status:
 *   patch:
 *     tags:
 *       - Tickets
 *     summary: Atualizar status de múltiplos chamados (bulk)
 *     description: |
 *       Atualiza o status de vários chamados em uma única operação atômica.
 *
 *       Toda a operação roda dentro de uma transação: se **qualquer** chamado for
 *       inexistente, pertencer a outro tenant ou violar uma transição de status
 *       válida, **nenhum** chamado é alterado (rollback completo).
 *
 *       IDs duplicados em `ticketIds` são removidos antes do processamento.
 *
 *       As regras de transição e a exigência de responsável para `IN_PROGRESS`
 *       são as mesmas do endpoint individual `PATCH /tickets/{id}/status`.
 *
 *       **Permissões:** `AGENT`, `SUPERVISOR` ou `ADMIN`.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkUpdateTicketStatusRequest'
 *           examples:
 *             resolverEmLote:
 *               summary: Resolver vários chamados
 *               value:
 *                 ticketIds:
 *                   - "550e8400-e29b-41d4-a716-446655440000"
 *                   - "660e8400-e29b-41d4-a716-446655440001"
 *                 status: "RESOLVED"
 *                 reason: "Lote resolvido após correção do incidente #4521"
 *     responses:
 *       200:
 *         description: Operação em lote concluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BulkTicketOperationResult'
 *             example:
 *               totalRequested: 2
 *               totalUpdated: 2
 *               updatedTicketIds:
 *                 - "550e8400-e29b-41d4-a716-446655440000"
 *                 - "660e8400-e29b-41d4-a716-446655440001"
 *               operation: "bulk_status_update"
 *               message: "Tickets updated successfully."
 *       400:
 *         description: Body inválido (ticketIds vazio, UUID inválido ou status inválido)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 400
 *               message: "ticketIds must contain at least one ticket"
 *       401:
 *         description: Token JWT ausente ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Role sem permissão para alterar status em lote
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Um ou mais chamados não foram encontrados no tenant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 404
 *               message: "One or more tickets were not found in this tenant"
 *       409:
 *         description: Transição de status inválida para algum chamado (rollback completo)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 409
 *               message: "Invalid status transition from OPEN to CLOSED"
 *
 * /tickets/bulk/assign:
 *   patch:
 *     tags:
 *       - Tickets
 *     summary: Atribuir múltiplos chamados a um agente (bulk)
 *     description: |
 *       Atribui (ou reatribui) vários chamados a um único atendente em uma
 *       operação atômica.
 *
 *       Toda a operação roda dentro de uma transação: se **qualquer** chamado for
 *       inexistente, pertencer a outro tenant ou estiver resolvido/fechado, ou se
 *       o agente informado não existir/for inelegível, **nenhum** chamado é
 *       alterado (rollback completo).
 *
 *       IDs duplicados em `ticketIds` são removidos antes do processamento.
 *
 *       **Permissões:** `SUPERVISOR` ou `ADMIN`.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkAssignTicketsRequest'
 *           examples:
 *             atribuirEmLote:
 *               summary: Atribuir vários chamados ao mesmo especialista
 *               value:
 *                 ticketIds:
 *                   - "550e8400-e29b-41d4-a716-446655440000"
 *                   - "660e8400-e29b-41d4-a716-446655440001"
 *                 assignedToId: "880e8400-e29b-41d4-a716-446655440003"
 *                 reason: "Concentrando chamados de cobrança no especialista"
 *     responses:
 *       200:
 *         description: Operação em lote concluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BulkTicketOperationResult'
 *             example:
 *               totalRequested: 2
 *               totalUpdated: 2
 *               updatedTicketIds:
 *                 - "550e8400-e29b-41d4-a716-446655440000"
 *                 - "660e8400-e29b-41d4-a716-446655440001"
 *               operation: "bulk_assign"
 *               message: "Tickets assigned successfully."
 *       400:
 *         description: Body inválido ou agente inelegível
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 400
 *               message: "User must have an assignable staff role"
 *       401:
 *         description: Token JWT ausente ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Role sem permissão para atribuir em lote (apenas SUPERVISOR/ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Um ou mais chamados não encontrados no tenant, ou agente inexistente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 404
 *               message: "One or more tickets were not found in this tenant"
 *       409:
 *         description: Algum chamado não pode ser atribuído (resolvido/fechado) — rollback completo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 409
 *               message: "Cannot assign a closed or resolved ticket"
 *
 * /tickets/{id}:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Buscar chamado por ID
 *     description: |
 *       Retorna os detalhes completos de um chamado pelo UUID.
 *
 *       **Permissões:** `AGENT` (qualquer do tenant) ou `CUSTOMER` (apenas próprios).
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
 *         description: Detalhes do chamado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: ID inválido
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
 *       403:
 *         description: |
 *           Sem permissão — inclui acesso cross-tenant (chamado de outro tenant retorna 403 Forbidden,
 *           não 404) ou role não autorizada (ex. CUSTOMER acessando chamado de outro cliente).
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
 *             example:
 *               statusCode: 404
 *               message: "Ticket not found"
 *
 * /tickets/{id}/status:
 *   patch:
 *     tags:
 *       - Tickets
 *     summary: Atualizar status do chamado
 *     description: |
 *       Altera o status seguindo as regras de transição do fluxo SAC/Ouvidoria.
 *
 *       Transições permitidas (resumo):
 *       - `OPEN` → `IN_PROGRESS`, `ESCALATED`
 *       - `IN_PROGRESS` → `WAITING_CUSTOMER`, `ESCALATED`, `RESOLVED`
 *       - `WAITING_CUSTOMER` → `IN_PROGRESS`, `ESCALATED`
 *       - `ESCALATED` → `IN_PROGRESS`, `RESOLVED`
 *       - `RESOLVED` → `CLOSED`
 *
 *       **Permissões:** `AGENT`, `SUPERVISOR`, `OMBUDSMAN` (chamados escalados) ou `ADMIN`.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTicketStatusRequest'
 *           examples:
 *             iniciarAtendimento:
 *               summary: SAC — iniciar atendimento
 *               value:
 *                 status: "IN_PROGRESS"
 *             aguardarCliente:
 *               summary: Aguardar documentação do cliente
 *               value:
 *                 status: "WAITING_CUSTOMER"
 *             escalarOuvidoria:
 *               summary: Escalar para Ouvidoria
 *               value:
 *                 status: "ESCALATED"
 *             resolver:
 *               summary: Resolver chamado
 *               value:
 *                 status: "RESOLVED"
 *             encerrar:
 *               summary: Encerrar após resolução
 *               value:
 *                 status: "CLOSED"
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Transição de status inválida ou body inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               statusCode: 400
 *               message: "Invalid status transition from OPEN to RESOLVED"
 *       401:
 *         description: Token JWT ausente ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Apenas AGENT pode alterar status
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
 * /tickets/{id}/assign:
 *   patch:
 *     tags:
 *       - Tickets
 *     summary: Atribuir chamado a um agente
 *     description: |
 *       Atribui ou reatribui o chamado a um atendente do mesmo tenant.
 *
 *       **Permissões:** `SUPERVISOR` ou `ADMIN`.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignTicketRequest'
 *           examples:
 *             atribuirEspecialista:
 *               summary: Atribuir especialista de Ouvidoria
 *               value:
 *                 assignedToId: "880e8400-e29b-41d4-a716-446655440003"
 *     responses:
 *       200:
 *         description: Chamado atribuído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Dados inválidos ou agente inelegível
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
 *       403:
 *         description: Apenas SUPERVISOR ou ADMIN podem atribuir chamados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chamado ou agente não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /tickets/{id}/transitions:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Transições de status permitidas
 *     description: |
 *       Retorna o status atual e a lista de status para os quais o chamado pode transitar.
 *
 *       **Permissões:** `AGENT` ou `CUSTOMER` (com acesso ao chamado).
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
 *     responses:
 *       200:
 *         description: Transições possíveis para o status atual
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TicketStatusTransitions'
 *             examples:
 *               chamadoAberto:
 *                 summary: Chamado em aberto (SAC)
 *                 value:
 *                   currentStatus: "OPEN"
 *                   allowedTransitions: ["IN_PROGRESS", "ESCALATED"]
 *               emAtendimento:
 *                 summary: Em atendimento
 *                 value:
 *                   currentStatus: "IN_PROGRESS"
 *                   allowedTransitions: ["WAITING_CUSTOMER", "ESCALATED", "RESOLVED"]
 *       401:
 *         description: Token JWT ausente ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sem acesso ao chamado (inclui cross-tenant)
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
 * /tickets/{id}/history:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Histórico de alterações do chamado
 *     description: |
 *       Retorna a trilha de auditoria do chamado: criação, mudanças de status,
 *       prioridade, atribuição, comentários e anexos.
 *
 *       **Permissões:** `AGENT` ou `CUSTOMER` (com acesso ao chamado).
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
 *     responses:
 *       200:
 *         description: Lista cronológica de eventos do chamado
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TicketHistory'
 *             example:
 *               - id: "aa0e8400-e29b-41d4-a716-446655440001"
 *                 ticketId: "550e8400-e29b-41d4-a716-446655440000"
 *                 tenantId: "660e8400-e29b-41d4-a716-446655440001"
 *                 event: "CREATED"
 *                 field: null
 *                 oldValue: null
 *                 newValue: null
 *                 changedById: "770e8400-e29b-41d4-a716-446655440002"
 *                 createdAt: "2026-06-23T10:30:00.000Z"
 *               - id: "aa0e8400-e29b-41d4-a716-446655440002"
 *                 ticketId: "550e8400-e29b-41d4-a716-446655440000"
 *                 tenantId: "660e8400-e29b-41d4-a716-446655440001"
 *                 event: "STATUS_CHANGED"
 *                 field: "status"
 *                 oldValue: "OPEN"
 *                 newValue: "ESCALATED"
 *                 changedById: "880e8400-e29b-41d4-a716-446655440003"
 *                 createdAt: "2026-06-23T11:45:00.000Z"
 *       401:
 *         description: Token JWT ausente ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sem acesso ao chamado
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
 * /tickets/auto-assign:
 *   post:
 *     tags:
 *       - Tickets
 *     summary: Atribuição automática de chamados
 *     description: |
 *       Atribui automaticamente chamados abertos sem agente para o staff elegível com menor carga de trabalho.
 *
 *       **Permissões:** `AGENT`, `SUPERVISOR` ou `ADMIN`.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Resultado da atribuição automática
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AutoAssignTicketsResponse'
 *             example:
 *               ticketsProcessed: 5
 *               ticketsAssigned: 4
 *               failedAssignments: 1
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
 *
 * /tickets/{id}/recalculate-priority:
 *   patch:
 *     tags:
 *       - Tickets
 *     summary: Recalcular prioridade do chamado
 *     description: |
 *       Recalcula automaticamente a prioridade com base em palavras-chave e categoria.
 *
 *       **Permissões:** `AGENT`, `SUPERVISOR` ou `ADMIN`.
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
 *         description: Sem permissão ou acesso cross-tenant
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
 * /tickets/{id}/route:
 *   post:
 *     tags:
 *       - Tickets
 *     summary: Rotear chamado automaticamente
 *     description: |
 *       Roteia o chamado para o agente mais adequado com base em prioridade, categoria e carga de trabalho.
 *
 *       **Permissões:** `AGENT`, `SUPERVISOR` ou `ADMIN`.
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
 *         description: Chamado não pode ser roteado (resolvido/fechado) ou sem agentes elegíveis
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
 *         description: Sem permissão ou acesso cross-tenant
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
