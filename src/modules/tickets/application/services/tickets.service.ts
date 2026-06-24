import { AppError } from '../../../../shared/errors/app-error.js';
import {
  assertCanAccessTicketQueues,
  assertCanAssignTicket,
  assertCanCreateTicket,
  assertCanManageTicket,
  assertTicketAccess,
  canAccessInternalComments,
} from '../../../../shared/security/rbac.js';
import { resolveTenantId } from '../../../../shared/tenant/get-request-tenant-id.js';
import type { AuthenticatedUser } from '../../../../shared/types/authenticated-user.js';
import { UserRole } from '../../../../shared/types/user-role.js';
import type { AgentMetricsResult } from '../../domain/agent-metrics.js';
import type { Ticket } from '../../domain/ticket.entity.js';
import type {
  TicketAttachment,
  TicketAttachmentWithUploader,
} from '../../domain/ticket-attachment.js';
import type {
  TicketComment,
  TicketCommentWithAuthor,
} from '../../domain/ticket-comment.js';
import type { TicketPriority } from '../../domain/ticket-enums.js';
import { TicketStatus } from '../../domain/ticket-enums.js';
import {
  TicketsRepository,
  ticketsRepository as defaultTicketsRepository,
} from '../../infrastructure/repositories/tickets.repository.js';
import {
  AssignTicketUseCase,
  assignTicketUseCase,
  CreateTicketCommentUseCase,
  createTicketCommentUseCase,
  DeleteTicketAttachmentUseCase,
  deleteTicketAttachmentUseCase,
  FindTicketByIdUseCase,
  findTicketByIdUseCase,
  GetAgentMetricsUseCase,
  getAgentMetricsUseCase,
  GetTicketMetricsUseCase,
  getTicketMetricsUseCase,
  GetTicketStatusTransitionsUseCase,
  getTicketStatusTransitionsUseCase,
  GetTicketSummaryUseCase,
  getTicketSummaryUseCase,
  ListTicketAttachmentsUseCase,
  listTicketAttachmentsUseCase,
  ListTicketCommentsUseCase,
  listTicketCommentsUseCase,
  ListTicketHistoryUseCase,
  listTicketHistoryUseCase,
  ListTicketsByTenantUseCase,
  listTicketsByTenantUseCase,
  OpenTicketUseCase,
  openTicketUseCase,
  type PaginatedTicketList,
  type TicketHistoryResult,
  type TicketMetrics,
  type TicketStatusTransitionsResult,
  type TicketSummary,
  UpdateTicketStatusUseCase,
  updateTicketStatusUseCase,
  UploadTicketAttachmentUseCase,
  uploadTicketAttachmentUseCase,
} from '../index.js';
import type {
  ListTicketsQueryInput,
  QueueTicketsQueryInput,
  TicketMetricsQueryInput,
  TicketSummaryQueryInput,
} from '../inputs/ticket-use-case.inputs.js';

export type CreateTicketServiceInput = {
  title: string;
  description: string;
  customerId: string;
  priority?: TicketPriority;
  assignedToId?: string;
  categoryId?: string;
};

export class TicketsService {
  constructor(
    private readonly openTicket: OpenTicketUseCase = openTicketUseCase,
    private readonly findTicket: FindTicketByIdUseCase = findTicketByIdUseCase,
    private readonly listTickets: ListTicketsByTenantUseCase = listTicketsByTenantUseCase,
    private readonly updateTicketStatus: UpdateTicketStatusUseCase = updateTicketStatusUseCase,
    private readonly assignTicket: AssignTicketUseCase = assignTicketUseCase,
    private readonly getTicketStatusTransitions: GetTicketStatusTransitionsUseCase = getTicketStatusTransitionsUseCase,
    private readonly listTicketHistory: ListTicketHistoryUseCase = listTicketHistoryUseCase,
    private readonly getTicketSummary: GetTicketSummaryUseCase = getTicketSummaryUseCase,
    private readonly getTicketMetrics: GetTicketMetricsUseCase = getTicketMetricsUseCase,
    private readonly getAgentMetrics: GetAgentMetricsUseCase = getAgentMetricsUseCase,
    private readonly createComment: CreateTicketCommentUseCase = createTicketCommentUseCase,
    private readonly listComments: ListTicketCommentsUseCase = listTicketCommentsUseCase,
    private readonly uploadAttachmentUseCase: UploadTicketAttachmentUseCase = uploadTicketAttachmentUseCase,
    private readonly listAttachmentsUseCase: ListTicketAttachmentsUseCase = listTicketAttachmentsUseCase,
    private readonly deleteAttachmentUseCase: DeleteTicketAttachmentUseCase = deleteTicketAttachmentUseCase,
    private readonly ticketsRepository: TicketsRepository = defaultTicketsRepository,
  ) {}

