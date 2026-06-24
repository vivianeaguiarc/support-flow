import { beforeEach, describe, expect, it, vi } from 'vitest';

import { KnowledgeArticleStatus } from '../../domain/knowledge-article-enums.js';
import { PublishKnowledgeArticleUseCase } from './publish-knowledge-article.use-case.js';
import { UpdateKnowledgeArticleUseCase } from './update-knowledge-article.use-case.js';

const article = {
  id: 'article-1',
  tenantId: 'tenant-1',
  title: 'FAQ',
  slug: 'faq-original',
  content: 'Conteúdo',
  status: KnowledgeArticleStatus.DRAFT,
  category: 'Suporte',
  authorId: 'author-1',
  publishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('knowledge article use cases', () => {
  const repository = {
    findByIdAndTenant: vi.fn(),
    listSlugsByTenant: vi.fn(),
    update: vi.fn(),
    publish: vi.fn(),
  };

  const findArticle = {
    execute: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    findArticle.execute.mockResolvedValue(article);
    repository.listSlugsByTenant.mockResolvedValue(['faq']);
    repository.update.mockResolvedValue({
      ...article,
      title: 'FAQ atualizado',
    });
    repository.publish.mockResolvedValue({
      ...article,
      status: KnowledgeArticleStatus.PUBLISHED,
      publishedAt: new Date(),
    });
  });

  it('should publish draft article', async () => {
    const useCase = new PublishKnowledgeArticleUseCase(
      repository as never,
      findArticle as never,
    );

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      articleId: 'article-1',
      actorId: 'admin-1',
    });

    expect(result.status).toBe(KnowledgeArticleStatus.PUBLISHED);
    expect(repository.publish).toHaveBeenCalledWith('article-1', 'tenant-1');
  });

  it('should update article with unique slug', async () => {
    const useCase = new UpdateKnowledgeArticleUseCase(
      repository as never,
      findArticle as never,
    );

    await useCase.execute({
      tenantId: 'tenant-1',
      articleId: 'article-1',
      actorId: 'admin-1',
      slug: 'faq',
      title: 'FAQ atualizado',
    });

    expect(repository.update).toHaveBeenCalledWith('article-1', 'tenant-1', {
      title: 'FAQ atualizado',
      slug: 'faq-2',
      content: undefined,
      category: undefined,
    });
  });
});
