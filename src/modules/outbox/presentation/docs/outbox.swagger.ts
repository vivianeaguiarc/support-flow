/**
 * @swagger
 * /admin/outbox:
 *   get:
 *     tags:
 *       - Administration
 *     summary: Listar eventos do outbox transacional
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, PROCESSED, FAILED]
 *       - in: query
 *         name: eventName
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista paginada de eventos do outbox
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 */

/**
 * @swagger
 * /admin/outbox/metrics:
 *   get:
 *     tags:
 *       - Administration
 *     summary: Métricas agregadas do outbox
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Contadores por status do outbox
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 */
