import type { TicketPriority } from '../../domain/ticket-enums.js';
import { calculateSlaDueAt, resolveSlaHours } from '../../domain/ticket-sla.js';
import {
  isSlaBreached,
  isSlaWarning,
  resolveTicketSlaStatus,
} from '../../domain/ticket-sla-status.js';
import type { TicketSlaSummary } from '../../domain/ticket-sla-summary.js';
import {
  type CalculateTicketSlaInput,
  CalculateTicketSlaUseCase,
  calculateTicketSlaUseCase,
} from '../use-cases/calculate-ticket-sla.use-case.js';
import {
  GetTicketSlaSummaryUseCase,
  getTicketSlaSummaryUseCase,
} from '../use-cases/get-ticket-sla-summary.use-case.js';
import {
  type BreachedSlaTicket,
  type ListBreachedSlaTicketsInput,
  ListBreachedSlaTicketsUseCase,
  listBreachedSlaTicketsUseCase,
} from '../use-cases/list-breached-sla-tickets.use-case.js';

export class TicketSlaService {
  constructor(
    private readonly calculateTicketSla: CalculateTicketSlaUseCase = calculateTicketSlaUseCase,
    private readonly getSummary: GetTicketSlaSummaryUseCase = getTicketSlaSummaryUseCase,
    private readonly listBreached: ListBreachedSlaTicketsUseCase = listBreachedSlaTicketsUseCase,
  ) {}

  async calculateDueAt(input: CalculateTicketSlaInput): Promise<Date> {
    return this.calculateTicketSla.execute(input);
  }

  resolveStatus(slaDueAt: Date, now: Date = new Date()) {
    return resolveTicketSlaStatus(slaDueAt, now);
  }

  isWarning(slaDueAt: Date, now: Date = new Date()): boolean {
    return isSlaWarning(slaDueAt, now);
  }

  isBreached(slaDueAt: Date, now: Date = new Date()): boolean {
    return isSlaBreached(slaDueAt, now);
  }

  resolveHoursForPriority(priority: TicketPriority): number {
    return resolveSlaHours({ priority });
  }

  calculateDueAtFromHours(createdAt: Date, slaHours: number): Date {
    return calculateSlaDueAt(createdAt, slaHours);
  }

  async getSummaryForTenant(tenantId: string): Promise<TicketSlaSummary> {
    return this.getSummary.execute({ tenantId });
  }

  async listBreachedForTenant(input: ListBreachedSlaTicketsInput): Promise<{
    data: BreachedSlaTicket[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.listBreached.execute(input);
  }
}

export const ticketSlaService = new TicketSlaService();
