import { describe, expect, it } from 'vitest';

import { KnowledgeArticleStatus } from '../../domain/knowledge-article-enums.js';
import { buildKnowledgeArticleListWhere } from './build-knowledge-article-list-where.js';

describe('buildKnowledgeArticleListWhere', () => {
  it('should filter by tenant, status, category and search', () => {
    const where = buildKnowledgeArticleListWhere({
      tenantId: 'tenant-1',
      status: KnowledgeArticleStatus.PUBLISHED,
      category: 'Atendimento',
      search: 'chamado',
    });

    expect(where).toMatchObject({
      tenantId: 'tenant-1',
      status: KnowledgeArticleStatus.PUBLISHED,
      category: {
        equals: 'Atendimento',
        mode: 'insensitive',
      },
      OR: [
        { title: { contains: 'chamado', mode: 'insensitive' } },
        { content: { contains: 'chamado', mode: 'insensitive' } },
        { slug: { contains: 'chamado', mode: 'insensitive' } },
      ],
    });
  });
});
