import { z } from 'zod';

export const listNotificationsQuerySchema = z
  .object({
    unread: z.string().optional(),
    limit: z.string().optional(),
    offset: z.string().optional(),
  })
  .transform((data) => ({
    unread: data.unread === 'true',
    limit: data.limit ? parseInt(data.limit, 10) : undefined,
    offset: data.offset ? parseInt(data.offset, 10) : undefined,
  }));

export type ListNotificationsQueryDto = z.output<
  typeof listNotificationsQuerySchema
>;
