import type { Options } from 'swagger-jsdoc';
import swaggerJsdoc from 'swagger-jsdoc';

import { env } from './env.js';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SupportFlow API',
      version: '1.0.0',
      description:
        'API completa para gerenciamento de atendimento ao cliente, SAC e Ouvidoria',
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
        description: 'Development server',
      },
      {
        url: 'https://api.supportflow.com/api/v1',
        description: 'Production server',
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
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Resource not found',
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
              example: 404,
            },
          },
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
          description: 'Prioridade do chamado',
          example: 'MEDIUM',
        },
        UserRole: {
          type: 'string',
          enum: ['ADMIN', 'AGENT', 'CUSTOMER'],
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
          description: 'Tipo de notificação',
          example: 'TICKET_ASSIGNED',
        },
        TicketHistoryEvent: {
          type: 'string',
          enum: [
            'CREATED',
            'ASSIGNED',
            'STATUS_CHANGED',
            'PRIORITY_CHANGED',
            'CATEGORY_CHANGED',
            'COMMENT_ADDED',
            'ATTACHMENT_ADDED',
            'ATTACHMENT_REMOVED',
            'TICKET_ESCALATED',
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
          required: ['assignedToId'],
          properties: {
            assignedToId: {
              type: 'string',
              format: 'uuid',
              description: 'ID do agente que será responsável',
              example: '550e8400-e29b-41d4-a716-446655440001',
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
              type: 'string',
              enum: ['INTERNAL'],
              description: 'Visibilidade do comentário',
              example: 'INTERNAL',
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
        CreateCommentRequest: {
          type: 'object',
          required: ['content'],
          properties: {
            content: {
              type: 'string',
              minLength: 1,
              description: 'Conteúdo do comentário',
              example: 'Entramos em contato com o cliente por telefone',
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
              type: 'integer',
              description: 'Tamanho do arquivo em bytes',
              example: 245678,
            },
            storagePath: {
              type: 'string',
              description: 'Caminho de armazenamento do arquivo',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
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
            createdAt: {
              type: 'string',
              format: 'date-time',
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
            averageResolutionTime: {
              type: 'number',
              nullable: true,
              description: 'Tempo médio de resolução em horas',
              example: 24.5,
            },
            resolvedTicketsCount: {
              type: 'integer',
              description: 'Número de chamados resolvidos',
              example: 42,
            },
            overdueTicketsCount: {
              type: 'integer',
              description: 'Número de chamados vencidos',
              example: 8,
            },
            slaComplianceRate: {
              type: 'number',
              description: 'Taxa de cumprimento de SLA (%)',
              example: 85.5,
            },
            byAgent: {
              type: 'array',
              description: 'Performance por agente',
              items: {
                type: 'object',
                properties: {
                  agentId: {
                    type: 'string',
                    format: 'uuid',
                  },
                  agentName: {
                    type: 'string',
                    example: 'João Silva',
                  },
                  resolvedCount: {
                    type: 'integer',
                    example: 15,
                  },
                  averageResolutionTime: {
                    type: 'number',
                    nullable: true,
                    example: 22.3,
                  },
                },
              },
            },
          },
        },
        PaginatedTickets: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Ticket',
              },
            },
            total: {
              type: 'integer',
              description: 'Total de registros',
              example: 150,
            },
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
          },
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
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints de autenticação e autorização',
      },
      {
        name: 'Tickets',
        description: 'Gerenciamento de chamados/tickets',
      },
      {
        name: 'Ticket History',
        description: 'Histórico de alterações dos chamados',
      },
      {
        name: 'Ticket Comments',
        description: 'Comentários internos dos chamados',
      },
      {
        name: 'Ticket Attachments',
        description: 'Anexos dos chamados',
      },
      {
        name: 'Notifications',
        description: 'Notificações do sistema',
      },
      {
        name: 'Users',
        description: 'Gerenciamento de usuários',
      },
      {
        name: 'Health',
        description: 'Health checks da aplicação',
      },
    ],
  },
  apis: [
    './src/modules/**/docs/*.swagger.ts',
    './src/shared/http/docs/*.swagger.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
