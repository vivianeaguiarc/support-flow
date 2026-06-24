import { NotFoundError } from '../../../shared/errors/http-errors.js';
import type { AuthenticatedUser } from '../../../shared/types/authenticated-user.js';
import { UserRole } from '../../../shared/types/user-role.js';
import {
  KnowledgeArticleStatus,
  type KnowledgeArticleStatus as KnowledgeArticleStatusType,
} from './knowledge-article-enums.js';

export function canManageKnowledgeArticles(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPERVISOR;
}

export function resolveListStatusFilter(
  authUser: AuthenticatedUser | undefined,
  requestedStatus?: KnowledgeArticleStatusType,
): KnowledgeArticleStatusType | undefined {
  if (!authUser || !canManageKnowledgeArticles(authUser.role)) {
    return KnowledgeArticleStatus.PUBLISHED;
  }

  return requestedStatus;
}

export function assertArticleReadable(
  article: { status: KnowledgeArticleStatusType },
  authUser?: AuthenticatedUser,
): void {
  if (article.status === KnowledgeArticleStatus.PUBLISHED) {
    return;
  }

  if (authUser && canManageKnowledgeArticles(authUser.role)) {
    return;
  }

  throw new NotFoundError('Article not found');
}
