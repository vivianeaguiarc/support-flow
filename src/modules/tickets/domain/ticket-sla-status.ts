import { TicketStatus } from './ticket-enums.js';

export const TicketSlaStatus = {
  ON_TIME: 'ON_TIME',
  WARNING: 'WARNING',
  BREACHED: 'BREACHED',
} as const;

export type TicketSlaStatus =
  (typeof TicketSlaStatus)[keyof typeof TicketSlaStatus];

export const SLA_ACTIVE_TICKET_STATUSES = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_CUSTOMER,
  TicketStatus.ESCALATED,
] as const;

/** Janela fixa de alerta antes do vencimento (alinhada ao monitoramento). */
export const SLA_WARNING_THRESHOLD_HOURS = 24;

export function isTicketEligibleForSlaTracking(status: TicketStatus): boolean {
  return SLA_ACTIVE_TICKET_STATUSES.includes(
    status as (typeof SLA_ACTIVE_TICKET_STATUSES)[number],
  );
}

export function resolveTicketSlaStatus(
  slaDueAt: Date,
  now: Date = new Date(),
): TicketSlaStatus {
  if (now.getTime() >= slaDueAt.getTime()) {
    return TicketSlaStatus.BREACHED;
  }

  const warningThreshold = new Date(
    now.getTime() + SLA_WARNING_THRESHOLD_HOURS * 60 * 60 * 1000,
  );

  if (slaDueAt.getTime() <= warningThreshold.getTime()) {
    return TicketSlaStatus.WARNING;
  }

  return TicketSlaStatus.ON_TIME;
}

export function isSlaBreached(slaDueAt: Date, now: Date = new Date()): boolean {
  return resolveTicketSlaStatus(slaDueAt, now) === TicketSlaStatus.BREACHED;
}

export function isSlaWarning(slaDueAt: Date, now: Date = new Date()): boolean {
  return resolveTicketSlaStatus(slaDueAt, now) === TicketSlaStatus.WARNING;
}

export function calculateSlaHoursOverdue(
  slaDueAt: Date,
  now: Date = new Date(),
): number {
  const diffMs = now.getTime() - slaDueAt.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
}

export function calculateSlaHoursRemaining(
  slaDueAt: Date,
  now: Date = new Date(),
): number {
  const diffMs = slaDueAt.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
}
