type ResolutionTicket = {
  createdAt: Date;
  closedAt: Date | null;
  updatedAt: Date;
  slaDueAt: Date | null;
};

export function getResolutionTimestamp(ticket: ResolutionTicket): Date {
  return ticket.closedAt ?? ticket.updatedAt;
}

export function calculateResolutionMetrics(tickets: ResolutionTicket[]): {
  avgResolutionTimeHours: number;
  slaComplianceRate: number;
} {
  if (tickets.length === 0) {
    return {
      avgResolutionTimeHours: 0,
      slaComplianceRate: 0,
    };
  }

  let totalResolutionMs = 0;
  let compliantCount = 0;
  let ticketsWithSla = 0;

  for (const ticket of tickets) {
    const resolvedAt = getResolutionTimestamp(ticket);
    totalResolutionMs += resolvedAt.getTime() - ticket.createdAt.getTime();

    if (ticket.slaDueAt) {
      ticketsWithSla += 1;
      if (resolvedAt.getTime() <= ticket.slaDueAt.getTime()) {
        compliantCount += 1;
      }
    }
  }

  const avgResolutionTimeHours =
    Math.round((totalResolutionMs / tickets.length / (1000 * 60 * 60)) * 100) /
    100;

  const slaComplianceRate =
    ticketsWithSla > 0
      ? Math.round((compliantCount / ticketsWithSla) * 10000) / 100
      : 0;

  return {
    avgResolutionTimeHours,
    slaComplianceRate,
  };
}

export function groupTicketsByPeriod(
  tickets: Array<{ createdAt: Date }>,
): Array<{ period: string; count: number }> {
  const counts = new Map<string, number>();

  for (const ticket of tickets) {
    const period = ticket.createdAt.toISOString().slice(0, 10);
    counts.set(period, (counts.get(period) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([period, count]) => ({ period, count }))
    .sort((left, right) => left.period.localeCompare(right.period));
}
