import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Options } from 'swagger-jsdoc';
import swaggerJsdoc from 'swagger-jsdoc';

import { env } from './env.js';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const isProductionBuild = configDir.includes(`${path.sep}dist${path.sep}`);
const docsRoot = path.join(configDir, '..');
const swaggerExtension = isProductionBuild ? 'js' : 'ts';

// `swagger-jsdoc` resolves `apis` patterns with the `glob` package, which treats
// backslashes as escape characters. Normalize to POSIX separators so globbing
// works on Windows as well as POSIX environments.
const toGlob = (pattern: string): string => pattern.split(path.sep).join('/');

const swaggerApiGlobs = [
  toGlob(
    path.join(docsRoot, `modules/auth/docs/*.swagger.${swaggerExtension}`),
  ),
  toGlob(
    path.join(docsRoot, `modules/users/docs/*.swagger.${swaggerExtension}`),
  ),
  toGlob(
    path.join(docsRoot, `modules/customers/docs/*.swagger.${swaggerExtension}`),
  ),
  toGlob(
    path.join(
      docsRoot,
      `modules/**/presentation/docs/*.swagger.${swaggerExtension}`,
    ),
  ),
  toGlob(
    path.join(
      docsRoot,
      `modules/outbox/presentation/docs/*.swagger.${swaggerExtension}`,
    ),
  ),
  toGlob(path.join(docsRoot, `shared/http/docs/*.swagger.${swaggerExtension}`)),
];

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SupportFlow API v1',
      version: '1.0',
      description: [
        'API REST do **SupportFlow** — plataforma multi-tenant de atendimento ao cliente (SAC e Ouvidoria):',
        'chamados, SLA, comentários, anexos, base de conhecimento, automações, webhooks, analytics e relatórios.',
        '',
        '### Autenticação',
        '- **JWT Bearer**: obtenha o `accessToken` em `POST /auth/login` e envie no header `Authorization: Bearer <token>`. Renove com `POST /auth/refresh` e recupere o usuário em `GET /auth/me`.',
        '- **API Key**: para integrações externas, envie o header `x-api-key: supportflow_sk_live_...`.',
        '',
        '### Versionamento',
        '- **v1** (esta documentação) é a versão estável. A versão em evolução fica em `/api/docs/v2`.',
        '',
        '### Multi-tenant',
        '- O acesso é isolado por organização (tenant). Usuários comuns ficam restritos ao tenant do JWT; `SUPER_ADMIN` pode acessar outro tenant via `x-tenant-id`/`x-tenant-slug`.',
        '',
        '> `Customer` é uma entidade interna referenciada por `customerId` na criação de chamados — não há CRUD REST público de clientes.',
        '',
        '### Documentação complementar',
        '- [Autenticação](/api/docs/guides/authentication)',
        '- [Segurança](/api/docs/guides/security)',
        '- [RBAC](/api/docs/guides/rbac)',
        '- [Versionamento da API](/api/docs/guides/api-versioning)',
        '- [Arquitetura](/api/docs/guides/architecture)',
      ].join('\n'),
      contact: {
        name: 'SupportFlow Team',
        email: 'support@supportflow.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: 'Development server (v1)',
      },
      {
        url: 'https://api.supportflow.com/api/v1',
        description: 'Production server (v1)',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /auth/login endpoint',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description:
            'API Key no formato supportflow_sk_live_... para integrações externas',
        },
      },
      parameters: {
        TenantIdHeader: {
          name: 'x-tenant-id',
          in: 'header',
          required: false,
          description:
            'UUID da organização (tenant). Obrigatório para SUPER_ADMIN acessar outra organização. Usuários comuns são sempre restritos ao tenant do JWT.',
          schema: { type: 'string', format: 'uuid' },
        },
        TenantSlugHeader: {
          name: 'x-tenant-slug',
          in: 'header',
          required: false,
          description:
            'Slug da organização. Alternativa ao x-tenant-id ou subdomínio.',
          schema: { type: 'string' },
        },
      },
      responses: {
        BadRequestError: {
          description: 'Requisição inválida (validação ou payload incorreto)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiErrorResponse' },
            },
          },
        },
        UnauthorizedError: {
          description: 'Token ausente, inválido ou expirado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiErrorResponse' },
            },
          },
        },
        ForbiddenError: {
          description: 'Acesso negado — permissão insuficiente para o recurso',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiErrorResponse' },
            },
          },
        },
        NotFoundError: {
          description: 'Recurso não encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiErrorResponse' },
            },
          },
        },
      },
      schemas: {
        ApiSuccessResponse: {
          type: 'object',
          required: ['success', 'data', 'message'],
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              description: 'Payload da operação',
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully',
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          required: [
            'page',
            'limit',
            'total',
            'totalPages',
            'hasNextPage',
            'hasPreviousPage',
          ],
          properties: {
            page: {
              type: 'integer',
              description: 'Página atual',
              example: 1,
            },
            limit: {
              type: 'integer',
              description: 'Itens por página',
              example: 10,
            },
            total: {
              type: 'integer',
              description: 'Total de registros',
              example: 100,
            },
            totalPages: {
              type: 'integer',
              description: 'Total de páginas',
              example: 10,
            },
            hasNextPage: {
              type: 'boolean',
              description: 'Indica se existe próxima página',
              example: true,
            },
            hasPreviousPage: {
              type: 'boolean',
              description: 'Indica se existe página anterior',
              example: false,
            },
          },
        },
        AuditLogResponse: {
          type: 'object',
          required: [
            'id',
            'sequence',
            'organizationId',
            'userId',
            'action',
            'entity',
            'entityId',
            'ip',
            'requestId',
            'oldValues',
            'newValues',
            'metadata',
            'previousHash',
            'hash',
            'createdAt',
          ],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '6b1f0e2a-9c2a-4f1e-9b3b-1d2e3f4a5b6c',
            },
            sequence: {
              type: 'string',
              description:
                'Posição na cadeia (BigInt serializado como string).',
              example: '42',
            },
            organizationId: {
              type: 'string',
              nullable: true,
              example: 'b9c1d2e3-4f56-7890-abcd-ef0123456789',
            },
            userId: {
              type: 'string',
              nullable: true,
              description: 'Autor da ação auditada, quando disponível.',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef0123456789',
            },
            action: { type: 'string', example: 'ROLE_UPDATED' },
            entity: { type: 'string', example: 'Role' },
            entityId: {
              type: 'string',
              nullable: true,
              example: 'c3d4e5f6-a1b2-7890-abcd-ef0123456789',
            },
            ip: {
              type: 'string',
              nullable: true,
              description:
                'Endereço IP de origem, mapeado de metadata quando coletado.',
              example: '203.0.113.10',
            },
            requestId: {
              type: 'string',
              nullable: true,
              description:
                'Identificador da requisição, mapeado de metadata quando coletado.',
              example: 'req_01HZX8Y2',
            },
            oldValues: {
              nullable: true,
              description: 'Snapshot anterior, quando aplicável.',
            },
            newValues: {
              nullable: true,
              description: 'Snapshot posterior, quando aplicável.',
            },
            metadata: {
              nullable: true,
              description: 'Metadados não sensíveis adicionais.',
            },
            previousHash: {
              type: 'string',
              nullable: true,
              description: 'Hash do registro anterior na cadeia.',
            },
            hash: {
              type: 'string',
              description: 'Hash encadeado deste registro.',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-06-25T18:30:00.000Z',
            },
          },
        },
        PaginatedAuditLogResponse: {
          type: 'object',
          required: ['success', 'data', 'meta', 'message'],
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/AuditLogResponse' },
            },
            meta: { $ref: '#/components/schemas/PaginationMeta' },
            message: {
              type: 'string',
              example: 'Audit logs retrieved successfully',
            },
          },
        },
        AuditIntegrityVerificationResponse: {
          type: 'object',
          required: [
            'status',
            'totalLogs',
            'checkedAt',
            'firstLogId',
            'lastLogId',
            'compromisedLogId',
            'message',
            'chainStatus',
            'valid',
            'totalVerified',
            'firstInvalid',
          ],
          properties: {
            status: {
              type: 'string',
              enum: ['INTACT', 'EMPTY', 'COMPROMISED'],
              description:
                'Resultado claro da verificação de integridade da cadeia.',
              example: 'INTACT',
            },
            totalLogs: { type: 'integer', example: 128 },
            checkedAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-06-25T18:31:00.000Z',
            },
            firstLogId: {
              type: 'string',
              nullable: true,
              example: '6b1f0e2a-9c2a-4f1e-9b3b-1d2e3f4a5b6c',
            },
            lastLogId: {
              type: 'string',
              nullable: true,
              example: 'f4a5b6c7-1d2e-3f40-9b3b-6b1f0e2a9c2a',
            },
            compromisedLogId: {
              type: 'string',
              nullable: true,
              description:
                'Id do primeiro registro com integridade comprometida, se houver.',
              example: null,
            },
            message: {
              type: 'string',
              example: 'Audit chain is intact. 128 log(s) verified.',
            },
            chainStatus: {
              type: 'string',
              enum: ['VALID', 'BROKEN', 'EMPTY'],
              description: 'Status legado da cadeia (compatibilidade).',
              example: 'VALID',
            },
            valid: { type: 'boolean', example: true },
            totalVerified: { type: 'integer', example: 128 },
            firstInvalid: {
              type: 'object',
              nullable: true,
              description: 'Primeiro registro inválido (formato legado).',
              properties: {
                id: { type: 'string' },
                sequence: { type: 'string' },
                action: { type: 'string' },
                entity: { type: 'string' },
                reason: {
                  type: 'string',
                  enum: ['PREVIOUS_HASH_MISMATCH', 'HASH_MISMATCH'],
                },
                expectedHash: { type: 'string' },
                storedHash: { type: 'string' },
              },
            },
          },
        },
        ApiPaginatedSuccessResponse: {
          type: 'object',
          required: ['success', 'data', 'meta', 'message'],
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: {},
              description: 'Itens da página atual',
            },
            meta: {
              $ref: '#/components/schemas/PaginationMeta',
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully',
            },
          },
        },
        ApiErrorResponse: {
          type: 'object',
          required: ['success', 'error'],
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              required: ['code', 'message', 'details'],
              properties: {
                code: {
                  type: 'string',
                  example: 'RESOURCE_NOT_FOUND',
                  enum: [
                    'VALIDATION_ERROR',
                    'BAD_REQUEST',
                    'UNAUTHORIZED',
                    'FORBIDDEN',
                    'RESOURCE_NOT_FOUND',
                    'UNIQUE_CONSTRAINT_VIOLATION',
                    'INTERNAL_SERVER_ERROR',
                  ],
                },
                message: {
                  type: 'string',
                  example: 'Resource not found',
                },
                details: {
                  type: 'array',
                  items: {},
                  example: [],
                },
              },
            },
            requestId: {
              type: 'string',
              description: 'Identificador da requisição para rastreamento',
              example: 'req-1',
            },
          },
        },
        Error: {
          description:
            'Alias legado — preferir ApiErrorResponse nas novas integrações',
          allOf: [{ $ref: '#/components/schemas/ApiErrorResponse' }],
        },
        TicketStatus: {
          type: 'string',
          enum: [
            'OPEN',
            'IN_PROGRESS',
            'WAITING_CUSTOMER',
            'ESCALATED',
            'RESOLVED',
            'CLOSED',
          ],
          description: 'Status do chamado',
          example: 'OPEN',
        },
        TicketPriority: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
          description:
            'Prioridade do chamado (`URGENT` equivale ao nível crítico de SLA: 2h)',
          example: 'MEDIUM',
        },
        TicketSlaStatus: {
          type: 'string',
          enum: ['ON_TIME', 'WARNING', 'BREACHED'],
          description: 'Status operacional do SLA do chamado',
          example: 'ON_TIME',
        },
        TicketSlaSummary: {
          type: 'object',
          required: ['onTime', 'warning', 'breached', 'total'],
          properties: {
            onTime: {
              type: 'integer',
              description: 'Chamados ativos dentro do prazo',
              example: 12,
            },
            warning: {
              type: 'integer',
              description: 'Chamados ativos em alerta (vencem em até 24h)',
              example: 3,
            },
            breached: {
              type: 'integer',
              description: 'Chamados ativos com SLA violado',
              example: 2,
            },
            total: {
              type: 'integer',
              description: 'Total de chamados ativos monitorados',
              example: 17,
            },
          },
        },
        BreachedSlaTicket: {
          allOf: [
            { $ref: '#/components/schemas/Ticket' },
            {
              type: 'object',
              required: ['slaStatus', 'hoursOverdue'],
              properties: {
                slaStatus: {
                  type: 'string',
                  enum: ['BREACHED'],
                },
                hoursOverdue: {
                  type: 'integer',
                  example: 5,
                },
              },
            },
          ],
        },
        UserRole: {
          type: 'string',
          enum: ['ADMIN', 'SUPERVISOR', 'AGENT', 'CUSTOMER', 'OMBUDSMAN'],
          description: 'Role/Papel do usuário',
          example: 'AGENT',
        },
        NotificationType: {
          type: 'string',
          enum: [
            'TICKET_CREATED',
            'TICKET_ASSIGNED',
            'TICKET_STATUS_CHANGED',
            'TICKET_COMMENT_ADDED',
            'TICKET_ATTACHMENT_ADDED',
            'SLA_WARNING',
            'SLA_EXPIRED',
          ],
          description: 'Tipo de notificação do sistema',
          example: 'TICKET_ASSIGNED',
        },
        CommentVisibility: {
          type: 'string',
          enum: ['INTERNAL', 'PUBLIC'],
          description:
            'Visibilidade do comentário — `PUBLIC` é visível ao cliente; `INTERNAL` é restrito à equipe de atendimento.',
          example: 'PUBLIC',
        },
        KnowledgeArticleStatus: {
          type: 'string',
          enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
          example: 'PUBLISHED',
        },
        KnowledgeArticleAuthor: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Maria Santos' },
          },
        },
        KnowledgeArticle: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Como abrir um chamado' },
            slug: { type: 'string', example: 'como-abrir-um-chamado' },
            content: { type: 'string' },
            status: { $ref: '#/components/schemas/KnowledgeArticleStatus' },
            category: { type: 'string', example: 'Atendimento' },
            authorId: { type: 'string', format: 'uuid' },
            author: { $ref: '#/components/schemas/KnowledgeArticleAuthor' },
            publishedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateKnowledgeArticleRequest: {
          type: 'object',
          required: ['title', 'content', 'category'],
          properties: {
            title: { type: 'string', minLength: 3, maxLength: 200 },
            slug: {
              type: 'string',
              minLength: 3,
              maxLength: 200,
              description:
                'Opcional — gerado automaticamente a partir do título',
            },
            content: { type: 'string' },
            category: { type: 'string', minLength: 2, maxLength: 100 },
          },
        },
        UpdateKnowledgeArticleRequest: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 3, maxLength: 200 },
            slug: { type: 'string', minLength: 3, maxLength: 200 },
            content: { type: 'string' },
            category: { type: 'string', minLength: 2, maxLength: 100 },
          },
        },
        EmailProviderHealth: {
          type: 'object',
          properties: {
            provider: { type: 'string', example: 'smtp' },
            enabled: { type: 'boolean', example: true },
            configured: { type: 'boolean', example: true },
            ready: { type: 'boolean', example: true },
            message: {
              type: 'string',
              example: 'SMTP connection verified',
            },
          },
        },
        UserSummary: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              example: 'Maria Santos',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'maria.santos@supportflow.com',
            },
          },
        },
        TicketSummaryRef: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            protocol: {
              type: 'string',
              example: 'TK-2026-004521',
            },
            title: {
              type: 'string',
              example: 'Reclamação Ouvidoria — reembolso não creditado',
            },
          },
        },
        TicketHistoryEvent: {
          type: 'string',
          enum: [
            'CREATED',
            'ASSIGNED',
            'REASSIGNED',
            'STATUS_CHANGED',
            'PRIORITY_CHANGED',
            'CATEGORY_CHANGED',
            'COMMENT_ADDED',
            'ATTACHMENT_ADDED',
            'ATTACHMENT_REMOVED',
            'TICKET_ESCALATED',
            'SLA_BREACHED',
          ],
          description: 'Evento do histórico do chamado',
          example: 'STATUS_CHANGED',
        },
        Ticket: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único do chamado',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            tenantId: {
              type: 'string',
              format: 'uuid',
              description: 'ID do tenant/organização',
            },
            protocol: {
              type: 'string',
              description: 'Número de protocolo único do chamado',
              example: 'TK-2024-001234',
            },
            title: {
              type: 'string',
              description: 'Título do chamado',
              example: 'Problema com cobrança indevida',
            },
            description: {
              type: 'string',
              description: 'Descrição detalhada do chamado',
              example: 'Cliente relata cobrança duplicada no cartão de crédito',
            },
            status: {
              $ref: '#/components/schemas/TicketStatus',
            },
            priority: {
              $ref: '#/components/schemas/TicketPriority',
            },
            customerId: {
              type: 'string',
              format: 'uuid',
              description: 'ID do cliente que abriu o chamado',
            },
            categoryId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'ID da categoria do chamado',
            },
            assignedToId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'ID do agente responsável',
            },
            slaDueAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data/hora limite para resolução (SLA)',
              example: '2024-06-23T18:00:00.000Z',
            },
            closedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Data/hora de fechamento do chamado',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data/hora de criação',
              example: '2024-06-23T12:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data/hora da última atualização',
              example: '2024-06-23T12:30:00.000Z',
            },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', nullable: true },
            document: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        TicketCategory: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            slaHours: { type: 'integer', nullable: true },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateTicketRequest: {
          type: 'object',
          required: ['title', 'description', 'customerId'],
          properties: {
            title: {
              type: 'string',
              minLength: 3,
              description: 'Título do chamado',
              example: 'Problema com cobrança',
            },
            description: {
              type: 'string',
              minLength: 10,
              description: 'Descrição detalhada',
              example: 'Fui cobrado duas vezes no meu cartão de crédito',
            },
            customerId: {
              type: 'string',
              format: 'uuid',
              description: 'ID do cliente',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            priority: {
              $ref: '#/components/schemas/TicketPriority',
            },
            categoryId: {
              type: 'string',
              format: 'uuid',
              description: 'ID da categoria (opcional)',
            },
            assignedToId: {
              type: 'string',
              format: 'uuid',
              description: 'ID do agente responsável (opcional)',
            },
          },
        },
        UpdateTicketStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              $ref: '#/components/schemas/TicketStatus',
            },
          },
        },
        AssignTicketRequest: {
          type: 'object',
          required: ['agentId'],
          properties: {
            agentId: {
              type: 'string',
              format: 'uuid',
              description: 'ID do atendente que será responsável',
              example: '550e8400-e29b-41d4-a716-446655440001',
            },
            assignedToId: {
              type: 'string',
              format: 'uuid',
              deprecated: true,
              description: 'Alias legado de `agentId`',
            },
          },
        },
        BulkUpdateTicketStatusRequest: {
          type: 'object',
          required: ['ticketIds', 'status'],
          properties: {
            ticketIds: {
              type: 'array',
              minItems: 1,
              uniqueItems: true,
              items: {
                type: 'string',
                format: 'uuid',
              },
              description:
                'IDs dos chamados a atualizar. IDs duplicados são removidos.',
            },
            status: {
              $ref: '#/components/schemas/TicketStatus',
            },
            reason: {
              type: 'string',
              maxLength: 1000,
              description: 'Justificativa registrada no histórico (opcional)',
            },
          },
        },
        BulkAssignTicketsRequest: {
          type: 'object',
          required: ['ticketIds', 'assignedToId'],
          properties: {
            ticketIds: {
              type: 'array',
              minItems: 1,
              uniqueItems: true,
              items: {
                type: 'string',
                format: 'uuid',
              },
              description:
                'IDs dos chamados a atribuir. IDs duplicados são removidos.',
            },
            assignedToId: {
              type: 'string',
              format: 'uuid',
              description: 'ID do atendente que receberá os chamados',
            },
            reason: {
              type: 'string',
              maxLength: 1000,
              description: 'Justificativa registrada no histórico (opcional)',
            },
          },
        },
        BulkTicketOperationResult: {
          type: 'object',
          properties: {
            totalRequested: {
              type: 'integer',
              description: 'Quantidade de chamados solicitados (após dedupe)',
              example: 3,
            },
            totalUpdated: {
              type: 'integer',
              description: 'Quantidade de chamados efetivamente alterados',
              example: 3,
            },
            updatedTicketIds: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uuid',
              },
              description: 'IDs dos chamados alterados',
            },
            operation: {
              type: 'string',
              enum: ['bulk_status_update', 'bulk_assign'],
              description: 'Tipo da operação em lote executada',
            },
            message: {
              type: 'string',
              example: 'Tickets updated successfully.',
            },
          },
        },
        TicketComment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            ticketId: {
              type: 'string',
              format: 'uuid',
            },
            tenantId: {
              type: 'string',
              format: 'uuid',
            },
            authorId: {
              type: 'string',
              format: 'uuid',
            },
            content: {
              type: 'string',
              description: 'Conteúdo do comentário',
              example: 'Cliente confirmou o recebimento do reembolso',
            },
            visibility: {
              $ref: '#/components/schemas/CommentVisibility',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        TicketCommentWithAuthor: {
          allOf: [
            { $ref: '#/components/schemas/TicketComment' },
            {
              type: 'object',
              properties: {
                author: {
                  $ref: '#/components/schemas/UserSummary',
                },
              },
            },
          ],
        },
        CreateCommentRequest: {
          type: 'object',
          required: ['content'],
          properties: {
            content: {
              type: 'string',
              minLength: 1,
              maxLength: 5000,
              description: 'Conteúdo do comentário',
              example:
                'Contato telefônico realizado — cliente confirmou recebimento do estorno de R$ 249,90',
            },
            visibility: {
              $ref: '#/components/schemas/CommentVisibility',
              description:
                'Visibilidade do comentário. Opcional. Clientes só podem criar comentários `PUBLIC`; para a equipe, o padrão é `INTERNAL` quando omitido.',
            },
          },
        },
        TicketAttachment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            ticketId: {
              type: 'string',
              format: 'uuid',
            },
            tenantId: {
              type: 'string',
              format: 'uuid',
            },
            uploadedById: {
              type: 'string',
              format: 'uuid',
            },
            fileName: {
              type: 'string',
              description: 'Nome do arquivo',
              example: '1703345678901-comprovante.pdf',
            },
            originalName: {
              type: 'string',
              description: 'Nome original do arquivo',
              example: 'comprovante.pdf',
            },
            mimeType: {
              type: 'string',
              description: 'Tipo MIME do arquivo',
              example: 'application/pdf',
            },
            size: {
              type: 'string',
              description:
                'Tamanho do arquivo em bytes (serializado como string por compatibilidade com BigInt)',
              example: '245678',
            },
            storagePath: {
              type: 'string',
              description: 'Caminho interno de armazenamento (uso interno)',
            },
            fileUrl: {
              type: 'string',
              description: 'URL relativa do arquivo no storage local',
              example: '/storage/attachments/1703345678901-comprovante.pdf',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        TicketAttachmentWithUploader: {
          allOf: [
            { $ref: '#/components/schemas/TicketAttachment' },
            {
              type: 'object',
              properties: {
                uploadedBy: {
                  $ref: '#/components/schemas/UserSummary',
                },
              },
            },
          ],
        },
        TicketHistory: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            ticketId: {
              type: 'string',
              format: 'uuid',
            },
            tenantId: {
              type: 'string',
              format: 'uuid',
            },
            event: {
              $ref: '#/components/schemas/TicketHistoryEvent',
            },
            field: {
              type: 'string',
              nullable: true,
              description: 'Campo alterado',
              example: 'status',
            },
            oldValue: {
              type: 'string',
              nullable: true,
              description: 'Valor anterior',
              example: 'OPEN',
            },
            newValue: {
              type: 'string',
              nullable: true,
              description: 'Novo valor',
              example: 'IN_PROGRESS',
            },
            changedById: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'ID do usuário que fez a alteração',
            },
            metadata: {
              type: 'object',
              nullable: true,
              additionalProperties: true,
              description: 'Metadados adicionais do evento',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        TicketHistoryEntry: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            ticketId: {
              type: 'string',
              format: 'uuid',
            },
            actorId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'ID do usuário que executou a ação',
            },
            action: {
              $ref: '#/components/schemas/TicketHistoryEvent',
            },
            oldValue: {
              type: 'string',
              nullable: true,
            },
            newValue: {
              type: 'string',
              nullable: true,
            },
            metadata: {
              type: 'object',
              nullable: true,
              additionalProperties: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        TicketHistoryListResponse: {
          type: 'object',
          properties: {
            ticketId: {
              type: 'string',
              format: 'uuid',
            },
            history: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/TicketHistoryEntry',
              },
            },
          },
        },
        AgentMetrics: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              format: 'uuid',
            },
            agentName: {
              type: 'string',
            },
            assignedTickets: {
              type: 'integer',
              description: 'Total de tickets atribuídos ao atendente',
            },
            resolvedTickets: {
              type: 'integer',
              description: 'Tickets resolvidos ou encerrados',
            },
            openTickets: {
              type: 'integer',
              description: 'Tickets em aberto atribuídos ao atendente',
            },
            slaBreachedTickets: {
              type: 'integer',
              description: 'Tickets com SLA violado',
            },
          },
        },
        AgentMetricsListResponse: {
          type: 'object',
          properties: {
            agents: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/AgentMetrics',
              },
            },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            tenantId: {
              type: 'string',
              format: 'uuid',
            },
            recipientId: {
              type: 'string',
              format: 'uuid',
            },
            ticketId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            type: {
              $ref: '#/components/schemas/NotificationType',
            },
            title: {
              type: 'string',
              description: 'Título da notificação',
              example: 'Novo chamado atribuído',
            },
            message: {
              type: 'string',
              description: 'Mensagem da notificação',
              example: 'Você foi atribuído ao chamado TK-2024-001234',
            },
            readAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Data/hora de leitura',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        NotificationWithTicket: {
          allOf: [
            { $ref: '#/components/schemas/Notification' },
            {
              type: 'object',
              properties: {
                ticket: {
                  $ref: '#/components/schemas/TicketSummaryRef',
                },
              },
            },
          ],
        },
        MarkAllNotificationsAsReadResponse: {
          type: 'object',
          required: ['count'],
          properties: {
            count: {
              type: 'integer',
              description: 'Número de notificações marcadas como lidas',
              example: 5,
            },
          },
        },
        TicketSummary: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total de chamados',
              example: 150,
            },
            open: {
              type: 'integer',
              description: 'Chamados abertos',
              example: 45,
            },
            inProgress: {
              type: 'integer',
              description: 'Chamados em andamento',
              example: 32,
            },
            waitingCustomer: {
              type: 'integer',
              description: 'Aguardando cliente',
              example: 12,
            },
            escalated: {
              type: 'integer',
              description: 'Chamados escalados',
              example: 5,
            },
            resolved: {
              type: 'integer',
              description: 'Chamados resolvidos',
              example: 42,
            },
            closed: {
              type: 'integer',
              description: 'Chamados fechados',
              example: 14,
            },
            overdue: {
              type: 'integer',
              description: 'Chamados vencidos (SLA)',
              example: 8,
            },
            unassigned: {
              type: 'integer',
              description: 'Chamados não atribuídos',
              example: 15,
            },
            byStatus: {
              type: 'object',
              description: 'Contagem por status',
              example: {
                OPEN: 45,
                IN_PROGRESS: 32,
                WAITING_CUSTOMER: 12,
                ESCALATED: 5,
                RESOLVED: 42,
                CLOSED: 14,
              },
            },
            byPriority: {
              type: 'object',
              description: 'Contagem por prioridade',
              example: {
                LOW: 60,
                MEDIUM: 50,
                HIGH: 30,
                URGENT: 10,
              },
            },
          },
        },
        TicketMetrics: {
          type: 'object',
          properties: {
            avgResolutionTimeHours: {
              type: 'number',
              description: 'Tempo médio de resolução em horas',
              example: 24.5,
            },
            slaComplianceRate: {
              type: 'number',
              description: 'Taxa de cumprimento de SLA (%)',
              example: 85.5,
            },
            resolvedTickets: {
              type: 'integer',
              description: 'Número de chamados resolvidos no período',
              example: 42,
            },
            overdueTickets: {
              type: 'integer',
              description: 'Número de chamados vencidos (SLA)',
              example: 8,
            },
            agentPerformance: {
              type: 'array',
              description:
                'Performance por agente, ordenada por volume de resoluções',
              items: {
                $ref: '#/components/schemas/AgentPerformance',
              },
            },
          },
        },
        AgentPerformance: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              format: 'uuid',
            },
            agentName: {
              type: 'string',
              example: 'Maria Santos',
            },
            resolvedTickets: {
              type: 'integer',
              example: 15,
            },
            avgResolutionTimeHours: {
              type: 'number',
              example: 22.3,
            },
          },
        },
        AnalyticsPeriodCount: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              format: 'date',
              example: '2026-06-01',
            },
            count: {
              type: 'integer',
              example: 12,
            },
          },
        },
        AnalyticsOverview: {
          type: 'object',
          properties: {
            totalTickets: { type: 'integer', example: 150 },
            openTickets: { type: 'integer', example: 45 },
            inProgressTickets: { type: 'integer', example: 32 },
            resolvedTickets: { type: 'integer', example: 42 },
            closedTickets: { type: 'integer', example: 14 },
            slaBreachedTickets: { type: 'integer', example: 8 },
            slaComplianceRate: { type: 'number', example: 85.5 },
            avgResolutionTimeHours: { type: 'number', example: 24.5 },
            ticketsCreatedByPeriod: {
              type: 'array',
              items: { $ref: '#/components/schemas/AnalyticsPeriodCount' },
            },
          },
        },
        AnalyticsTicketsByStatus: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 150 },
            byStatus: {
              type: 'object',
              additionalProperties: { type: 'integer' },
              example: {
                OPEN: 45,
                IN_PROGRESS: 32,
                WAITING_CUSTOMER: 12,
                ESCALATED: 5,
                RESOLVED: 42,
                CLOSED: 14,
              },
            },
          },
        },
        AnalyticsTicketsByPriority: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 150 },
            byPriority: {
              type: 'object',
              additionalProperties: { type: 'integer' },
              example: {
                LOW: 60,
                MEDIUM: 50,
                HIGH: 30,
                URGENT: 10,
              },
            },
          },
        },
        AnalyticsSla: {
          type: 'object',
          properties: {
            onTime: { type: 'integer', example: 20 },
            warning: { type: 'integer', example: 5 },
            breached: { type: 'integer', example: 3 },
            total: { type: 'integer', example: 28 },
            slaComplianceRate: { type: 'number', example: 85.5 },
            slaBreachedTickets: { type: 'integer', example: 8 },
          },
        },
        AnalyticsAgentPerformance: {
          type: 'object',
          properties: {
            agentId: { type: 'string', format: 'uuid' },
            agentName: { type: 'string', example: 'Maria Santos' },
            assignedTickets: { type: 'integer', example: 25 },
            resolvedTickets: { type: 'integer', example: 18 },
            openTickets: { type: 'integer', example: 7 },
            slaBreachedTickets: { type: 'integer', example: 2 },
            avgResolutionTimeHours: { type: 'number', example: 22.3 },
          },
        },
        AnalyticsAgentsPerformance: {
          type: 'object',
          properties: {
            agents: {
              type: 'array',
              items: { $ref: '#/components/schemas/AnalyticsAgentPerformance' },
            },
          },
        },
        AnalyticsCsat: {
          type: 'object',
          properties: {
            averageRating: { type: 'number', example: 4.2 },
            totalSurveys: { type: 'integer', example: 50 },
            distribution: {
              type: 'array',
              items: { $ref: '#/components/schemas/CsatRatingDistribution' },
            },
            byAgent: {
              type: 'array',
              items: { $ref: '#/components/schemas/CsatAgentAverage' },
            },
            byPeriod: {
              type: 'array',
              items: { $ref: '#/components/schemas/CsatPeriodAverage' },
            },
          },
        },
        CsatRatingDistribution: {
          type: 'object',
          properties: {
            rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
            count: { type: 'integer', example: 20 },
          },
        },
        CsatAgentAverage: {
          type: 'object',
          properties: {
            agentId: { type: 'string', format: 'uuid' },
            agentName: { type: 'string', example: 'Maria Santos' },
            averageRating: { type: 'number', example: 4.5 },
            totalSurveys: { type: 'integer', example: 12 },
          },
        },
        CsatPeriodAverage: {
          type: 'object',
          properties: {
            period: { type: 'string', example: '2026-06-01' },
            averageRating: { type: 'number', example: 4.0 },
            count: { type: 'integer', example: 10 },
          },
        },
        TicketSatisfactionSurvey: {
          type: 'object',
          required: [
            'id',
            'tenantId',
            'ticketId',
            'customerId',
            'rating',
            'submittedAt',
            'createdAt',
          ],
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            ticketId: { type: 'string', format: 'uuid' },
            customerId: { type: 'string', format: 'uuid' },
            rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
            comment: { type: 'string', nullable: true },
            submittedAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        SubmitTicketSatisfactionInput: {
          type: 'object',
          required: ['rating'],
          properties: {
            rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
            comment: { type: 'string', maxLength: 1000 },
          },
        },
        ApiKey: {
          type: 'object',
          required: [
            'id',
            'tenantId',
            'name',
            'prefix',
            'active',
            'createdById',
            'createdAt',
            'updatedAt',
          ],
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Integração ERP' },
            prefix: {
              type: 'string',
              example: 'supportflow_sk_live_a1b2c3d4',
              description:
                'Prefixo identificador (segredo completo não é exposto)',
            },
            active: { type: 'boolean', example: true },
            lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
            expiresAt: { type: 'string', format: 'date-time', nullable: true },
            createdById: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ApiKeyWithSecret: {
          allOf: [
            { $ref: '#/components/schemas/ApiKey' },
            {
              type: 'object',
              required: ['key'],
              properties: {
                key: {
                  type: 'string',
                  example: 'supportflow_sk_live_xxxxxxxxxxxxxxxx',
                  description:
                    'Chave completa — exibida apenas no momento da criação',
                },
              },
            },
          ],
        },
        CreateApiKeyInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 120 },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
        FeatureFlag: {
          type: 'object',
          required: ['id', 'key', 'enabled', 'createdAt', 'updatedAt'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            key: { type: 'string', example: 'webhooks' },
            description: {
              type: 'string',
              nullable: true,
              example: 'Controls outbound webhook deliveries',
            },
            enabled: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateFeatureFlagInput: {
          type: 'object',
          required: ['key'],
          properties: {
            key: { type: 'string', example: 'webhooks' },
            description: { type: 'string', maxLength: 500 },
            enabled: { type: 'boolean', default: false },
          },
        },
        UpdateFeatureFlagInput: {
          type: 'object',
          properties: {
            description: { type: 'string', nullable: true, maxLength: 500 },
            enabled: { type: 'boolean' },
          },
        },
        WebhookEndpoint: {
          type: 'object',
          required: [
            'id',
            'tenantId',
            'name',
            'url',
            'active',
            'events',
            'createdById',
            'createdAt',
            'updatedAt',
          ],
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'ERP Integration' },
            url: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com/webhooks/supportflow',
            },
            active: { type: 'boolean', example: true },
            events: {
              type: 'array',
              items: { $ref: '#/components/schemas/WebhookEventType' },
            },
            createdById: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        WebhookEndpointWithSecret: {
          allOf: [
            { $ref: '#/components/schemas/WebhookEndpoint' },
            {
              type: 'object',
              required: ['secret'],
              properties: {
                secret: {
                  type: 'string',
                  example: 'whsec_xxxxxxxx',
                  description:
                    'Segredo HMAC — exibido apenas no momento da criação',
                },
              },
            },
          ],
        },
        WebhookEventType: {
          type: 'string',
          enum: [
            'ticket.created',
            'ticket.updated',
            'ticket.assigned',
            'ticket.resolved',
            'ticket.closed',
            'sla.warning',
            'sla.breached',
            'csat.submitted',
          ],
        },
        CreateWebhookInput: {
          type: 'object',
          required: ['name', 'url', 'events'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 120 },
            url: { type: 'string', format: 'uri' },
            events: {
              type: 'array',
              minItems: 1,
              items: { $ref: '#/components/schemas/WebhookEventType' },
            },
          },
        },
        UpdateWebhookInput: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 120 },
            url: { type: 'string', format: 'uri' },
            events: {
              type: 'array',
              minItems: 1,
              items: { $ref: '#/components/schemas/WebhookEventType' },
            },
            active: { type: 'boolean' },
          },
        },
        WebhookDelivery: {
          type: 'object',
          required: [
            'id',
            'tenantId',
            'webhookEndpointId',
            'event',
            'payload',
            'status',
            'attemptCount',
            'createdAt',
          ],
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            webhookEndpointId: { type: 'string', format: 'uuid' },
            event: { $ref: '#/components/schemas/WebhookEventType' },
            payload: { type: 'object', additionalProperties: true },
            status: {
              type: 'string',
              enum: ['PENDING', 'DELIVERED', 'FAILED'],
            },
            responseStatus: { type: 'integer', nullable: true },
            responseBody: { type: 'string', nullable: true },
            attemptCount: { type: 'integer', example: 1 },
            deliveredAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            failedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        SlaPolicy: {
          type: 'object',
          required: [
            'id',
            'tenantId',
            'name',
            'description',
            'priority',
            'firstResponseHours',
            'resolutionHours',
            'businessHoursOnly',
            'isActive',
            'categoryIds',
            'createdById',
            'createdAt',
            'updatedAt',
          ],
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'SLA Prioridade Alta' },
            description: {
              type: 'string',
              nullable: true,
              example: 'Política aplicada a chamados de alta prioridade',
            },
            priority: {
              allOf: [{ $ref: '#/components/schemas/TicketPriority' }],
              nullable: true,
              description:
                'Prioridade associada à política. `null` indica que se aplica a qualquer prioridade.',
            },
            firstResponseHours: {
              type: 'integer',
              minimum: 1,
              description: 'Tempo máximo (em horas) para a primeira resposta',
              example: 4,
            },
            resolutionHours: {
              type: 'integer',
              minimum: 1,
              description: 'Tempo máximo (em horas) para a resolução',
              example: 24,
            },
            businessHoursOnly: {
              type: 'boolean',
              description:
                'Quando verdadeiro, os prazos consideram apenas horário comercial',
              example: false,
            },
            isActive: { type: 'boolean', example: true },
            categoryIds: {
              type: 'array',
              description: 'Categorias de ticket associadas à política',
              items: { type: 'string', format: 'uuid' },
            },
            createdById: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateSlaPolicyInput: {
          type: 'object',
          required: ['name', 'firstResponseHours', 'resolutionHours'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 120 },
            description: { type: 'string', maxLength: 500, nullable: true },
            priority: {
              allOf: [{ $ref: '#/components/schemas/TicketPriority' }],
              nullable: true,
            },
            categoryIds: {
              type: 'array',
              maxItems: 100,
              items: { type: 'string', format: 'uuid' },
            },
            firstResponseHours: { type: 'integer', minimum: 1, example: 4 },
            resolutionHours: { type: 'integer', minimum: 1, example: 24 },
            businessHoursOnly: { type: 'boolean', default: false },
            isActive: { type: 'boolean', default: true },
          },
        },
        UpdateSlaPolicyInput: {
          type: 'object',
          description: 'Atualização parcial — informe ao menos um campo.',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 120 },
            description: { type: 'string', maxLength: 500, nullable: true },
            priority: {
              allOf: [{ $ref: '#/components/schemas/TicketPriority' }],
              nullable: true,
            },
            categoryIds: {
              type: 'array',
              maxItems: 100,
              items: { type: 'string', format: 'uuid' },
            },
            firstResponseHours: { type: 'integer', minimum: 1 },
            resolutionHours: { type: 'integer', minimum: 1 },
            businessHoursOnly: { type: 'boolean' },
            isActive: { type: 'boolean' },
          },
        },
        QueueJobCounts: {
          type: 'object',
          properties: {
            waiting: { type: 'integer', example: 2 },
            active: { type: 'integer', example: 1 },
            completed: { type: 'integer', example: 120 },
            failed: { type: 'integer', example: 0 },
            delayed: { type: 'integer', example: 0 },
          },
        },
        JobsOverview: {
          type: 'object',
          required: ['queues', 'totals'],
          properties: {
            queues: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  waiting: { type: 'integer' },
                  active: { type: 'integer' },
                  completed: { type: 'integer' },
                  failed: { type: 'integer' },
                },
              },
            },
            totals: {
              type: 'object',
              properties: {
                waiting: { type: 'integer' },
                active: { type: 'integer' },
                completed: { type: 'integer' },
                failed: { type: 'integer' },
              },
            },
          },
        },
        JobsMetrics: {
          type: 'object',
          required: ['queues', 'generatedAt'],
          properties: {
            generatedAt: { type: 'string', format: 'date-time' },
            queues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'email-queue' },
                  counts: { $ref: '#/components/schemas/QueueJobCounts' },
                  deadLetter: { $ref: '#/components/schemas/QueueJobCounts' },
                },
              },
            },
          },
        },
        TicketStatusTransitions: {
          type: 'object',
          properties: {
            currentStatus: {
              $ref: '#/components/schemas/TicketStatus',
            },
            allowedTransitions: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/TicketStatus',
              },
              description: 'Status permitidos a partir do estado atual',
            },
          },
        },
        PaginatedTickets: {
          allOf: [
            { $ref: '#/components/schemas/ApiPaginatedSuccessResponse' },
            {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Ticket',
                  },
                },
              },
            },
          ],
        },
        RouteTicketResponse: {
          type: 'object',
          properties: {
            ticket: {
              $ref: '#/components/schemas/Ticket',
            },
            routedTo: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                },
                name: {
                  type: 'string',
                  example: 'Maria Santos',
                },
                role: {
                  $ref: '#/components/schemas/UserRole',
                },
              },
            },
            reason: {
              type: 'string',
              description: 'Razão do roteamento',
              example:
                'Prioridade URGENT requer agente especializado; Roteado para Administrador/Supervisor',
            },
          },
        },
        AutoAssignTicketsResponse: {
          type: 'object',
          required: [
            'ticketsProcessed',
            'ticketsAssigned',
            'failedAssignments',
          ],
          properties: {
            ticketsProcessed: {
              type: 'integer',
              description: 'Chamados não atribuídos analisados',
              example: 5,
            },
            ticketsAssigned: {
              type: 'integer',
              description: 'Chamados atribuídos com sucesso',
              example: 4,
            },
            failedAssignments: {
              type: 'integer',
              description: 'Falhas na atribuição',
              example: 1,
            },
          },
        },
        AutomationTrigger: {
          type: 'string',
          enum: [
            'TICKET_CREATED',
            'TICKET_UPDATED',
            'STATUS_CHANGED',
            'SLA_WARNING',
            'SLA_BREACHED',
          ],
        },
        AutomationCondition: {
          type: 'object',
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              enum: [
                'priority_equals',
                'status_equals',
                'category_equals',
                'assigned_to_exists',
                'ticket_age_greater_than',
              ],
            },
            value: {
              description: 'Valor da condição conforme o tipo',
            },
          },
        },
        AutomationAction: {
          type: 'object',
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              enum: [
                'assign_agent',
                'assign_team',
                'change_priority',
                'send_notification',
                'close_ticket',
              ],
            },
            agentId: { type: 'string', format: 'uuid' },
            team: { $ref: '#/components/schemas/UserRole' },
            priority: { $ref: '#/components/schemas/TicketPriority' },
            title: { type: 'string' },
            message: { type: 'string' },
            recipientId: { type: 'string', format: 'uuid' },
          },
        },
        AutomationRule: {
          type: 'object',
          required: [
            'id',
            'tenantId',
            'name',
            'active',
            'trigger',
            'conditions',
            'actions',
            'createdAt',
            'updatedAt',
          ],
          properties: {
            id: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid' },
            name: {
              type: 'string',
              example: 'Atribuir urgente automaticamente',
            },
            description: { type: 'string', nullable: true },
            active: { type: 'boolean', example: true },
            trigger: { $ref: '#/components/schemas/AutomationTrigger' },
            conditions: {
              type: 'array',
              items: { $ref: '#/components/schemas/AutomationCondition' },
            },
            actions: {
              type: 'array',
              items: { $ref: '#/components/schemas/AutomationAction' },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateAutomationRuleInput: {
          type: 'object',
          required: ['name', 'trigger', 'actions'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 120 },
            description: { type: 'string', maxLength: 500 },
            active: { type: 'boolean', default: true },
            trigger: { $ref: '#/components/schemas/AutomationTrigger' },
            conditions: {
              type: 'array',
              items: { $ref: '#/components/schemas/AutomationCondition' },
              default: [],
            },
            actions: {
              type: 'array',
              minItems: 1,
              items: { $ref: '#/components/schemas/AutomationAction' },
            },
          },
        },
        UpdateAutomationRuleInput: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 120 },
            description: { type: 'string', maxLength: 500 },
            active: { type: 'boolean' },
            trigger: { $ref: '#/components/schemas/AutomationTrigger' },
            conditions: {
              type: 'array',
              items: { $ref: '#/components/schemas/AutomationCondition' },
            },
            actions: {
              type: 'array',
              minItems: 1,
              items: { $ref: '#/components/schemas/AutomationAction' },
            },
          },
        },
        HealthStatusResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            service: { type: 'string', example: 'supportflow-backend' },
            environment: { type: 'string', example: 'development' },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2026-06-23T12:00:00.000Z',
            },
          },
        },
        HealthReadyResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ready' },
            service: { type: 'string', example: 'supportflow-backend' },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2026-06-23T12:00:00.000Z',
            },
            checks: {
              type: 'object',
              properties: {
                database: {
                  type: 'string',
                  enum: ['up', 'down'],
                  example: 'up',
                },
              },
            },
          },
        },
        ObservabilityHealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'degraded'], example: 'ok' },
            service: { type: 'string', example: 'supportflow-backend' },
            environment: { type: 'string', example: 'development' },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2026-06-23T12:00:00.000Z',
            },
            openTelemetry: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean', example: false },
                serviceName: { type: 'string', example: 'supportflow-backend' },
                otlpEndpoint: {
                  type: 'string',
                  nullable: true,
                  example: null,
                },
              },
            },
            metrics: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean', example: true },
              },
            },
            checks: {
              type: 'object',
              properties: {
                database: {
                  type: 'string',
                  enum: ['up', 'down'],
                  example: 'up',
                },
                redis: {
                  type: 'string',
                  enum: ['up', 'down', 'skipped'],
                  example: 'skipped',
                },
              },
            },
            http: {
              type: 'object',
              properties: {
                totalRequests: { type: 'integer', example: 0 },
                averageDurationMs: { type: 'number', example: 0 },
                errorRate: { type: 'number', example: 0 },
              },
            },
            jobs: {
              type: 'object',
              properties: {
                overview: { type: 'object' },
                processing: {
                  type: 'object',
                  properties: {
                    processedTotal: { type: 'integer', example: 0 },
                    averageProcessingMs: { type: 'number', example: 0 },
                  },
                },
              },
            },
          },
        },
        TokenPairResponse: {
          type: 'object',
          required: ['accessToken', 'refreshToken'],
          properties: {
            accessToken: {
              type: 'string',
              description:
                'JWT de acesso — usar no header Authorization: Bearer',
            },
            refreshToken: {
              type: 'string',
              description: 'JWT de refresh para renovação de sessão',
            },
          },
        },
        AuthUserResponse: {
          type: 'object',
          required: [
            'id',
            'name',
            'email',
            'role',
            'tenantId',
            'createdAt',
            'updatedAt',
          ],
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { $ref: '#/components/schemas/UserRole' },
            tenantId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description:
          'Login, refresh de token, logout e usuário autenticado (JWT Bearer).',
      },
      {
        name: 'Users',
        description: 'Gerenciamento de usuários da plataforma.',
      },
      {
        name: 'Customers',
        description:
          'Consulta de clientes — entidades internas referenciadas nos chamados.',
      },
      {
        name: 'Tickets',
        description:
          'Chamados — criação, listagem, status, atribuição, filas, SLA, categorias, histórico, satisfação e métricas de atendimento.',
      },
      {
        name: 'Comments',
        description:
          'Comentários internos de chamados — visíveis apenas para a equipe de atendimento.',
      },
      {
        name: 'Attachments',
        description:
          'Anexos de chamados — upload multipart, listagem e remoção de arquivos.',
      },
      {
        name: 'Knowledge Base',
        description: 'Base de conhecimento — artigos de autoatendimento.',
      },
      {
        name: 'Analytics',
        description: 'Indicadores analíticos de atendimento, SLA e CSAT.',
      },
      {
        name: 'Reports',
        description: 'Exportação de relatórios operacionais em CSV.',
      },
      {
        name: 'Notifications',
        description:
          'Notificações sobre chamados, SLA e eventos do atendimento.',
      },
      {
        name: 'Webhooks',
        description:
          'Webhooks de integração — assinatura de eventos e entregas.',
      },
      {
        name: 'API Keys',
        description:
          'API Keys para integrações externas (autenticação via `x-api-key`).',
      },
      {
        name: 'Automation',
        description:
          'Regras de automação de workflow — triggers, condições e ações.',
      },
      {
        name: 'Feature Flags',
        description: 'Feature flags por tenant.',
      },
      {
        name: 'SLA Policies',
        description:
          'Políticas de SLA administráveis — tempos de resposta e resolução por prioridade e categoria.',
      },
      {
        name: 'Administration',
        description:
          'Operações administrativas — outbox transacional, auditoria imutável e monitoramento de filas de jobs.',
      },
      {
        name: 'RBAC Admin',
        description: 'Gerenciamento de papéis e permissões da plataforma.',
      },
      {
        name: 'Health',
        description: 'Health checks, observabilidade e métricas Prometheus.',
      },
    ],
  },
  apis: swaggerApiGlobs,
};

export const swaggerSpec = swaggerJsdoc(options);
