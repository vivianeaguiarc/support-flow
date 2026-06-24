/**
 * @swagger
 * /knowledge/articles:
 *   get:
 *     summary: Listar artigos da base de conhecimento
 *     description: |
 *       Endpoint público com autenticação opcional (JWT Bearer ou `x-api-key`).
 *       API Keys ativas autenticam integrações externas e limitam dados ao tenant da chave.
 *       Visitantes e clientes veem apenas artigos `PUBLISHED`.
 *       Admin e supervisor podem filtrar por `status`, `category` e `search`.
 *     tags: [Knowledge Base]
 *     security:
 *       - {}
 *       - ApiKeyAuth: []
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca em título, conteúdo e slug
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/KnowledgeArticleStatus'
 *         description: Disponível apenas para admin/supervisor autenticados
 *     responses:
 *       200:
 *         description: Lista paginada de artigos
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
 *                         $ref: '#/components/schemas/KnowledgeArticle'
 *   post:
 *     summary: Criar artigo
 *     description: Apenas admin e supervisor podem criar artigos.
 *     tags: [Knowledge Base]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateKnowledgeArticleRequest'
 *     responses:
 *       201:
 *         description: Artigo criado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/KnowledgeArticle'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *
 * /knowledge/articles/{slug}:
 *   get:
 *     summary: Obter artigo por slug
 *     description: |
 *       Endpoint público com autenticação opcional.
 *       Visitantes e clientes acessam apenas artigos publicados.
 *     tags: [Knowledge Base]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artigo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/KnowledgeArticle'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *
 * /knowledge/articles/{id}:
 *   patch:
 *     summary: Atualizar artigo
 *     tags: [Knowledge Base]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateKnowledgeArticleRequest'
 *     responses:
 *       200:
 *         description: Artigo atualizado
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Remover artigo
 *     tags: [Knowledge Base]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Artigo removido
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *
 * /knowledge/articles/{id}/publish:
 *   patch:
 *     summary: Publicar artigo
 *     tags: [Knowledge Base]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Artigo publicado
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *
 * /knowledge/articles/{id}/archive:
 *   patch:
 *     summary: Arquivar artigo
 *     tags: [Knowledge Base]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Artigo arquivado
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

export {};
