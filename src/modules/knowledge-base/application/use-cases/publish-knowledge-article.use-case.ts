import {
  BusinessEvent,
  logBusinessEvent,
} from '../../../../shared/logger/business-logger.js';
import type { KnowledgeArticle } from '../../domain/knowledge-article.entity.js';
import { assertArticlePublishable } from '../../domain/knowledge-article.rules.js';
import {
  KnowledgeArticlesRepository,
  knowledgeArticlesRepository,
} from '../../infrastructure/repositories/knowledge-articles.repository.js';
import type { KnowledgeArticleByIdInput } from '../inputs/knowledge-article.inputs.js';
import {
  FindKnowledgeArticleByIdUseCase,
  findKnowledgeArticleByIdUseCase,
} from './create-knowledge-article.use-case.js';

export class PublishKnowledgeArticleUseCase {
  constructor(
    private readonly repository: KnowledgeArticlesRepository = knowledgeArticlesRepository,
    private readonly findArticle: FindKnowledgeArticleByIdUseCase = findKnowledgeArticleByIdUseCase,
  ) {}

  async execute(
    input: KnowledgeArticleByIdInput & { actorId: string },
  ): Promise<KnowledgeArticle> {
    const article = await this.findArticle.execute(
      input.tenantId,
      input.articleId,
    );

    assertArticlePublishable(article.status);

    const published = await this.repository.publish(article.id, input.tenantId);

    logBusinessEvent(BusinessEvent.KNOWLEDGE_ARTICLE_PUBLISHED, {
      tenantId: input.tenantId,
      articleId: article.id,
      actorId: input.actorId,
      slug: published.slug,
    });

    return published;
  }
}

export const publishKnowledgeArticleUseCase =
  new PublishKnowledgeArticleUseCase();
