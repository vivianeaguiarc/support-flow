import {
  CommentVisibility,
  NotificationType,
  type PrismaClient,
  TicketHistoryEvent,
  TicketPriority,
  TicketStatus,
} from '@prisma/client';

import { hashPassword } from '../../src/shared/security/password-hash.js';
import { UserRole } from '../../src/shared/types/user-role.js';
import {
  DEMO_ADMIN_USER_ID,
  DEMO_AGENT_USER_ID,
  DEMO_CATEGORY_OUVIDORIA_ID,
  DEMO_CATEGORY_SAC_ID,
  DEMO_CATEGORY_SUPORTE_ID,
  DEMO_CUSTOMER_USER_ID,
  resolveSeedConfig,
  type SeedConfig,
} from './config.js';

export type DemoCategorySeed = {
  id: string;
  name: string;
  description: string;
  slaHours: number;
};

export const DEMO_CATEGORIES: DemoCategorySeed[] = [
  {
    id: DEMO_CATEGORY_SAC_ID,
    name: 'SAC Geral',
    description: 'Atendimento geral ao cliente',
    slaHours: 72,
  },
  {
    id: DEMO_CATEGORY_OUVIDORIA_ID,
    name: 'Ouvidoria',
    description: 'Manifestações e reclamações institucionais',
    slaHours: 48,
  },
  {
    id: DEMO_CATEGORY_SUPORTE_ID,
    name: 'Suporte Técnico',
    description: 'Incidentes técnicos e suporte operacional',
    slaHours: 24,
  },
];

const DEMO_TICKET_OPEN_ID = '00000000-0000-4000-8000-000000000020';
const DEMO_TICKET_IN_PROGRESS_ID = '00000000-0000-4000-8000-000000000021';
const DEMO_TICKET_WAITING_ID = '00000000-0000-4000-8000-000000000022';
const DEMO_TICKET_ESCALATED_ID = '00000000-0000-4000-8000-000000000023';
const DEMO_TICKET_RESOLVED_ID = '00000000-0000-4000-8000-000000000024';
const DEMO_TICKET_CLOSED_ID = '00000000-0000-4000-8000-000000000025';

const DEMO_COMMENT_1_ID = '00000000-0000-4000-8000-000000000030';
const DEMO_COMMENT_2_ID = '00000000-0000-4000-8000-000000000031';
const DEMO_COMMENT_3_ID = '00000000-0000-4000-8000-000000000032';

const DEMO_NOTIFICATION_1_ID = '00000000-0000-4000-8000-000000000040';
const DEMO_NOTIFICATION_2_ID = '00000000-0000-4000-8000-000000000041';

