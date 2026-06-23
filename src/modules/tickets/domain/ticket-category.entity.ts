export type TicketCategory = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  slaHours: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
