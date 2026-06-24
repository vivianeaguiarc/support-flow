import { TicketPriority } from './ticket-enums.js';

export const DEFAULT_SLA_FALLBACK_HOURS = 72;

/** URGENT equivale ao nível CRITICAL do requisito de negócio. */
export const PRIORITY_SLA_HOURS: Record<TicketPriority, number> = {
  [TicketPriority.LOW]: 72,
  [TicketPriority.MEDIUM]: 24,
  [TicketPriority.HIGH]: 8,
  [TicketPriority.URGENT]: 2,
};

export type ResolveSlaHoursInput = {
  tenantDefaultSlaHours?: number | null;
  categorySlaHours?: number | null;
  priority: TicketPriority;
};

export function resolveSlaHours(input: ResolveSlaHoursInput): number {
  const priorityHours = PRIORITY_SLA_HOURS[input.priority];

  if (priorityHours !== undefined) {
    return priorityHours;
  }

  const tenantDefault =
    input.tenantDefaultSlaHours ?? DEFAULT_SLA_FALLBACK_HOURS;

  return input.categorySlaHours ?? tenantDefault;
}

export function addHoursToDate(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function calculateSlaDueAt(createdAt: Date, slaHours: number): Date {
  return addHoursToDate(createdAt, slaHours);
}
