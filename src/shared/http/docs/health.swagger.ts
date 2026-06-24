/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Liveness check
 *     description: |
 *       Verifica se o processo da API está respondendo (sem checar dependências externas).
 *       Disponível em `/health` e `/api/v1/health`.
 *     responses:
 *       200:
 *         description: API em execução
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatusResponse'
 *             example:
 *               status: ok
 *               service: supportflow-backend
 *               environment: development
 *               timestamp: '2026-06-23T12:00:00.000Z'
 *
 * /health/ready:
 *   get:
 *     tags:
 *       - Health
 *     summary: Readiness check
 *     description: |
 *       Verifica se a API está pronta para receber tráfego, incluindo conectividade com PostgreSQL.
 *       Disponível em `/health/ready` e `/api/v1/health/ready`.
 *     responses:
 *       200:
 *         description: API pronta — banco acessível
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthReadyResponse'
 *             example:
 *               status: ready
 *               service: supportflow-backend
 *               timestamp: '2026-06-23T12:00:00.000Z'
 *               checks:
 *                 database: up
 *       503:
 *         description: Dependência indisponível (banco de dados)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthReadyResponse'
 *             example:
 *               status: not_ready
 *               service: supportflow-backend
 *               timestamp: '2026-06-23T12:00:00.000Z'
 *               checks:
 *                 database: down
 *
 * /health/observability:
 *   get:
 *     tags:
 *       - Health
 *     summary: Observability health check
 *     description: |
 *       Status de observabilidade, dependências, métricas HTTP e filas de jobs.
 *       Disponível em `/health/observability` e `/api/v1/health/observability`.
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
 */

export {};
