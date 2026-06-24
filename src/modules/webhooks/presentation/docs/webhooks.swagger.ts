/**
 * @swagger
 * /webhooks:
 *   post:
 *     summary: Criar webhook
 *     description: |
 *       Registra um endpoint para receber eventos do SupportFlow.
 *       O `secret` é retornado **apenas nesta resposta** — use-o para validar assinaturas HMAC.
 *       Apenas administradores podem gerenciar webhooks.
 *     tags: [Webhooks]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWebhookInput'
 *           example:
 *             name: ERP Integration
 *             url: https://example.com/webhooks/supportflow
 *             events:
 *               - ticket.created
 *               - ticket.resolved
 *     responses:
 *       201:
 *         description: Webhook criado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/WebhookEndpointWithSecret'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   get:
 *     summary: Listar webhooks
 *     description: Lista webhooks do tenant (sem expor o secret).
 *     tags: [Webhooks]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de webhooks
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
 *                         $ref: '#/components/schemas/WebhookEndpoint'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /webhooks/{id}:
 *   get:
 *     summary: Obter webhook
 *     tags: [Webhooks]
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
 *         description: Webhook encontrado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/WebhookEndpoint'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   patch:
 *     summary: Atualizar webhook
 *     tags: [Webhooks]
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
 *             $ref: '#/components/schemas/UpdateWebhookInput'
 *     responses:
 *       200:
 *         description: Webhook atualizado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/WebhookEndpoint'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Remover webhook
 *     tags: [Webhooks]
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
 *         description: Webhook removido
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
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /webhooks/{id}/test:
 *   post:
 *     summary: Enviar evento de teste
 *     description: |
 *       Dispara uma entrega de teste para o endpoint configurado.
 *       Registra a tentativa em `WebhookDelivery` e retorna o resultado.
 *     tags: [Webhooks]
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
 *         description: Entrega de teste processada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/WebhookDelivery'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

export {};
