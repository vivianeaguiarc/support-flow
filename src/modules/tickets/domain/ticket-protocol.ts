export function generateTicketProtocol(date = new Date()): string {
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `SF-${datePart}-${randomPart}`;
}
