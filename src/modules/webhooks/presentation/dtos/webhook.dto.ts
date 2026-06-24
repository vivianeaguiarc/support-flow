import { z } from 'zod';

import { WebhookEvent } from '../../domain/webhook-event.js';

const webhookEventValues = Object.values(WebhookEvent) as [
  WebhookEvent,
  ...WebhookEvent[],
];

const webhookEventSchema = z.enum(webhookEventValues);

export const createWebhookSchema = z.object({
  name: z.string().trim().min(1).max(120),
  url: z.url('Invalid webhook URL'),
  events: z.array(webhookEventSchema).min(1),
});

export const updateWebhookSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    url: z.url('Invalid webhook URL'),
    events: z.array(webhookEventSchema).min(1),
    active: z.boolean(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export const webhookIdParamSchema = z.object({
  id: z.uuid('Invalid webhook ID'),
});

export type CreateWebhookDto = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookDto = z.infer<typeof updateWebhookSchema>;
