import { z } from 'zod';

export const knowledgeArticleSlugParamSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export type KnowledgeArticleSlugParamDto = z.infer<
  typeof knowledgeArticleSlugParamSchema
>;
