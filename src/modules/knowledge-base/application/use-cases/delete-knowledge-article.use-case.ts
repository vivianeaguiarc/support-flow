import {
  BusinessEvent,
  logBusinessEvent,
} from '../../../../shared/logger/business-logger.js';
import {
  KnowledgeArticlesRepository,
  knowledgeArticlesRepository,
} from '../../infrastructure/repositories/knowledge-articles.repository.js';
import type { KnowledgeArticleByIdInput } from '../inputs/knowledge-article.inputs.js';
import {
  FindKnowledgeArticleByIdUseCase,
  findKnowledgeArticleByIdUseCase,
} from './create-knowledge-article.use-case.js';

export class DeleteKnowledgeArticleUseCase {
  constructor(
    private readonly repository: KnowledgeArticlesRepository = knowledgeArticlesRepository,
    private readonly findArticle: FindKnowledgeArticleByIdUseCase = findKnowledgeArticleByIdUseCase,
  ) {}

  async execute(
    input: KnowledgeArticleByIdInput & { actorId: string },
  ): Promise<void> {
    const article = await this.findArticle.execute(
      input.tenantId,
      input.articleId,
    );

    await this.repository.delete(article.id, input.tenantId);

    logBusinessEvent(BusinessEvent.KNOWLEDGE_ARTICLE_DELETED, {
      tenantId: input.tenantId,
      articleId: article.id,
      actorId: input.actorId,
      slug: article.slug,
    });
  }
}

export const deleteKnowledgeArticleUseCase =
  new DeleteKnowledgeArticleUseCase();
