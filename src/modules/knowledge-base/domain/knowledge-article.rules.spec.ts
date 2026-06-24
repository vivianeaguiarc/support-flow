import { describe, expect, it } from 'vitest';

import { UserRole } from '../../../shared/types/user-role.js';
import {
  assertArticleArchivable,
  assertArticleEditable,
  assertArticlePublishable,
} from './knowledge-article.rules.js';
import { KnowledgeArticleStatus } from './knowledge-article-enums.js';
import {
  assertArticleReadable,
  resolveListStatusFilter,
} from './knowledge-article-visibility.js';

describe('knowledge article visibility', () => {
  it('should force published status for public users', () => {
    expect(
      resolveListStatusFilter(undefined, KnowledgeArticleStatus.DRAFT),
    ).toBe(KnowledgeArticleStatus.PUBLISHED);
    expect(
      resolveListStatusFilter(
        {
          id: '1',
          role: UserRole.CUSTOMER,
          tenantId: 't1',
          email: 'c@test.com',
        },
        KnowledgeArticleStatus.ARCHIVED,
      ),
    ).toBe(KnowledgeArticleStatus.PUBLISHED);
  });

  it('should allow staff to filter by status', () => {
    expect(
      resolveListStatusFilter(
        { id: '1', role: UserRole.ADMIN, tenantId: 't1', email: 'a@test.com' },
        KnowledgeArticleStatus.DRAFT,
      ),
    ).toBe(KnowledgeArticleStatus.DRAFT);
  });

  it('should hide non-published articles from public readers', () => {
    expect(() =>
      assertArticleReadable({ status: KnowledgeArticleStatus.DRAFT }),
    ).toThrow('Article not found');

    expect(() =>
      assertArticleReadable(
        { status: KnowledgeArticleStatus.DRAFT },
        {
          id: '1',
          role: UserRole.ADMIN,
          tenantId: 't1',
          email: 'a@test.com',
        },
      ),
    ).not.toThrow();
  });
});

describe('knowledge article rules', () => {
  it('should block editing archived articles', () => {
    expect(() =>
      assertArticleEditable(KnowledgeArticleStatus.ARCHIVED),
    ).toThrow('Cannot edit an archived article');
  });

  it('should block publishing already published or archived articles', () => {
    expect(() =>
      assertArticlePublishable(KnowledgeArticleStatus.PUBLISHED),
    ).toThrow('Article is already published');
    expect(() =>
      assertArticlePublishable(KnowledgeArticleStatus.ARCHIVED),
    ).toThrow('Cannot publish an archived article');
  });

  it('should block archiving already archived articles', () => {
    expect(() =>
      assertArticleArchivable(KnowledgeArticleStatus.ARCHIVED),
    ).toThrow('Article is already archived');
  });
});
