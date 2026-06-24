/**
 * @swagger
 * /ticket-categories:
 *   get:
 *     summary: Listar categorias de chamados
 *     description: |
 *       Retorna lista paginada de categorias do tenant.
 *
 *       **Permissões:** roles com acesso à listagem de chamados.
 *     tags:
 *       - Ticket Categories
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
 *           enum: [name, createdAt]
 *           default: name
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
 *         description: Busca por nome ou descrição
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por categoria ativa/inativa
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
 *         description: Lista paginada de categorias
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
 *                         $ref: '#/components/schemas/TicketCategory'
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
