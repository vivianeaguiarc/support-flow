import { NotFoundError } from '../../../../shared/errors/http-errors.js';
import type { AuthenticatedUser } from '../../../../shared/types/authenticated-user.js';
import type { KnowledgeArticle } from '../../domain/knowledge-article.entity.js';
import { KnowledgeArticleStatus } from '../../domain/knowledge-article-enums.js';
import {
  assertArticleReadable,
  resolveListStatusFilter,
} from '../../domain/knowledge-article-visibility.js';
import {
  KnowledgeArticlesRepository,
  knowledgeArticlesRepository,
} from '../../infrastructure/repositories/knowledge-articles.repository.js';
import type { ListKnowledgeArticlesInput } from '../inputs/knowledge-article.inputs.js';

export class ListKnowledgeArticlesUseCase {
  constructor(
    private readonly repository: KnowledgeArticlesRepository = knowledgeArticlesRepository,
  ) {}

  async execute(
    input: ListKnowledgeArticlesInput,
    authUser?: AuthenticatedUser,
  ): Promise<{
    data: KnowledgeArticle[];
    total: number;
    page: number;
    limit: number;
  }> {
    const status = resolveListStatusFilter(
      authUser,
      input.status as
        | typeof KnowledgeArticleStatus.DRAFT
        | typeof KnowledgeArticleStatus.PUBLISHED
        | typeof KnowledgeArticleStatus.ARCHIVED
        | undefined,
    );

    return this.repository.listWithFilters({
      tenantId: input.tenantId,
      status,
      category: input.category,
      search: input.search,
      page: input.page,
      limit: input.limit,
    });
  }
}

export const listKnowledgeArticlesUseCase = new ListKnowledgeArticlesUseCase();

export class GetKnowledgeArticleBySlugUseCase {
  constructor(
    private readonly repository: KnowledgeArticlesRepository = knowledgeArticlesRepository,
  ) {}

  async execute(
    tenantId: string,
    slug: string,
    authUser?: AuthenticatedUser,
  ): Promise<KnowledgeArticle> {
    const article = await this.repository.findBySlugAndTenant(slug, tenantId);

    if (!article) {
      throw new NotFoundError('Article not found');
    }

    assertArticleReadable(article, authUser);

    return article;
  }
}

export const getKnowledgeArticleBySlugUseCase =
  new GetKnowledgeArticleBySlugUseCase();
