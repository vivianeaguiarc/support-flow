import {
  BusinessEvent,
  logBusinessEvent,
} from '../../../../shared/logger/business-logger.js';
import type { KnowledgeArticle } from '../../domain/knowledge-article.entity.js';
import { assertArticleArchivable } from '../../domain/knowledge-article.rules.js';
import {
  KnowledgeArticlesRepository,
  knowledgeArticlesRepository,
} from '../../infrastructure/repositories/knowledge-articles.repository.js';
import type { KnowledgeArticleByIdInput } from '../inputs/knowledge-article.inputs.js';
import {
  FindKnowledgeArticleByIdUseCase,
  findKnowledgeArticleByIdUseCase,
} from './create-knowledge-article.use-case.js';

export class ArchiveKnowledgeArticleUseCase {
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

    assertArticleArchivable(article.status);

    const archived = await this.repository.archive(article.id, input.tenantId);

    logBusinessEvent(BusinessEvent.KNOWLEDGE_ARTICLE_ARCHIVED, {
      tenantId: input.tenantId,
      articleId: article.id,
      actorId: input.actorId,
      slug: archived.slug,
    });

    return archived;
  }
}

export const archiveKnowledgeArticleUseCase =
  new ArchiveKnowledgeArticleUseCase();
