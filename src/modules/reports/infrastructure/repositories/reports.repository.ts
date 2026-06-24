import { prisma } from '../../../../shared/database/prisma.js';
import type { AnalyticsFilters } from '../../../analytics/domain/analytics-filters.js';
import { buildAnalyticsWhere } from '../../../analytics/infrastructure/repositories/build-analytics-where.js';
import { TicketStatus } from '../../../tickets/domain/ticket-enums.js';
import {
  calculateSlaHoursOverdue,
  calculateSlaHoursRemaining,
  resolveTicketSlaStatus,
} from '../../../tickets/domain/ticket-sla-status.js';
import { formatCsvDate, formatCsvRow } from '../csv/csv-formatter.js';

const TICKET_EXPORT_BATCH_SIZE = 500;

const TICKET_CSV_HEADERS = [
  'protocol',
  'title',
  'status',
  'priority',
  'customerName',
  'customerEmail',
  'agentName',
  'categoryName',
  'slaDueAt',
  'closedAt',
  'createdAt',
  'updatedAt',
] as const;

const SLA_CSV_HEADERS = [
  'protocol',
  'title',
  'status',
  'priority',
  'agentName',
  'slaDueAt',
  'slaStatus',
  'hoursRemaining',
  'hoursOverdue',
  'slaCompliant',
] as const;

export type TicketCsvRow = {
  protocol: string;
  title: string;
  status: string;
  priority: string;
  customerName: string;
  customerEmail: string;
  agentName: string;
  categoryName: string;
  slaDueAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SlaCsvRow = {
  protocol: string;
  title: string;
  status: string;
  priority: string;
  agentName: string;
  slaDueAt: Date;
  slaStatus: string;
  hoursRemaining: number;
  hoursOverdue: number;
  slaCompliant: string;
};

export class ReportsRepository {
  getTicketCsvHeaders(): string {
    return TICKET_CSV_HEADERS.join(',');
  }

  getSlaCsvHeaders(): string {
    return SLA_CSV_HEADERS.join(',');
  }

  formatTicketCsvRow(row: TicketCsvRow): string {
    return formatCsvRow([
      row.protocol,
      row.title,
      row.status,
      row.priority,
      row.customerName,
      row.customerEmail,
      row.agentName,
      row.categoryName,
      formatCsvDate(row.slaDueAt),
      formatCsvDate(row.closedAt),
      formatCsvDate(row.createdAt),
      formatCsvDate(row.updatedAt),
    ]);
  }

  formatSlaCsvRow(row: SlaCsvRow): string {
    return formatCsvRow([
      row.protocol,
      row.title,
      row.status,
      row.priority,
      row.agentName,
      formatCsvDate(row.slaDueAt),
      row.slaStatus,
      row.hoursRemaining,
      row.hoursOverdue,
      row.slaCompliant,
    ]);
  }

  async *streamTicketRows(
    filters: AnalyticsFilters,
  ): AsyncGenerator<TicketCsvRow> {
    const where = buildAnalyticsWhere(filters);
    let cursor: string | undefined;

    while (true) {
      const batch = await prisma.ticket.findMany({
        where,
        take: TICKET_EXPORT_BATCH_SIZE,
        ...(cursor
          ? {
              skip: 1,
              cursor: { id: cursor },
            }
          : {}),
        orderBy: { id: 'asc' },
        select: {
          id: true,
          protocol: true,
          title: true,
          status: true,
          priority: true,
          slaDueAt: true,
          closedAt: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              name: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              name: true,
            },
          },
          category: {
            select: {
              name: true,
            },
          },
        },
      });

      if (batch.length === 0) {
        break;
      }

      for (const ticket of batch) {
        yield {
          protocol: ticket.protocol,
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          customerName: ticket.customer.name,
          customerEmail: ticket.customer.email,
          agentName: ticket.assignedTo?.name ?? '',
          categoryName: ticket.category?.name ?? '',
          slaDueAt: ticket.slaDueAt,
          closedAt: ticket.closedAt,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
        };
      }

      cursor = batch[batch.length - 1]?.id;

      if (batch.length < TICKET_EXPORT_BATCH_SIZE) {
        break;
      }
    }
  }

  async *streamSlaRows(filters: AnalyticsFilters): AsyncGenerator<SlaCsvRow> {
    const where = {
      ...buildAnalyticsWhere(filters),
      slaDueAt: { not: null },
    };
    const now = new Date();
    let cursor: string | undefined;

    while (true) {
      const batch = await prisma.ticket.findMany({
        where,
        take: TICKET_EXPORT_BATCH_SIZE,
        ...(cursor
          ? {
              skip: 1,
              cursor: { id: cursor },
            }
          : {}),
        orderBy: { id: 'asc' },
        select: {
          id: true,
          protocol: true,
          title: true,
          status: true,
          priority: true,
          slaDueAt: true,
          closedAt: true,
          updatedAt: true,
          assignedTo: {
            select: {
              name: true,
            },
          },
        },
      });

      if (batch.length === 0) {
        break;
      }

      for (const ticket of batch) {
        if (!ticket.slaDueAt) {
          continue;
        }

        const slaStatus = resolveTicketSlaStatus(ticket.slaDueAt, now);
        const resolvedAt = ticket.closedAt ?? ticket.updatedAt;
        const isResolved =
          ticket.status === TicketStatus.RESOLVED ||
          ticket.status === TicketStatus.CLOSED;
        const slaCompliant =
          isResolved && resolvedAt.getTime() <= ticket.slaDueAt.getTime()
            ? 'YES'
            : isResolved
              ? 'NO'
              : '';

        yield {
          protocol: ticket.protocol,
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          agentName: ticket.assignedTo?.name ?? '',
          slaDueAt: ticket.slaDueAt,
          slaStatus,
          hoursRemaining: calculateSlaHoursRemaining(ticket.slaDueAt, now),
          hoursOverdue: calculateSlaHoursOverdue(ticket.slaDueAt, now),
          slaCompliant,
        };
      }

      cursor = batch[batch.length - 1]?.id;

      if (batch.length < TICKET_EXPORT_BATCH_SIZE) {
        break;
      }
    }
  }
}

export const reportsRepository = new ReportsRepository();