type DemoTicketSeed = {
  id: string;
  protocol: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  categoryName: string;
  assignedToId: string | null;
  slaDueAt: Date | null;
  closedAt: Date | null;
};

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function buildDemoTickets(now = new Date()): DemoTicketSeed[] {
  return [
    {
      id: DEMO_TICKET_OPEN_ID,
      protocol: 'DEMO-SF-OPEN-001',
      title: 'Dúvida sobre segunda via da fatura',
      description:
        'Cliente solicita orientação para emitir a segunda via da fatura de março.',
      status: TicketStatus.OPEN,
      priority: TicketPriority.MEDIUM,
      categoryName: 'SAC Geral',
      assignedToId: null,
      slaDueAt: hoursFromNow(48),
      closedAt: null,
    },
    {
      id: DEMO_TICKET_IN_PROGRESS_ID,
      protocol: 'DEMO-SF-PROG-002',
      title: 'Aplicativo não abre após atualização',
      description:
        'Usuário relata erro ao abrir o app mobile após a última atualização.',
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.HIGH,
      categoryName: 'Suporte Técnico',
      assignedToId: DEMO_AGENT_USER_ID,
      slaDueAt: hoursFromNow(20),
      closedAt: null,
    },
    {
      id: DEMO_TICKET_WAITING_ID,
      protocol: 'DEMO-SF-WAIT-003',
      title: 'Aguardando comprovante de pagamento',
      description:
        'Atendimento pausado até o cliente enviar comprovante de pagamento.',
      status: TicketStatus.WAITING_CUSTOMER,
      priority: TicketPriority.MEDIUM,
      categoryName: 'SAC Geral',
      assignedToId: DEMO_AGENT_USER_ID,
      slaDueAt: hoursFromNow(12),
      closedAt: null,
    },
    {
      id: DEMO_TICKET_ESCALATED_ID,
      protocol: 'DEMO-SF-ESC-004',
      title: 'Reclamação formal na ouvidoria',
      description:
        'Manifestação sobre atraso no atendimento com pedido de retorno urgente.',
      status: TicketStatus.ESCALATED,
      priority: TicketPriority.URGENT,
      categoryName: 'Ouvidoria',
      assignedToId: DEMO_ADMIN_USER_ID,
      slaDueAt: hoursFromNow(-4),
      closedAt: null,
    },
    {
      id: DEMO_TICKET_RESOLVED_ID,
      protocol: 'DEMO-SF-RES-005',
      title: 'Troca de plano concluída',
      description: 'Solicitação de upgrade de plano processada com sucesso.',
      status: TicketStatus.RESOLVED,
      priority: TicketPriority.LOW,
      categoryName: 'SAC Geral',
      assignedToId: DEMO_AGENT_USER_ID,
      slaDueAt: hoursFromNow(-24),
      closedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: DEMO_TICKET_CLOSED_ID,
      protocol: 'DEMO-SF-CLO-006',
      title: 'Cancelamento de assinatura',
      description: 'Cliente confirmou cancelamento e encerramento do contrato.',
      status: TicketStatus.CLOSED,
      priority: TicketPriority.MEDIUM,
      categoryName: 'SAC Geral',
      assignedToId: DEMO_AGENT_USER_ID,
      slaDueAt: hoursFromNow(-72),
      closedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
    },
  ];
}

export type DemoSeedResult = {
  tenantId: string;
  tenantSlug: string;
  adminEmail: string;
  agentEmail: string;
  customerUserEmail: string;
  customerId: string;
  customerEmail: string;
  categoryNames: string[];
  ticketProtocols: string[];
  commentCount: number;
  notificationCount: number;
};

