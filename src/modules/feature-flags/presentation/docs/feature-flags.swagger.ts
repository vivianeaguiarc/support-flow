/**
 * @swagger
 * /admin/feature-flags:
 *   post:
 *     tags:
 *       - Feature Flags
 *     summary: Create feature flag
 *     description: Cria uma feature flag global. Apenas administradores.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFeatureFlagInput'
 *     responses:
 *       201:
 *         description: Feature flag criada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FeatureFlag'
 *       409:
 *         description: Key já existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *   get:
 *     tags:
 *       - Feature Flags
 *     summary: List feature flags
 *     description: Lista todas as feature flags globais. Apenas administradores.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de feature flags
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
 *                         $ref: '#/components/schemas/FeatureFlag'
 *
 * /admin/feature-flags/{key}:
 *   patch:
 *     tags:
 *       - Feature Flags
 *     summary: Update feature flag
 *     description: Atualiza uma feature flag pelo key. Apenas administradores.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *           example: webhooks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateFeatureFlagInput'
 *     responses:
 *       200:
 *         description: Feature flag atualizada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FeatureFlag'
 *       404:
 *         description: Feature flag não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *   delete:
 *     tags:
 *       - Feature Flags
 *     summary: Delete feature flag
 *     description: Remove uma feature flag pelo key. Apenas administradores.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *           example: webhooks
 *     responses:
 *       200:
 *         description: Feature flag removida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *       404:
 *         description: Feature flag não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */

export {};
