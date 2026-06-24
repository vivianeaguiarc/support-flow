export type CreateKnowledgeArticleInput = {
  tenantId: string;
  authorId: string;
  title: string;
  slug?: string;
  content: string;
  category: string;
};

export type UpdateKnowledgeArticleInput = {
  tenantId: string;
  articleId: string;
  actorId: string;
  title?: string;
  slug?: string;
  content?: string;
  category?: string;
};

export type KnowledgeArticleByIdInput = {
  tenantId: string;
  articleId: string;
};

export type KnowledgeArticleBySlugInput = {
  tenantId: string;
  slug: string;
};

export type ListKnowledgeArticlesInput = {
  tenantId: string;
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
};
