import { z } from 'zod';

export const knowledgeArticleIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type KnowledgeArticleIdParamDto = z.infer<
  typeof knowledgeArticleIdParamSchema
>;
