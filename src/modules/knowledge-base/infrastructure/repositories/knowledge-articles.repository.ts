import type { KnowledgeArticle as PrismaKnowledgeArticle } from '@prisma/client';

import { prisma } from '../../../../shared/database/prisma.js';
import { NotFoundError } from '../../../../shared/errors/http-errors.js';
import { resolvePagination } from '../../../../shared/http/pagination/pagination.js';
import type { KnowledgeArticle } from '../../domain/knowledge-article.entity.js';
import { KnowledgeArticleStatus } from '../../domain/knowledge-article-enums.js';
import type { KnowledgeArticleListFilters } from '../../domain/knowledge-article-list-filters.js';
import { buildKnowledgeArticleListWhere } from './build-knowledge-article-list-where.js';

const authorSelect = {
  id: true,
  name: true,
} as const;

type ArticleWithAuthor = PrismaKnowledgeArticle & {
  author: { id: string; name: string };
};

function toKnowledgeArticle(record: ArticleWithAuthor): KnowledgeArticle {
  return {
    id: record.id,
    tenantId: record.tenantId,
    title: record.title,
    slug: record.slug,
    content: record.content,
    status: record.status,
    category: record.category,
    authorId: record.authorId,
    author: record.author,
    publishedAt: record.publishedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export type CreateKnowledgeArticleData = {
  tenantId: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  authorId: string;
  status?: typeof KnowledgeArticleStatus.DRAFT;
};

export type UpdateKnowledgeArticleData = {
  title?: string;
  slug?: string;
  content?: string;
  category?: string;
};

export class KnowledgeArticlesRepository {
  async findByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<KnowledgeArticle | null> {
    const record = await prisma.knowledgeArticle.findFirst({
      where: { id, tenantId },
      include: { author: { select: authorSelect } },
    });

    return record ? toKnowledgeArticle(record) : null;
  }

  async findBySlugAndTenant(
    slug: string,
    tenantId: string,
  ): Promise<KnowledgeArticle | null> {
    const record = await prisma.knowledgeArticle.findFirst({
      where: { tenantId, slug },
      include: { author: { select: authorSelect } },
    });

    return record ? toKnowledgeArticle(record) : null;
  }

  async listSlugsByTenant(tenantId: string): Promise<string[]> {
    const records = await prisma.knowledgeArticle.findMany({
      where: { tenantId },
      select: { slug: true },
    });

    return records.map((record) => record.slug);
  }

  async listWithFilters(filters: KnowledgeArticleListFilters): Promise<{
    data: KnowledgeArticle[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit } = resolvePagination(filters.page, filters.limit);
    const where = buildKnowledgeArticleListWhere(filters);

    const [records, total] = await Promise.all([
      prisma.knowledgeArticle.findMany({
        where,
        include: { author: { select: authorSelect } },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.knowledgeArticle.count({ where }),
    ]);

    return {
      data: records.map(toKnowledgeArticle),
      total,
      page,
      limit,
    };
  }

  async create(data: CreateKnowledgeArticleData): Promise<KnowledgeArticle> {
    const record = await prisma.knowledgeArticle.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        slug: data.slug,
        content: data.content,
        category: data.category,
        authorId: data.authorId,
        status: data.status ?? KnowledgeArticleStatus.DRAFT,
      },
      include: { author: { select: authorSelect } },
    });

    return toKnowledgeArticle(record);
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateKnowledgeArticleData,
  ): Promise<KnowledgeArticle> {
    const existing = await prisma.knowledgeArticle.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundError('Article not found');
    }

    const record = await prisma.knowledgeArticle.update({
      where: { id },
      data,
      include: { author: { select: authorSelect } },
    });

    return toKnowledgeArticle(record);
  }

  async publish(id: string, tenantId: string): Promise<KnowledgeArticle> {
    const existing = await prisma.knowledgeArticle.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundError('Article not found');
    }

    const record = await prisma.knowledgeArticle.update({
      where: { id },
      data: {
        status: KnowledgeArticleStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: { author: { select: authorSelect } },
    });

    return toKnowledgeArticle(record);
  }

  async archive(id: string, tenantId: string): Promise<KnowledgeArticle> {
    const existing = await prisma.knowledgeArticle.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundError('Article not found');
    }

    const record = await prisma.knowledgeArticle.update({
      where: { id },
      data: {
        status: KnowledgeArticleStatus.ARCHIVED,
      },
      include: { author: { select: authorSelect } },
    });

    return toKnowledgeArticle(record);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const result = await prisma.knowledgeArticle.deleteMany({
      where: { id, tenantId },
    });

    if (result.count === 0) {
      throw new NotFoundError('Article not found');
    }
  }
}

export const knowledgeArticlesRepository = new KnowledgeArticlesRepository();
