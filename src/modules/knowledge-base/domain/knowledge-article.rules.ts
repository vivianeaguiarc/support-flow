import { AppError } from '../../../shared/errors/app-error.js';
import {
  KnowledgeArticleStatus,
  type KnowledgeArticleStatus as KnowledgeArticleStatusType,
} from './knowledge-article-enums.js';

export function assertArticleEditable(
  status: KnowledgeArticleStatusType,
): void {
  if (status === KnowledgeArticleStatus.ARCHIVED) {
    throw new AppError('Cannot edit an archived article', 400);
  }
}

export function assertArticlePublishable(
  status: KnowledgeArticleStatusType,
): void {
  if (status === KnowledgeArticleStatus.PUBLISHED) {
    throw new AppError('Article is already published', 400);
  }

  if (status === KnowledgeArticleStatus.ARCHIVED) {
    throw new AppError('Cannot publish an archived article', 400);
  }
}

export function assertArticleArchivable(
  status: KnowledgeArticleStatusType,
): void {
  if (status === KnowledgeArticleStatus.ARCHIVED) {
    throw new AppError('Article is already archived', 400);
  }
}
