import {
  BusinessEvent,
  logBusinessEvent,
} from '../../../../shared/logger/business-logger.js';
import type { KnowledgeArticle } from '../../domain/knowledge-article.entity.js';
import { assertArticleEditable } from '../../domain/knowledge-article.rules.js';
import { buildUniqueSlug } from '../../domain/slugify.js';
import {
  KnowledgeArticlesRepository,
  knowledgeArticlesRepository,
} from '../../infrastructure/repositories/knowledge-articles.repository.js';
import type { UpdateKnowledgeArticleInput } from '../inputs/knowledge-article.inputs.js';
import {
  FindKnowledgeArticleByIdUseCase,
  findKnowledgeArticleByIdUseCase,
} from './create-knowledge-article.use-case.js';

export class UpdateKnowledgeArticleUseCase {
  constructor(
    private readonly repository: KnowledgeArticlesRepository = knowledgeArticlesRepository,
    private readonly findArticle: FindKnowledgeArticleByIdUseCase = findKnowledgeArticleByIdUseCase,
  ) {}

  async execute(input: UpdateKnowledgeArticleInput): Promise<KnowledgeArticle> {
    const article = await this.findArticle.execute(
      input.tenantId,
      input.articleId,
    );

    assertArticleEditable(article.status);

    let slug = input.slug;
    if (slug && slug !== article.slug) {
      const existingSlugs = await this.repository.listSlugsByTenant(
        input.tenantId,
      );
      slug = buildUniqueSlug(
        slug,
        existingSlugs.filter((value) => value !== article.slug),
      );
    }

    const updated = await this.repository.update(article.id, input.tenantId, {
      title: input.title,
      slug,
      content: input.content,
      category: input.category,
    });

    logBusinessEvent(BusinessEvent.KNOWLEDGE_ARTICLE_UPDATED, {
      tenantId: input.tenantId,
      articleId: article.id,
      actorId: input.actorId,
    });

    return updated;
  }
}

export const updateKnowledgeArticleUseCase =
  new UpdateKnowledgeArticleUseCase();
