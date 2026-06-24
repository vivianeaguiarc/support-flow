/**
 * @swagger
 * /admin/jobs:
 *   get:
 *     summary: Monitoramento de filas de jobs
 *     description: |
 *       Retorna contagem de jobs por fila (waiting, active, completed, failed)
 *       e totais agregados. Apenas administradores.
 *     tags: [Admin Jobs]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Visão geral das filas
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/JobsOverview'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /admin/jobs/metrics:
 *   get:
 *     summary: Métricas detalhadas das filas
 *     description: |
 *       Retorna métricas por fila incluindo dead-letter queues.
 *       Apenas administradores.
 *     tags: [Admin Jobs]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas das filas
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/JobsMetrics'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

export {};
