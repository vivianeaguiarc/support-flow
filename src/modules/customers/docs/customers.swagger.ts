/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Listar clientes
 *     description: |
 *       Retorna lista paginada de clientes do tenant.
 *
 *       **Permissões:** `AGENT`, `SUPERVISOR` ou `ADMIN`.
 *     tags:
 *       - Customers
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, email, createdAt]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Busca por nome, e-mail, telefone ou documento
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo/inativo
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Lista paginada de clientes
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiPaginatedSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Customer'
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
