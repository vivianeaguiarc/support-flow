import type { Prisma, SlaPolicy as PrismaSlaPolicy } from '@prisma/client';

import { prisma } from '../../../../shared/database/prisma.js';
import type { TicketPriority } from '../../../tickets/domain/ticket-enums.js';
import type { SlaPolicy } from '../../domain/sla-policy.entity.js';

export type CreateSlaPolicyData = {
  tenantId: string;
  name: string;
  description?: string | null;
  priority?: TicketPriority | null;
  firstResponseHours: number;
  resolutionHours: number;
  businessHoursOnly?: boolean;
  isActive?: boolean;
  categoryIds: string[];
  createdById: string | null;
};

export type UpdateSlaPolicyData = {
  name?: string;
  description?: string | null;
  priority?: TicketPriority | null;
  firstResponseHours?: number;
  resolutionHours?: number;
  businessHoursOnly?: boolean;
  isActive?: boolean;
  categoryIds?: string[];
};

export type ListSlaPoliciesFilters = {
  tenantId: string;
  isActive?: boolean;
  priority?: TicketPriority;
};

type SlaPolicyRecord = PrismaSlaPolicy & {
  categories: { categoryId: string }[];
};

function mapPolicy(record: SlaPolicyRecord): SlaPolicy {
  return {
    id: record.id,
    tenantId: record.tenantId,
    name: record.name,
    description: record.description,
    priority: record.priority as TicketPriority | null,
    firstResponseHours: record.firstResponseHours,
    resolutionHours: record.resolutionHours,
    businessHoursOnly: record.businessHoursOnly,
    isActive: record.isActive,
    categoryIds: record.categories.map((category) => category.categoryId),
    createdById: record.createdById,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

const includeCategories = {
  categories: { select: { categoryId: true } },
} satisfies Prisma.SlaPolicyInclude;

export class SlaPoliciesRepository {
  async create(input: CreateSlaPolicyData): Promise<SlaPolicy> {
    const record = await prisma.slaPolicy.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        description: input.description ?? null,
        priority: input.priority ?? null,
        firstResponseHours: input.firstResponseHours,
        resolutionHours: input.resolutionHours,
        businessHoursOnly: input.businessHoursOnly ?? false,
        isActive: input.isActive ?? true,
        createdById: input.createdById,
        categories: {
          create: input.categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
      include: includeCategories,
    });

    return mapPolicy(record);
  }

  async findAllByTenant(filters: ListSlaPoliciesFilters): Promise<SlaPolicy[]> {
    const records = await prisma.slaPolicy.findMany({
      where: {
        tenantId: filters.tenantId,
        ...(filters.isActive !== undefined
          ? { isActive: filters.isActive }
          : {}),
        ...(filters.priority !== undefined
          ? { priority: filters.priority }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: includeCategories,
    });

    return records.map(mapPolicy);
  }

  async findById(tenantId: string, id: string): Promise<SlaPolicy | null> {
    const record = await prisma.slaPolicy.findFirst({
      where: { id, tenantId },
      include: includeCategories,
    });

    return record ? mapPolicy(record) : null;
  }

  async findByNameInTenant(
    tenantId: string,
    name: string,
  ): Promise<SlaPolicy | null> {
    const record = await prisma.slaPolicy.findFirst({
      where: { tenantId, name },
      include: includeCategories,
    });

    return record ? mapPolicy(record) : null;
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateSlaPolicyData,
  ): Promise<SlaPolicy | null> {
    const existing = await prisma.slaPolicy.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    const record = await prisma.$transaction(async (tx) => {
      if (input.categoryIds !== undefined) {
        await tx.slaPolicyCategory.deleteMany({ where: { slaPolicyId: id } });
        if (input.categoryIds.length > 0) {
          await tx.slaPolicyCategory.createMany({
            data: input.categoryIds.map((categoryId) => ({
              slaPolicyId: id,
              categoryId,
            })),
          });
        }
      }

      return tx.slaPolicy.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          ...(input.priority !== undefined ? { priority: input.priority } : {}),
          ...(input.firstResponseHours !== undefined
            ? { firstResponseHours: input.firstResponseHours }
            : {}),
          ...(input.resolutionHours !== undefined
            ? { resolutionHours: input.resolutionHours }
            : {}),
          ...(input.businessHoursOnly !== undefined
            ? { businessHoursOnly: input.businessHoursOnly }
            : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
        include: includeCategories,
      });
    });

    return mapPolicy(record);
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const existing = await prisma.slaPolicy.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    await prisma.slaPolicy.delete({ where: { id } });
    return true;
  }

  async findExistingCategoryIds(
    tenantId: string,
    categoryIds: string[],
  ): Promise<string[]> {
    if (categoryIds.length === 0) {
      return [];
    }

    const categories = await prisma.ticketCategory.findMany({
      where: { tenantId, id: { in: categoryIds } },
      select: { id: true },
    });

    return categories.map((category) => category.id);
  }
}

export const slaPoliciesRepository = new SlaPoliciesRepository();
