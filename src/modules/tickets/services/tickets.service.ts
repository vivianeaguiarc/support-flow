import { DEFAULT_TENANT_ID } from '../../../shared/constants/tenant.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { AuthenticatedUser } from '../../../shared/types/authenticated-user.js';
import { UserRole } from '../../../shared/types/user-role.js';
import {
  AssignTicketUseCase,
  assignTicketUseCase,
  FindTicketByIdUseCase,
  findTicketByIdUseCase,
  GetTicketStatusTransitionsUseCase,
  getTicketStatusTransitionsUseCase,
  GetTicketSummaryUseCase,
  getTicketSummaryUseCase,
  ListTicketHistoryUseCase,
  listTicketHistoryUseCase,
  ListTicketsByTenantUseCase,
  listTicketsByTenantUseCase,
  OpenTicketUseCase,
  openTicketUseCase,
  type PaginatedTicketList,
  type TicketHistoryResult,
  type TicketStatusTransitionsResult,
  type TicketSummary,
  UpdateTicketStatusUseCase,
  updateTicketStatusUseCase,
} from '../application/index.js';
import type { Ticket } from '../domain/ticket.entity.js';
import type { TicketPriority, TicketStatus } from '../domain/ticket-enums.js';
import type { ListTicketsQueryDto } from '../dtos/list-tickets-query.dto.js';
import type { TicketSummaryQueryDto } from '../dtos/ticket-summary-query.dto.js';
import {
  TicketsRepository,
  ticketsRepository as defaultTicketsRepository,
} from '../repositories/tickets.repository.js';

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
    private readonly ticketsRepository: TicketsRepository = defaultTicketsRepository,
  ) {}

  async create(
    data: CreateTicketServiceInput,
    authUser: AuthenticatedUser,
  ): Promise<Ticket> {
    this.assertCanCreateTicket(authUser, data);

    const tenantId = authUser.tenantId ?? DEFAULT_TENANT_ID;

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
    const tenantId = authUser.tenantId ?? DEFAULT_TENANT_ID;
    const ticket = await this.findTicket.execute({
      tenantId,
      ticketId: id,
    });

    this.assertCanAccessTicket(ticket, authUser);

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
    return this.listTicketHistory.forTicket(ticket.id, ticket.tenantId);
  }

  async list(
    authUser: AuthenticatedUser,
    query: ListTicketsQueryDto = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
  ): Promise<PaginatedTicketList> {
    const tenantId = authUser.tenantId ?? DEFAULT_TENANT_ID;

    if (
      authUser.role === UserRole.CUSTOMER &&
      query.customerId &&
      query.customerId !== authUser.id
    ) {
      throw new AppError('Forbidden', 403);
    }

    const customerId =
      authUser.role === UserRole.CUSTOMER ? authUser.id : query.customerId;

    return this.listTickets.execute({
      tenantId,
      status: query.status,
      priority: query.priority,
      categoryId: query.categoryId,
      customerId,
      assignedToId: query.assignedToId,
      unassigned: query.unassigned,
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

  async summary(
    authUser: AuthenticatedUser,
    query: TicketSummaryQueryDto = {},
  ): Promise<TicketSummary> {
    const tenantId = authUser.tenantId ?? DEFAULT_TENANT_ID;

    if (
      authUser.role === UserRole.CUSTOMER &&
      query.customerId &&
      query.customerId !== authUser.id
    ) {
      throw new AppError('Forbidden', 403);
    }

    const customerId =
      authUser.role === UserRole.CUSTOMER ? authUser.id : query.customerId;

    return this.getTicketSummary.execute({
      tenantId,
      status: query.status,
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
    this.assertCanManageTickets(authUser);

    const tenantId = authUser.tenantId ?? DEFAULT_TENANT_ID;

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
    this.assertCanManageTickets(authUser);

    const tenantId = authUser.tenantId ?? DEFAULT_TENANT_ID;

    return this.assignTicket.execute({
      tenantId,
      ticketId: id,
      assignedToId,
      changedById: authUser.id,
    });
  }

  private assertCanCreateTicket(
    authUser: AuthenticatedUser,
    data: CreateTicketServiceInput,
  ): void {
    if (authUser.role === UserRole.ADMIN || authUser.role === UserRole.AGENT) {
      return;
    }

    if (authUser.role === UserRole.CUSTOMER) {
      if (data.customerId !== authUser.id) {
        throw new AppError('Forbidden', 403);
      }

      if (data.assignedToId) {
        throw new AppError('Customers cannot assign agents', 400);
      }

      return;
    }

    throw new AppError('Forbidden', 403);
  }

  private assertCanAccessTicket(
    ticket: Ticket,
    authUser: AuthenticatedUser,
  ): void {
    if (authUser.role === UserRole.ADMIN) {
      return;
    }

    if (authUser.role === UserRole.AGENT) {
      return;
    }

    if (
      authUser.role === UserRole.CUSTOMER &&
      ticket.customerId === authUser.id
    ) {
      return;
    }

    throw new AppError('Forbidden', 403);
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
    if (authUser.role === UserRole.ADMIN) {
      return;
    }

    if (authUser.role === UserRole.AGENT && agentId === authUser.id) {
      return;
    }

    throw new AppError('Forbidden', 403);
  }

  private assertCanManageTickets(authUser: AuthenticatedUser): void {
    if (authUser.role === UserRole.ADMIN || authUser.role === UserRole.AGENT) {
      return;
    }

    throw new AppError('Forbidden', 403);
  }
}

export const ticketsService = new TicketsService();
