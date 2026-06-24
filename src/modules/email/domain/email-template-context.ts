export type EmailTemplateContext = {
  recipientName: string;
  ticketProtocol: string;
  ticketTitle: string;
  ticketStatus?: string;
  oldStatus?: string;
  newStatus?: string;
  hoursRemaining?: number;
  hoursOverdue?: number;
};
