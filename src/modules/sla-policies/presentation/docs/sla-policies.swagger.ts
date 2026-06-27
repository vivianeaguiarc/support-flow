/**
 * @swagger
 * /sla-policies:
 *   get:
 *     summary: Listar políticas de SLA
 *     description: |
 *       Lista as políticas de SLA do tenant. Disponível para ADMIN, SUPERVISOR e AGENT
 *       (leitura). Suporta filtros por status e prioridade.
 *     tags: [SLA Policies]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filtra por políticas ativas/inativas.
 *       - in: query
 *         name: priority
 *         required: false
 *         schema:
 *           $ref: '#/components/schemas/TicketPriority'
 *         description: Filtra por prioridade associada.
 *     responses:
 *       200:
 *         description: Lista de políticas de SLA
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
 *                         $ref: '#/components/schemas/SlaPolicy'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   post:
 *     summary: Criar política de SLA
 *     description: |
 *       Cria uma nova política de SLA. Restrito a ADMIN (permissão `slaPolicies.create`).
 *       Toda criação gera um registro imutável de auditoria.
 *     tags: [SLA Policies]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSlaPolicyInput'
 *           example:
 *             name: SLA Prioridade Alta
 *             description: Política para chamados de alta prioridade
 *             priority: HIGH
 *             categoryIds:
 *               - 550e8400-e29b-41d4-a716-446655440000
 *             firstResponseHours: 4
 *             resolutionHours: 24
 *             businessHoursOnly: false
 *             isActive: true
 *     responses:
 *       201:
 *         description: Política de SLA criada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SlaPolicy'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: Já existe uma política com este nome
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */

/**
 * @swagger
 * /sla-policies/{id}:
 *   get:
 *     summary: Obter política de SLA
 *     tags: [SLA Policies]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Política encontrada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SlaPolicy'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   patch:
 *     summary: Atualizar política de SLA
 *     description: |
 *       Atualiza uma política de SLA. Disponível para ADMIN e SUPERVISOR
 *       (permissão `slaPolicies.update`). Toda alteração gera auditoria imutável.
 *     tags: [SLA Policies]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSlaPolicyInput'
 *           example:
 *             resolutionHours: 16
 *             isActive: false
 *     responses:
 *       200:
 *         description: Política atualizada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SlaPolicy'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Já existe uma política com este nome
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *   delete:
 *     summary: Remover política de SLA
 *     description: |
 *       Remove definitivamente uma política de SLA. Restrito a ADMIN
 *       (permissão `slaPolicies.delete`). A remoção gera auditoria imutável.
 *     tags: [SLA Policies]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Política removida
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         deleted:
 *                           type: boolean
 *                           example: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

export {};
