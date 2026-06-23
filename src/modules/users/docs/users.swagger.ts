/**
 * @swagger
 * /users:
 *   post:
 *     summary: Criar novo usuário
 *     description: |
 *       Cria um novo usuário no sistema.
 *       Registro público é permitido apenas para role CUSTOMER.
 *       Roles ADMIN e AGENT exigem autenticação de administrador.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 description: Nome completo do usuário
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email único do usuário
 *                 example: joao.silva@supportflow.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Senha (mínimo 8 caracteres)
 *                 example: SenhaSegura123!
 *               role:
 *                 $ref: '#/components/schemas/UserRole'
 *           examples:
 *             admin:
 *               summary: Criar administrador
 *               value:
 *                 name: Maria Administradora
 *                 email: maria.admin@supportflow.com
 *                 password: Admin123!
 *                 role: ADMIN
 *             agent:
 *               summary: Criar agente de suporte
 *               value:
 *                 name: Carlos Atendente
 *                 email: carlos.atendente@supportflow.com
 *                 password: Agente123!
 *                 role: AGENT
 *             customer:
 *               summary: Criar cliente (registro público)
 *               value:
 *                 name: Ana Cliente
 *                 email: ana.cliente@email.com
 *                 password: Cliente123!
 *                 role: CUSTOMER
 *             supervisor:
 *               summary: Criar supervisor (requer ADMIN autenticado)
 *               value:
 *                 name: Paula Supervisora
 *                 email: paula.supervisor@supportflow.com
 *                 password: Super123!
 *                 role: SUPERVISOR
 *             ombudsman:
 *               summary: Criar ouvidor (requer ADMIN autenticado)
 *               value:
 *                 name: Roberto Ouvidor
 *                 email: roberto.ouvidor@supportflow.com
 *                 password: Ouvidor123!
 *                 role: OMBUDSMAN
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: 550e8400-e29b-41d4-a716-446655440000
 *                 name:
 *                   type: string
 *                   example: João Silva
 *                 email:
 *                   type: string
 *                   example: joao.silva@supportflow.com
 *                 role:
 *                   $ref: '#/components/schemas/UserRole'
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-06-23T12:00:00.000Z
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Invalid email format
 *               statusCode: 400
 *       403:
 *         description: Sem permissão para criar o role informado (ex. CUSTOMER criando ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: User with this email already exists
 *               statusCode: 409
 *   get:
 *     summary: Listar todos os usuários
 *     description: Retorna lista paginada de todos os usuários do tenant (apenas ADMIN)
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   role:
 *                     $ref: '#/components/schemas/UserRole'
 *                   tenantId:
 *                     type: string
 *                     format: uuid
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *             example:
 *               - id: 550e8400-e29b-41d4-a716-446655440001
 *                 name: Maria Administradora
 *                 email: maria@supportflow.com
 *                 role: ADMIN
 *                 tenantId: 650e8400-e29b-41d4-a716-446655440010
 *                 createdAt: 2024-01-15T10:00:00.000Z
 *               - id: 550e8400-e29b-41d4-a716-446655440002
 *                 name: Carlos Agente
 *                 email: carlos@supportflow.com
 *                 role: AGENT
 *                 tenantId: 650e8400-e29b-41d4-a716-446655440010
 *                 createdAt: 2024-02-10T14:30:00.000Z
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sem permissão (apenas ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /users/{id}:
 *   get:
 *     summary: Buscar usuário por ID
 *     description: Retorna detalhes de um usuário específico (apenas ADMIN)
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *         example: 550e8400-e29b-41d4-a716-446655440001
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   $ref: '#/components/schemas/UserRole'
 *                 tenantId:
 *                   type: string
 *                   format: uuid
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *             example:
 *               id: 550e8400-e29b-41d4-a716-446655440001
 *               name: Maria Administradora
 *               email: maria@supportflow.com
 *               role: ADMIN
 *               tenantId: 650e8400-e29b-41d4-a716-446655440010
 *               createdAt: 2024-01-15T10:00:00.000Z
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sem permissão (apenas ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: User not found
 *               statusCode: 404
 */