export async function seedDemoData(
  prisma: PrismaClient,
  config: SeedConfig = resolveSeedConfig(),
): Promise<DemoSeedResult> {
  const [adminPasswordHash, agentPasswordHash, customerUserPasswordHash] =
    await Promise.all([
      hashPassword(config.adminPassword),
      hashPassword(config.agentPassword),
      hashPassword(config.customerUserPassword),
    ]);

  await prisma.tenant.upsert({
    where: { id: config.tenantId },
    create: {
      id: config.tenantId,
      name: config.tenantName,
      slug: config.tenantSlug,
      defaultSlaHours: config.defaultSlaHours,
      isActive: true,
    },
    update: {
      name: config.tenantName,
      slug: config.tenantSlug,
      defaultSlaHours: config.defaultSlaHours,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: config.tenantId,
        email: config.adminEmail,
      },
    },
    create: {
      id: DEMO_ADMIN_USER_ID,
      tenantId: config.tenantId,
      name: config.adminName,
      email: config.adminEmail,
      password: adminPasswordHash,
      role: UserRole.ADMIN,
    },
    update: {
      name: config.adminName,
      password: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: config.tenantId,
        email: config.agentEmail,
      },
    },
    create: {
      id: DEMO_AGENT_USER_ID,
      tenantId: config.tenantId,
      name: config.agentName,
      email: config.agentEmail,
      password: agentPasswordHash,
      role: UserRole.AGENT,
    },
    update: {
      name: config.agentName,
      password: agentPasswordHash,
      role: UserRole.AGENT,
    },
  });

  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: config.tenantId,
        email: config.customerUserEmail,
      },
    },
    create: {
      id: DEMO_CUSTOMER_USER_ID,
      tenantId: config.tenantId,
      name: config.customerUserName,
      email: config.customerUserEmail,
      password: customerUserPasswordHash,
      role: UserRole.CUSTOMER,
    },
    update: {
      name: config.customerUserName,
      password: customerUserPasswordHash,
      role: UserRole.CUSTOMER,
    },
  });

  await prisma.customer.upsert({
    where: {
      tenantId_email: {
        tenantId: config.tenantId,
        email: config.customerEmail,
      },
    },
    create: {
      id: config.customerId,
      tenantId: config.tenantId,
      name: config.customerName,
      email: config.customerEmail,
      phone: '+5511999990000',
      document: '12345678901',
      isActive: true,
    },
    update: {
      name: config.customerName,
      phone: '+5511999990000',
      document: '12345678901',
      isActive: true,
    },
  });

  for (const category of DEMO_CATEGORIES) {
    await prisma.ticketCategory.upsert({
      where: {
        tenantId_name: {
          tenantId: config.tenantId,
          name: category.name,
        },
      },
      create: {
        id: category.id,
        tenantId: config.tenantId,
        name: category.name,
        description: category.description,
        slaHours: category.slaHours,
        isActive: true,
      },
      update: {
        description: category.description,
        slaHours: category.slaHours,
        isActive: true,
      },
    });
  }

  const categories = await prisma.ticketCategory.findMany({
    where: { tenantId: config.tenantId },
    select: { id: true, name: true },
  });
  const categoryIdByName = new Map(
    categories.map((category) => [category.name, category.id]),
  );

  const demoTickets = buildDemoTickets();

  for (const ticket of demoTickets) {
    const categoryId = categoryIdByName.get(ticket.categoryName);
    if (!categoryId) {
      throw new Error(`Demo category not found: ${ticket.categoryName}`);
    }

    await prisma.ticket.upsert({
      where: {
        tenantId_protocol: {
          tenantId: config.tenantId,
          protocol: ticket.protocol,
        },
      },
      create: {
        id: ticket.id,
        tenantId: config.tenantId,
        protocol: ticket.protocol,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        categoryId,
        customerId: config.customerId,
        assignedToId: ticket.assignedToId,
        slaDueAt: ticket.slaDueAt,
        closedAt: ticket.closedAt,
      },
      update: {
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        categoryId,
        customerId: config.customerId,
        assignedToId: ticket.assignedToId,
        slaDueAt: ticket.slaDueAt,
        closedAt: ticket.closedAt,
      },
    });
  }

  const demoComments = [
    {
      id: DEMO_COMMENT_1_ID,
      ticketId: DEMO_TICKET_IN_PROGRESS_ID,
      authorId: DEMO_AGENT_USER_ID,
      content:
        'Reproduzi o erro no ambiente de homologação. Aguardando correção do time técnico.',
    },
    {
      id: DEMO_COMMENT_2_ID,
      ticketId: DEMO_TICKET_WAITING_ID,
      authorId: DEMO_AGENT_USER_ID,
      content:
        'Solicitei ao cliente o comprovante via e-mail. Chamado pausado até retorno.',
    },
    {
      id: DEMO_COMMENT_3_ID,
      ticketId: DEMO_TICKET_ESCALATED_ID,
      authorId: DEMO_ADMIN_USER_ID,
      content:
        'Caso escalado para prioridade máxima. Supervisor notificado para acompanhamento.',
    },
  ] as const;

  for (const comment of demoComments) {
    await prisma.ticketComment.upsert({
      where: { id: comment.id },
      create: {
        id: comment.id,
        tenantId: config.tenantId,
        ticketId: comment.ticketId,
        authorId: comment.authorId,
        content: comment.content,
        visibility: CommentVisibility.INTERNAL,
      },
      update: {
        content: comment.content,
        authorId: comment.authorId,
      },
    });
  }

  const demoHistory = [
    {
      id: '00000000-0000-4000-8000-000000000050',
      ticketId: DEMO_TICKET_OPEN_ID,
      event: TicketHistoryEvent.CREATED,
      changedById: DEMO_ADMIN_USER_ID,
    },
    {
      id: '00000000-0000-4000-8000-000000000051',
      ticketId: DEMO_TICKET_IN_PROGRESS_ID,
      event: TicketHistoryEvent.ASSIGNED,
      field: 'assignedToId',
      oldValue: null,
      newValue: DEMO_AGENT_USER_ID,
      changedById: DEMO_ADMIN_USER_ID,
    },
    {
      id: '00000000-0000-4000-8000-000000000052',
      ticketId: DEMO_TICKET_ESCALATED_ID,
      event: TicketHistoryEvent.TICKET_ESCALATED,
      changedById: DEMO_ADMIN_USER_ID,
    },
    {
      id: '00000000-0000-4000-8000-000000000053',
      ticketId: DEMO_TICKET_IN_PROGRESS_ID,
      event: TicketHistoryEvent.COMMENT_ADDED,
      changedById: DEMO_AGENT_USER_ID,
    },
  ] as const;

  for (const history of demoHistory) {
    await prisma.ticketHistory.upsert({
      where: { id: history.id },
      create: {
        id: history.id,
        tenantId: config.tenantId,
        ticketId: history.ticketId,
        event: history.event,
        field: 'field' in history ? history.field : null,
        oldValue: 'oldValue' in history ? history.oldValue : null,
        newValue: 'newValue' in history ? history.newValue : null,
        changedById: history.changedById,
      },
      update: {
        event: history.event,
        field: 'field' in history ? history.field : null,
        oldValue: 'oldValue' in history ? history.oldValue : null,
        newValue: 'newValue' in history ? history.newValue : null,
        changedById: history.changedById,
      },
    });
  }

  const demoNotifications = [
    {
      id: DEMO_NOTIFICATION_1_ID,
      recipientId: DEMO_AGENT_USER_ID,
      ticketId: DEMO_TICKET_IN_PROGRESS_ID,
      type: NotificationType.TICKET_ASSIGNED,
      title: 'Chamado atribuído',
      message: 'O chamado DEMO-SF-PROG-002 foi atribuído a você.',
      readAt: null,
    },
    {
      id: DEMO_NOTIFICATION_2_ID,
      recipientId: DEMO_ADMIN_USER_ID,
      ticketId: DEMO_TICKET_ESCALATED_ID,
      type: NotificationType.SLA_EXPIRED,
      title: 'SLA vencido',
      message: 'O chamado DEMO-SF-ESC-004 ultrapassou o prazo de SLA.',
      readAt: null,
    },
  ] as const;

  for (const notification of demoNotifications) {
    await prisma.notification.upsert({
      where: { id: notification.id },
      create: {
        id: notification.id,
        tenantId: config.tenantId,
        recipientId: notification.recipientId,
        ticketId: notification.ticketId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        readAt: notification.readAt,
      },
      update: {
        recipientId: notification.recipientId,
        ticketId: notification.ticketId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        readAt: notification.readAt,
      },
    });
  }

  return {
    tenantId: config.tenantId,
    tenantSlug: config.tenantSlug,
    adminEmail: config.adminEmail,
    agentEmail: config.agentEmail,
    customerUserEmail: config.customerUserEmail,
    customerId: config.customerId,
    customerEmail: config.customerEmail,
    categoryNames: DEMO_CATEGORIES.map((category) => category.name),
    ticketProtocols: demoTickets.map((ticket) => ticket.protocol),
    commentCount: demoComments.length,
    notificationCount: demoNotifications.length,
  };
}
