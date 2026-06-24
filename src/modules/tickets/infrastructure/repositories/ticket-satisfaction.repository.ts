import { prisma } from '../../../../shared/database/prisma.js';
import type { TicketSatisfactionSurvey } from '../../domain/ticket-satisfaction-survey.entity.js';

function toSurvey(record: {
  id: string;
  tenantId: string;
  ticketId: string;
  customerId: string;
  rating: number;
  comment: string | null;
  submittedAt: Date;
  createdAt: Date;
}): TicketSatisfactionSurvey {
  return {
    id: record.id,
    tenantId: record.tenantId,
    ticketId: record.ticketId,
    customerId: record.customerId,
    rating: record.rating,
    comment: record.comment,
    submittedAt: record.submittedAt,
    createdAt: record.createdAt,
  };
}

export type CreateTicketSatisfactionSurveyData = {
  tenantId: string;
  ticketId: string;
  customerId: string;
  rating: number;
  comment?: string | null;
};

export class TicketSatisfactionRepository {
  async findByTicketId(
    ticketId: string,
    tenantId: string,
  ): Promise<TicketSatisfactionSurvey | null> {
    const record = await prisma.ticketSatisfactionSurvey.findFirst({
      where: { ticketId, tenantId },
    });

    return record ? toSurvey(record) : null;
  }

  async create(
    data: CreateTicketSatisfactionSurveyData,
  ): Promise<TicketSatisfactionSurvey> {
    const record = await prisma.ticketSatisfactionSurvey.create({
      data: {
        tenantId: data.tenantId,
        ticketId: data.ticketId,
        customerId: data.customerId,
        rating: data.rating,
        comment: data.comment,
      },
    });

    return toSurvey(record);
  }
}

export const ticketSatisfactionRepository = new TicketSatisfactionRepository();
