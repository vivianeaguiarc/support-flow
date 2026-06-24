export type TicketSatisfactionSurvey = {
  id: string;
  tenantId: string;
  ticketId: string;
  customerId: string;
  rating: number;
  comment: string | null;
  submittedAt: Date;
  createdAt: Date;
};

export const SATISFACTION_MIN_RATING = 1;
export const SATISFACTION_MAX_RATING = 5;

export const SATISFACTION_ELIGIBLE_STATUSES = ['RESOLVED', 'CLOSED'] as const;
