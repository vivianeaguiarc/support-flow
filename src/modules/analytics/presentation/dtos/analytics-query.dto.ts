import { z } from 'zod';

export const analyticsQuerySchema = z
  .object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    status: z
      .enum([
        'OPEN',
        'IN_PROGRESS',
        'WAITING_CUSTOMER',
        'ESCALATED',
        'RESOLVED',
        'CLOSED',
      ])
      .optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    agentId: z.uuid('Invalid agent ID').optional(),
  })
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      data.startDate.getTime() <= data.endDate.getTime(),
    {
      message: 'startDate must be before or equal to endDate',
    },
  );

export type AnalyticsQueryDto = z.infer<typeof analyticsQuerySchema>;
