/**
 * @swagger
 * /health/observability:
 *   get:
 *     tags:
 *       - Health
 *     summary: Observability health check
 *     description: |
 *       Retorna status de observabilidade, conectividade com dependências, resumo de métricas HTTP
 *       e visão das filas de jobs. Disponível em `/health/observability` e `/api/v1/health/observability`.
 *     responses:
 *       200:
 *         description: Observabilidade operacional
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ObservabilityHealthResponse'
 *       503:
 *         description: Dependência crítica indisponível
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ObservabilityHealthResponse'
 *
 * /metrics:
 *   get:
 *     tags:
 *       - Health
 *     summary: Prometheus metrics
 *     description: |
 *       Expõe métricas no formato Prometheus (text/plain). Requer `METRICS_ENABLED=true`.
 *       Disponível em `/api/v1/metrics`.
 *     responses:
 *       200:
 *         description: Métricas Prometheus
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *             example: |
 *               # HELP http_requests_total Total number of HTTP requests
 *               # TYPE http_requests_total counter
 *               http_requests_total{method="GET",route="/api/v1/health",status_code="200"} 1
 *       404:
 *         description: Métricas desabilitadas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */

export {};
