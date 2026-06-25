/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     tags:
 *       - Administration
 *     summary: Listar registros de auditoria imutável
 *     description: >
 *       Retorna a trilha de auditoria append-only com hash encadeado.
 *       Disponível apenas para administradores e supervisores
 *       (permissão `audit.read`).
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityId
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
 *         description: Lista paginada de registros de auditoria
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 */

/**
 * @swagger
 * /admin/audit-logs/verify:
 *   get:
 *     tags:
 *       - Administration
 *     summary: Verificar integridade da cadeia de auditoria
 *     description: >
 *       Recalcula o hash de cada registro e valida o encadeamento.
 *       Retorna o total verificado, o status da cadeia e o primeiro
 *       registro inválido, caso exista.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Resultado da verificação de integridade
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [VALID, BROKEN, EMPTY]
 *                     valid:
 *                       type: boolean
 *                     totalVerified:
 *                       type: integer
 *                     firstInvalid:
 *                       type: object
 *                       nullable: true
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 */
