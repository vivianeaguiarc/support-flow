import { assertCanManageKnowledgeArticles } from '../../../../shared/security/rbac.js';
import type { AuthenticatedUser } from '../../../../shared/types/authenticated-user.js';
import type { KnowledgeArticle } from '../../domain/knowledge-article.entity.js';
import type {
  CreateKnowledgeArticleInput,
  ListKnowledgeArticlesInput,
  UpdateKnowledgeArticleInput,
} from '../inputs/knowledge-article.inputs.js';
import {
  ArchiveKnowledgeArticleUseCase,
  archiveKnowledgeArticleUseCase,
} from '../use-cases/archive-knowledge-article.use-case.js';
import {
  CreateKnowledgeArticleUseCase,
  createKnowledgeArticleUseCase,
} from '../use-cases/create-knowledge-article.use-case.js';
import {
  DeleteKnowledgeArticleUseCase,
  deleteKnowledgeArticleUseCase,
} from '../use-cases/delete-knowledge-article.use-case.js';
import {
  GetKnowledgeArticleBySlugUseCase,
  getKnowledgeArticleBySlugUseCase,
  ListKnowledgeArticlesUseCase,
  listKnowledgeArticlesUseCase,
} from '../use-cases/list-knowledge-articles.use-case.js';
import {
  PublishKnowledgeArticleUseCase,
  publishKnowledgeArticleUseCase,
} from '../use-cases/publish-knowledge-article.use-case.js';
import {
  UpdateKnowledgeArticleUseCase,
  updateKnowledgeArticleUseCase,
} from '../use-cases/update-knowledge-article.use-case.js';

export class KnowledgeArticlesService {
  constructor(
    private readonly createArticle: CreateKnowledgeArticleUseCase = createKnowledgeArticleUseCase,
    private readonly updateArticle: UpdateKnowledgeArticleUseCase = updateKnowledgeArticleUseCase,
    private readonly deleteArticle: DeleteKnowledgeArticleUseCase = deleteKnowledgeArticleUseCase,
    private readonly publishArticle: PublishKnowledgeArticleUseCase = publishKnowledgeArticleUseCase,
    private readonly archiveArticle: ArchiveKnowledgeArticleUseCase = archiveKnowledgeArticleUseCase,
    private readonly listArticles: ListKnowledgeArticlesUseCase = listKnowledgeArticlesUseCase,
    private readonly getArticleBySlug: GetKnowledgeArticleBySlugUseCase = getKnowledgeArticleBySlugUseCase,
  ) {}

  create(
    authUser: AuthenticatedUser,
    input: Omit<CreateKnowledgeArticleInput, 'tenantId' | 'authorId'>,
  ): Promise<KnowledgeArticle> {
    assertCanManageKnowledgeArticles(authUser);

    return this.createArticle.execute({
      ...input,
      tenantId: authUser.tenantId,
      authorId: authUser.id,
    });
  }

  update(
    authUser: AuthenticatedUser,
    input: Omit<UpdateKnowledgeArticleInput, 'tenantId' | 'actorId'>,
  ): Promise<KnowledgeArticle> {
    assertCanManageKnowledgeArticles(authUser);

    return this.updateArticle.execute({
      ...input,
      tenantId: authUser.tenantId,
      actorId: authUser.id,
    });
  }

  delete(authUser: AuthenticatedUser, articleId: string): Promise<void> {
    assertCanManageKnowledgeArticles(authUser);

    return this.deleteArticle.execute({
      tenantId: authUser.tenantId,
      articleId,
      actorId: authUser.id,
    });
  }

  publish(
    authUser: AuthenticatedUser,
    articleId: string,
  ): Promise<KnowledgeArticle> {
    assertCanManageKnowledgeArticles(authUser);

    return this.publishArticle.execute({
      tenantId: authUser.tenantId,
      articleId,
      actorId: authUser.id,
    });
  }

  archive(
    authUser: AuthenticatedUser,
    articleId: string,
  ): Promise<KnowledgeArticle> {
    assertCanManageKnowledgeArticles(authUser);

    return this.archiveArticle.execute({
      tenantId: authUser.tenantId,
      articleId,
      actorId: authUser.id,
    });
  }

  list(
    tenantId: string,
    input: Omit<ListKnowledgeArticlesInput, 'tenantId'>,
    authUser?: AuthenticatedUser,
  ) {
    return this.listArticles.execute(
      {
        ...input,
        tenantId,
      },
      authUser,
    );
  }

  getBySlug(tenantId: string, slug: string, authUser?: AuthenticatedUser) {
    return this.getArticleBySlug.execute(tenantId, slug, authUser);
  }
}

export const knowledgeArticlesService = new KnowledgeArticlesService();
