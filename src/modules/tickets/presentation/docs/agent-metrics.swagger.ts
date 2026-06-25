/**
 * @swagger
 * /metrics/agents:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Métricas por atendente
 *     description: |
 *       Retorna indicadores operacionais por atendente (`AGENT`):
 *       tickets atribuídos, resolvidos, em aberto e com SLA violado.
 *
 *       **Permissões:** `SUPERVISOR`, `ADMIN`.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas por atendente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AgentMetricsListResponse'
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
 */
export {};