  async create(
    data: CreateTicketServiceInput,
    authUser: AuthenticatedUser,
  ): Promise<Ticket> {
    assertCanCreateTicket(authUser, data);

    const tenantId = resolveTenantId(authUser);

    return this.openTicket.execute({
      tenantId,
      title: data.title,
      description: data.description,
      customerId: data.customerId,
      priority: data.priority,
      categoryId: data.categoryId,
      assignedToId: data.assignedToId,
      changedById: authUser.id,
    });
  }

  async findById(id: string, authUser: AuthenticatedUser): Promise<Ticket> {
    const tenantId = resolveTenantId(authUser);
    const ticket = await this.findTicket.execute({
      tenantId,
      ticketId: id,
    });

    assertTicketAccess(ticket, authUser);

    return ticket;
  }

  async getStatusTransitions(
    id: string,
    authUser: AuthenticatedUser,
  ): Promise<TicketStatusTransitionsResult> {
    const ticket = await this.findById(id, authUser);
    return this.getTicketStatusTransitions.forStatus(ticket.status);
  }

  async getHistory(
    id: string,
    authUser: AuthenticatedUser,
  ): Promise<TicketHistoryResult> {
    const ticket = await this.findById(id, authUser);
    return this.listTicketHistory.forTicket(
      ticket.id,
      ticket.tenantId,
      authUser,
    );
  }

