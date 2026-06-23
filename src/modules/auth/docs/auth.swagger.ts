/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Autenticar usuário
 *     description: Realiza login e retorna token JWT para autenticação em endpoints protegidos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *                 example: "agente@supportflow.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Senha do usuário
 *                 example: "senha123"
 *           examples:
 *             agente:
 *               summary: Login de agente
 *               value:
 *                 email: "agente@supportflow.com"
 *                 password: "senha123"
 *             admin:
 *               summary: Login de administrador
 *               value:
 *                 email: "admin@supportflow.com"
 *                 password: "admin123"
 *             cliente:
 *               summary: Login de cliente
 *               value:
 *                 email: "cliente@email.com"
 *                 password: "cliente123"
 *     responses:
 *       200:
 *         description: Autenticação bem-sucedida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT Bearer
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     tenantId:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                       example: "João Silva"
 *                     email:
 *                       type: string
 *                       example: "agente@supportflow.com"
 *                     role:
 *                       $ref: '#/components/schemas/UserRole'
 *             example:
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsInRlbmFudElkIjoiNjYwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAxIiwiaWF0IjoxNzAzMzQ1Njc4fQ..."
 *               user:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 tenantId: "660e8400-e29b-41d4-a716-446655440001"
 *                 name: "João Silva"
 *                 email: "agente@supportflow.com"
 *                 role: "AGENT"
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid credentials"
 *               statusCode: 401
 */

export {};
