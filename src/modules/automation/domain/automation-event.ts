import type { Ticket } from '../../tickets/domain/ticket.entity.js';
import type { AutomationTrigger } from './automation-trigger.js';

export type AutomationEvent = {
  tenantId: string;
  ticketId: string;
  trigger: AutomationTrigger;
  ticket: Ticket;
  previousTicket?: Partial<Ticket>;
  actorId?: string;
  metadata?: Record<string, unknown>;
};
