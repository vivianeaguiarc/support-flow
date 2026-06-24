import { NotFoundError } from '../../../../shared/errors/http-errors.js';
import {
  BusinessEvent,
  logBusinessEvent,
} from '../../../../shared/logger/business-logger.js';
import type { KnowledgeArticle } from '../../domain/knowledge-article.entity.js';
import { buildUniqueSlug } from '../../domain/slugify.js';
import {
  KnowledgeArticlesRepository,
  knowledgeArticlesRepository,
} from '../../infrastructure/repositories/knowledge-articles.repository.js';
import type { CreateKnowledgeArticleInput } from '../inputs/knowledge-article.inputs.js';

export class CreateKnowledgeArticleUseCase {
  constructor(
    private readonly repository: KnowledgeArticlesRepository = knowledgeArticlesRepository,
  ) {}

  async execute(input: CreateKnowledgeArticleInput): Promise<KnowledgeArticle> {
    const existingSlugs = await this.repository.listSlugsByTenant(
      input.tenantId,
    );
    const slug = input.slug
      ? buildUniqueSlug(input.slug, existingSlugs)
      : buildUniqueSlug(input.title, existingSlugs);

    const article = await this.repository.create({
      tenantId: input.tenantId,
      title: input.title,
      slug,
      content: input.content,
      category: input.category,
      authorId: input.authorId,
    });

    logBusinessEvent(BusinessEvent.KNOWLEDGE_ARTICLE_CREATED, {
      tenantId: input.tenantId,
      articleId: article.id,
      authorId: input.authorId,
      slug: article.slug,
    });

    return article;
  }
}

export class FindKnowledgeArticleByIdUseCase {
  constructor(
    private readonly repository: KnowledgeArticlesRepository = knowledgeArticlesRepository,
  ) {}

  async execute(
    tenantId: string,
    articleId: string,
  ): Promise<KnowledgeArticle> {
    const article = await this.repository.findByIdAndTenant(
      articleId,
      tenantId,
    );

    if (!article) {
      throw new NotFoundError('Article not found');
    }

    return article;
  }
}

export const createKnowledgeArticleUseCase =
  new CreateKnowledgeArticleUseCase();
export const findKnowledgeArticleByIdUseCase =
  new FindKnowledgeArticleByIdUseCase();
