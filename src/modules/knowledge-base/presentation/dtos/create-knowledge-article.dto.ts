import { z } from 'zod';

export const createKnowledgeArticleSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case')
    .optional(),
  content: z.string().trim().min(1),
  category: z.string().trim().min(2).max(100),
});

export type CreateKnowledgeArticleDto = z.infer<
  typeof createKnowledgeArticleSchema
>;
