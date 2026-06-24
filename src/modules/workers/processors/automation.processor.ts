import { automationEngine } from '../../automation/application/services/automation-engine.js';
import type { AutomationJobData } from '../../jobs/domain/job-types.js';
import { ticketsRepository } from '../../tickets/infrastructure/repositories/tickets.repository.js';

export async function processAutomationJob(
  data: AutomationJobData,
): Promise<void> {
  const ticket = await ticketsRepository.findById(data.ticketId);

  if (!ticket) {
    throw new Error(`Ticket ${data.ticketId} not found for automation job`);
  }

  await automationEngine.processEventDirect({
    tenantId: data.tenantId,
    ticketId: data.ticketId,
    trigger: data.trigger,
    ticket,
    previousTicket: data.previousTicket,
    actorId: data.actorId,
    metadata: data.metadata,
  });
}
