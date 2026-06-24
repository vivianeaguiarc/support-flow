/**
 * @swagger
 * /api-keys:
 *   post:
 *     summary: Criar API Key
 *     description: |
 *       Gera uma nova API Key para integrações externas.
 *       A chave completa é retornada **apenas nesta resposta** — armazene com segurança.
 *       Apenas administradores podem criar API Keys.
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateApiKeyInput'
 *           example:
 *             name: Integração ERP
 *             expiresAt: '2027-06-24T00:00:00.000Z'
 *     responses:
 *       201:
 *         description: API Key criada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ApiKeyWithSecret'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   get:
 *     summary: Listar API Keys
 *     description: Lista API Keys do tenant (sem expor o segredo completo).
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de API Keys
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
 *                         $ref: '#/components/schemas/ApiKey'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api-keys/{id}/revoke:
 *   patch:
 *     summary: Revogar API Key
 *     description: Desativa uma API Key existente (active = false).
 *     tags: [API Keys]
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
 *         description: API Key revogada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ApiKey'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api-keys/{id}:
 *   delete:
 *     summary: Remover API Key
 *     description: Remove permanentemente uma API Key.
 *     tags: [API Keys]
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
 *         description: API Key removida
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

export {};
