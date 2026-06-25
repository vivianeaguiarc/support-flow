/**
 * @swagger
 * /admin/notifications/health:
 *   get:
 *     summary: Verificar saúde do serviço de e-mail
 *     description: |
 *       Retorna o status do provider de e-mail configurado (SMTP ou noop em ambiente local).
 *       Apenas administradores podem acessar este endpoint.
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Status do serviço de e-mail
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/EmailProviderHealth'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

export {};
