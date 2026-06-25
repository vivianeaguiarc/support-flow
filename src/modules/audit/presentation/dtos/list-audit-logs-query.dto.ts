import { z } from 'zod';

export const AUDIT_LOG_SORT_FIELDS = [
  'createdAt',
  'action',
  'entity',
  'userId',
] as const;

export type AuditLogSortField = (typeof AUDIT_LOG_SORT_FIELDS)[number];

const isoDateString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Must be a valid ISO date string',
  })
  .transform((value) => new Date(value));

export const listAuditLogsQuerySchema = z.object({
  organizationId: z.string().optional(),
  userId: z.string().optional(),
  action: z.string().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  search: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  createdFrom: isoDateString.optional(),
  createdTo: isoDateString.optional(),
  sortBy: z.enum(AUDIT_LOG_SORT_FIELDS).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type ListAuditLogsQueryDto = z.infer<typeof listAuditLogsQuerySchema>;
