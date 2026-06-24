import { z } from 'zod';

export const updateKnowledgeArticleSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    slug: z
      .string()
      .trim()
      .min(3)
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case')
      .optional(),
    content: z.string().trim().min(1).optional(),
    category: z.string().trim().min(2).max(100).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.slug !== undefined ||
      data.content !== undefined ||
      data.category !== undefined,
    { message: 'At least one field must be provided' },
  );

export type UpdateKnowledgeArticleDto = z.infer<
  typeof updateKnowledgeArticleSchema
>;
