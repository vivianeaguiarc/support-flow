import type { Prisma } from '@prisma/client';

import type { KnowledgeArticleListFilters } from '../../domain/knowledge-article-list-filters.js';

export function buildKnowledgeArticleListWhere(
  filters: KnowledgeArticleListFilters,
): Prisma.KnowledgeArticleWhereInput {
  const where: Prisma.KnowledgeArticleWhereInput = {
    tenantId: filters.tenantId,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.category) {
    where.category = {
      equals: filters.category.trim(),
      mode: 'insensitive',
    };
  }

  if (filters.search) {
    const term = filters.search.trim();
    where.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { content: { contains: term, mode: 'insensitive' } },
      { slug: { contains: term, mode: 'insensitive' } },
    ];
  }

  return where;
}
