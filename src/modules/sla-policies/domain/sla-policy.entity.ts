import type { TicketPriority } from '../../tickets/domain/ticket-enums.js';

/**
 * Administrable SLA policy. Times are expressed in hours to stay consistent
 * with the rest of the SLA domain (`Tenant.defaultSlaHours`,
 * `TicketCategory.slaHours`, priority-based hours).
 */
export type SlaPolicy = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  priority: TicketPriority | null;
  firstResponseHours: number;
  resolutionHours: number;
  businessHoursOnly: boolean;
  isActive: boolean;
  categoryIds: string[];
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
};
