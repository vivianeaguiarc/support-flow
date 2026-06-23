/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Liveness check
 *     description: Verifica se o processo da API está respondendo (sem checar dependências externas).
 *     responses:
 *       200:
 *         description: API em execução
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 service:
 *                   type: string
 *                   example: "supportflow-backend"
 *                 environment:
 *                   type: string
 *                   example: "production"
 *
 * /health/ready:
 *   get:
 *     tags:
 *       - Health
 *     summary: Readiness check
 *     description: Verifica se a API está pronta para receber tráfego (inclui conexão com o banco).
 *     responses:
 *       200:
 *         description: API pronta
 *       503:
 *         description: Dependência indisponível (ex. banco de dados)
 */

export {};