  async list(
    authUser: AuthenticatedUser,
    query: ListTicketsQueryInput = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
  ): Promise<PaginatedTicketList> {
    const tenantId = resolveTenantId(authUser);

    if (
      authUser.role === UserRole.CUSTOMER &&
      query.customerId &&
      query.customerId !== authUser.id
    ) {
      throw new AppError('Forbidden', 403);
    }

    const customerId =
      authUser.role === UserRole.CUSTOMER ? authUser.id : query.customerId;
    const status =
      authUser.role === UserRole.OMBUDSMAN && !query.status
        ? TicketStatus.ESCALATED
        : query.status;

    return this.listTickets.execute({
      tenantId,
      status,
      priority: query.priority,
      categoryId: query.categoryId,
      customerId,
      assignedToId: query.assignedToId,
      unassigned: query.unassigned,
      team: query.team,
      overdue: query.overdue,
      search: query.search,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  async listMyQueue(
    authUser: AuthenticatedUser,
    query: QueueTicketsQueryInput = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
  ): Promise<PaginatedTicketList> {
    assertCanAccessTicketQueues(authUser);

    return this.list(authUser, {
      ...query,
      assignedToId: authUser.id,
    });
  }

  async listUnassigned(
    authUser: AuthenticatedUser,
    query: QueueTicketsQueryInput = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
  ): Promise<PaginatedTicketList> {
    assertCanAccessTicketQueues(authUser);

    if (
      authUser.role !== UserRole.ADMIN &&
      authUser.role !== UserRole.SUPERVISOR
    ) {
      throw new AppError('Forbidden', 403);
    }

    return this.list(authUser, {
      ...query,
      unassigned: true,
    });
  }

  async agentMetrics(authUser: AuthenticatedUser): Promise<AgentMetricsResult> {
    const tenantId = resolveTenantId(authUser);

    if (
      authUser.role !== UserRole.ADMIN &&
      authUser.role !== UserRole.SUPERVISOR
    ) {
      throw new AppError('Forbidden', 403);
    }

    return this.getAgentMetrics.execute(tenantId);
  }

  async summary(
    authUser: AuthenticatedUser,
    query: TicketSummaryQueryInput = {},
  ): Promise<TicketSummary> {
    const tenantId = resolveTenantId(authUser);

    if (
      authUser.role === UserRole.CUSTOMER &&
      query.customerId &&
      query.customerId !== authUser.id
    ) {
      throw new AppError('Forbidden', 403);
    }

    const customerId =
      authUser.role === UserRole.CUSTOMER ? authUser.id : query.customerId;
    const status =
      authUser.role === UserRole.OMBUDSMAN && !query.status
        ? TicketStatus.ESCALATED
        : query.status;

    return this.getTicketSummary.execute({
      tenantId,
      status,
      priority: query.priority,
      categoryId: query.categoryId,
      customerId,
      assignedToId: query.assignedToId,
      unassigned: query.unassigned,
      overdue: query.overdue,
      search: query.search,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
    });
  }

  async metrics(
    authUser: AuthenticatedUser,
    query: TicketMetricsQueryInput = {},
  ): Promise<TicketMetrics> {
    const tenantId = resolveTenantId(authUser);

    return this.getTicketMetrics.execute({
      tenantId,
      categoryId: query.categoryId,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
    });
  }

  async listByCustomerId(
    customerId: string,
    authUser: AuthenticatedUser,
  ): Promise<Ticket[]> {
    this.assertCanListCustomerTickets(customerId, authUser);
    return this.ticketsRepository.listByCustomerId(customerId);
  }

  async listByAssignedAgentId(
    assignedToId: string,
    authUser: AuthenticatedUser,
  ): Promise<Ticket[]> {
    this.assertCanListAgentTickets(assignedToId, authUser);
    return this.ticketsRepository.listByAssignedToId(assignedToId);
  }

  async updateStatus(
    id: string,
    status: TicketStatus,
    authUser: AuthenticatedUser,
  ): Promise<Ticket> {
    const ticket = await this.findById(id, authUser);
    assertCanManageTicket(authUser, ticket);

    const tenantId = resolveTenantId(authUser);

    return this.updateTicketStatus.execute({
      tenantId,
      ticketId: id,
      status,
      changedById: authUser.id,
    });
  }

  async assignAgent(
    id: string,
    assignedToId: string,
    authUser: AuthenticatedUser,
  ): Promise<Ticket> {
    assertCanAssignTicket(authUser);
    await this.findById(id, authUser);

    const tenantId = resolveTenantId(authUser);

    return this.assignTicket.execute({
      tenantId,
      ticketId: id,
      assignedToId,
      changedById: authUser.id,
    });
  }

  async addComment(
    ticketId: string,
    content: string,
    authUser: AuthenticatedUser,
  ): Promise<TicketComment> {
    if (!canAccessInternalComments(authUser.role)) {
      throw new AppError('Forbidden', 403);
    }

    const tenantId = resolveTenantId(authUser);

    return this.createComment.execute({
      ticketId,
      tenantId,
      authorId: authUser.id,
      content,
    });
  }

  async getComments(
    ticketId: string,
    authUser: AuthenticatedUser,
  ): Promise<TicketCommentWithAuthor[]> {
    if (!canAccessInternalComments(authUser.role)) {
      throw new AppError('Forbidden', 403);
    }

    const tenantId = resolveTenantId(authUser);

    return this.listComments.execute({
      ticketId,
      tenantId,
    });
  }

  async uploadAttachment(
    ticketId: string,
    file: Express.Multer.File,
    authUser: AuthenticatedUser,
  ): Promise<TicketAttachment> {
    const ticket = await this.findById(ticketId, authUser);
    assertCanManageTicket(authUser, ticket);

    const tenantId = resolveTenantId(authUser);

    return this.uploadAttachmentUseCase.execute({
      ticketId,
      tenantId,
      uploadedById: authUser.id,
      file,
    });
  }

  async getAttachments(
    ticketId: string,
    authUser: AuthenticatedUser,
  ): Promise<TicketAttachmentWithUploader[]> {
    const tenantId = resolveTenantId(authUser);

    const ticket = await this.findById(ticketId, authUser);

    return this.listAttachmentsUseCase.execute({
      ticketId: ticket.id,
      tenantId,
    });
  }

  async removeAttachment(
    ticketId: string,
    attachmentId: string,
    authUser: AuthenticatedUser,
  ): Promise<void> {
    const ticket = await this.findById(ticketId, authUser);
    assertCanManageTicket(authUser, ticket);

    const tenantId = resolveTenantId(authUser);

    return this.deleteAttachmentUseCase.execute({
      attachmentId,
      ticketId,
      tenantId,
      deletedById: authUser.id,
    });
  }

  private assertCanListCustomerTickets(
    customerId: string,
    authUser: AuthenticatedUser,
  ): void {
    if (authUser.role === UserRole.ADMIN) {
      return;
    }

    if (authUser.role === UserRole.CUSTOMER && customerId === authUser.id) {
      return;
    }

    throw new AppError('Forbidden', 403);
  }

  private assertCanListAgentTickets(
    agentId: string,
    authUser: AuthenticatedUser,
  ): void {
    if (
      authUser.role === UserRole.ADMIN ||
      authUser.role === UserRole.SUPERVISOR
    ) {
      return;
    }

    if (authUser.role === UserRole.AGENT && agentId === authUser.id) {
      return;
    }

    throw new AppError('Forbidden', 403);
  }
}

export const ticketsService = new TicketsService();
