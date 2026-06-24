import type { KnowledgeArticleStatus } from './knowledge-article-enums.js';

export type KnowledgeArticleAuthor = {
  id: string;
  name: string;
};

export type KnowledgeArticle = {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  content: string;
  status: KnowledgeArticleStatus;
  category: string;
  authorId: string;
  author?: KnowledgeArticleAuthor;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
