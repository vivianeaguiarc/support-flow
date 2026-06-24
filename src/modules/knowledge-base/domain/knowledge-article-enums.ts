export const KnowledgeArticleStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type KnowledgeArticleStatus =
  (typeof KnowledgeArticleStatus)[keyof typeof KnowledgeArticleStatus];
