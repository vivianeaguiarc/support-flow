import type { Prisma } from '@prisma/client';

import { prisma } from '../../../../shared/database/prisma.js';
import {
  SATISFACTION_MAX_RATING,
  SATISFACTION_MIN_RATING,
} from '../../../tickets/domain/ticket-satisfaction-survey.entity.js';
import type {
  AnalyticsCsat,
  CsatAgentAverage,
  CsatPeriodAverage,
  CsatRatingDistribution,
} from '../../domain/analytics-types.js';
import type { CsatFilters } from '../../domain/csat-filters.js';

function buildCsatWhere(
  filters: CsatFilters,
): Prisma.TicketSatisfactionSurveyWhereInput {
  const where: Prisma.TicketSatisfactionSurveyWhereInput = {
    tenantId: filters.tenantId,
  };

  if (filters.startDate || filters.endDate) {
    where.submittedAt = {
      ...(filters.startDate ? { gte: filters.startDate } : {}),
      ...(filters.endDate ? { lte: filters.endDate } : {}),
    };
  }

  if (filters.agentId) {
    where.ticket = { assignedToId: filters.agentId };
  }

  return where;
}

function buildDistribution(
  rows: Array<{ rating: number; _count: { rating: number } }>,
): CsatRatingDistribution[] {
  const counts = new Map<number, number>();

  for (
    let rating = SATISFACTION_MIN_RATING;
    rating <= SATISFACTION_MAX_RATING;
    rating += 1
  ) {
    counts.set(rating, 0);
  }

  for (const row of rows) {
    counts.set(row.rating, row._count.rating);
  }

  return Array.from(counts.entries()).map(([rating, count]) => ({
    rating,
    count,
  }));
}

function buildByAgent(
  surveys: Array<{
    rating: number;
    ticket: {
      assignedToId: string | null;
      assignedTo: { id: string; name: string } | null;
    };
  }>,
): CsatAgentAverage[] {
  const agentMap = new Map<
    string,
    { agentName: string; totalRating: number; count: number }
  >();

  for (const survey of surveys) {
    const agent = survey.ticket.assignedTo;
    if (!agent) {
      continue;
    }

    const current = agentMap.get(agent.id) ?? {
      agentName: agent.name,
      totalRating: 0,
      count: 0,
    };

    current.totalRating += survey.rating;
    current.count += 1;
    agentMap.set(agent.id, current);
  }

  return Array.from(agentMap.entries())
    .map(([agentId, data]) => ({
      agentId,
      agentName: data.agentName,
      averageRating: Math.round((data.totalRating / data.count) * 100) / 100,
      totalSurveys: data.count,
    }))
    .sort((left, right) => right.averageRating - left.averageRating);
}

function buildByPeriod(
  surveys: Array<{ rating: number; submittedAt: Date }>,
): CsatPeriodAverage[] {
  const periodMap = new Map<string, { totalRating: number; count: number }>();

  for (const survey of surveys) {
    const period = survey.submittedAt.toISOString().slice(0, 10);
    const current = periodMap.get(period) ?? { totalRating: 0, count: 0 };
    current.totalRating += survey.rating;
    current.count += 1;
    periodMap.set(period, current);
  }

  return Array.from(periodMap.entries())
    .map(([period, data]) => ({
      period,
      averageRating: Math.round((data.totalRating / data.count) * 100) / 100,
      count: data.count,
    }))
    .sort((left, right) => left.period.localeCompare(right.period));
}

export class CsatAnalyticsRepository {
  async getCsat(filters: CsatFilters): Promise<AnalyticsCsat> {
    const where = buildCsatWhere(filters);

    const [aggregate, distributionRows, surveysForAgents, surveysForPeriod] =
      await Promise.all([
        prisma.ticketSatisfactionSurvey.aggregate({
          where,
          _avg: { rating: true },
          _count: { _all: true },
        }),
        prisma.ticketSatisfactionSurvey.groupBy({
          by: ['rating'],
          where,
          _count: { rating: true },
        }),
        prisma.ticketSatisfactionSurvey.findMany({
          where,
          select: {
            rating: true,
            ticket: {
              select: {
                assignedToId: true,
                assignedTo: { select: { id: true, name: true } },
              },
            },
          },
        }),
        prisma.ticketSatisfactionSurvey.findMany({
          where,
          select: { rating: true, submittedAt: true },
        }),
      ]);

    const totalSurveys = aggregate._count._all;
    const averageRating =
      totalSurveys > 0 && aggregate._avg.rating !== null
        ? Math.round(aggregate._avg.rating * 100) / 100
        : 0;

    return {
      averageRating,
      totalSurveys,
      distribution: buildDistribution(distributionRows),
      byAgent: buildByAgent(surveysForAgents),
      byPeriod: buildByPeriod(surveysForPeriod),
    };
  }
}

export const csatAnalyticsRepository = new CsatAnalyticsRepository();
