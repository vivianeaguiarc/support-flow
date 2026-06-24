import type { KnowledgeArticleStatus } from './knowledge-article-enums.js';

export type KnowledgeArticleListFilters = {
  tenantId: string;
  status?: KnowledgeArticleStatus;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
};
