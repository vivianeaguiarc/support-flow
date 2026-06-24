import { z } from 'zod';

import { paginationQueryFields } from '../../../../shared/http/dtos/pagination-query.dto.js';
import { KnowledgeArticleStatus } from '../../domain/knowledge-article-enums.js';

export const listKnowledgeArticlesQuerySchema = z.object({
  page: paginationQueryFields.page,
  limit: paginationQueryFields.limit,
  search: paginationQueryFields.search,
  category: z.string().trim().min(1).optional(),
  status: z
    .enum([
      KnowledgeArticleStatus.DRAFT,
      KnowledgeArticleStatus.PUBLISHED,
      KnowledgeArticleStatus.ARCHIVED,
    ])
    .optional(),
});

export type ListKnowledgeArticlesQueryDto = z.infer<
  typeof listKnowledgeArticlesQuerySchema
>;
