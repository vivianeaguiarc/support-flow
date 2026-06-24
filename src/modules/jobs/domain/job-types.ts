import type { AnalyticsQueryDto } from '../../analytics/presentation/dtos/analytics-query.dto.js';
import type { AutomationTrigger } from '../../automation/domain/automation-trigger.js';
import type { EmailNotificationEvent } from '../../email/domain/email-notification-event.js';
import type { EmailTemplateContext } from '../../email/domain/email-template-context.js';
import type { Ticket } from '../../tickets/domain/ticket.entity.js';
import type { WebhookEvent } from '../../webhooks/domain/webhook-event.js';

export const ReportJobType = {
  TICKETS: 'tickets',
  AGENTS_PERFORMANCE: 'agents-performance',
  SLA: 'sla',
} as const;

export type ReportJobType = (typeof ReportJobType)[keyof typeof ReportJobType];

export type EmailJobData = {
  event: EmailNotificationEvent;
  ticketId: string;
  tenantId: string;
  recipientId: string;
  context?: Partial<EmailTemplateContext>;
};

export type WebhookJobData = {
  tenantId: string;
  event: WebhookEvent;
  data: Record<string, unknown>;
};

export type ReportJobData = {
  type: ReportJobType;
  tenantId: string;
  userId: string;
  filters: AnalyticsQueryDto;
};

export type AutomationJobData = {
  tenantId: string;
  ticketId: string;
  trigger: AutomationTrigger;
  actorId?: string;
  metadata?: Record<string, unknown>;
  previousTicket?: Partial<Ticket>;
};

export type DeadLetterJobData = {
  originalQueue: string;
  originalJobId: string;
  data: unknown;
  error: string;
  failedAt: string;
};

export type ReportJobResult = {
  content: string;
  filename: string;
};
