import { notificationService } from '../../email/application/services/notification.service.js';
import type { EmailJobData } from '../../jobs/domain/job-types.js';
import { ticketsRepository } from '../../tickets/infrastructure/repositories/tickets.repository.js';

export async function processEmailJob(data: EmailJobData): Promise<void> {
  const ticket = await ticketsRepository.findById(data.ticketId);

  if (!ticket) {
    throw new Error(`Ticket ${data.ticketId} not found for email job`);
  }

  await notificationService.deliverTicketEmail({
    event: data.event,
    ticket,
    recipientId: data.recipientId,
    context: data.context,
  });
}
