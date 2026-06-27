import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../../shared/errors/http-errors.js';
import {
  BusinessEvent,
  logBusinessEvent,
} from '../../../../shared/logger/business-logger.js';
import type { AuditLogService } from '../../../audit/application/services/audit-log.service.js';
import { auditLogService } from '../../../audit/application/services/audit-log.service.js';
import {
  AuditAction,
  AuditEntity,
} from '../../../audit/domain/audit-actions.js';
import type { TicketPriority } from '../../../tickets/domain/ticket-enums.js';
import type { SlaPolicy } from '../../domain/sla-policy.entity.js';
import {
  SlaPoliciesRepository,
  slaPoliciesRepository,
} from '../../infrastructure/repositories/sla-policies.repository.js';

export type CreateSlaPolicyInput = {
  tenantId: string;
  actorId: string;
  name: string;
  description?: string | null;
  priority?: TicketPriority | null;
  categoryIds?: string[];
  firstResponseHours: number;
  resolutionHours: number;
  businessHoursOnly?: boolean;
  isActive?: boolean;
};

export type UpdateSlaPolicyInput = {
  tenantId: string;
  actorId: string;
  id: string;
  name?: string;
  description?: string | null;
  priority?: TicketPriority | null;
  categoryIds?: string[];
  firstResponseHours?: number;
  resolutionHours?: number;
  businessHoursOnly?: boolean;
  isActive?: boolean;
};

export type ListSlaPoliciesInput = {
  tenantId: string;
  isActive?: boolean;
  priority?: TicketPriority;
};

async function assertCategoriesBelongToTenant(
  repository: SlaPoliciesRepository,
  tenantId: string,
  categoryIds: string[],
): Promise<void> {
  if (categoryIds.length === 0) {
    return;
  }

  const uniqueIds = [...new Set(categoryIds)];
  const existing = await repository.findExistingCategoryIds(
    tenantId,
    uniqueIds,
  );

  if (existing.length !== uniqueIds.length) {
    const missing = uniqueIds.filter((id) => !existing.includes(id));
    throw new ValidationError('One or more categories were not found', [
      {
        path: 'categoryIds',
        message: `Unknown category IDs: ${missing.join(', ')}`,
      },
    ]);
  }
}

function auditValues(policy: SlaPolicy): Record<string, unknown> {
  return {
    name: policy.name,
    description: policy.description,
    priority: policy.priority,
    firstResponseHours: policy.firstResponseHours,
    resolutionHours: policy.resolutionHours,
    businessHoursOnly: policy.businessHoursOnly,
    isActive: policy.isActive,
    categoryIds: policy.categoryIds,
  };
}

export class CreateSlaPolicyUseCase {
  constructor(
    private readonly repository: SlaPoliciesRepository = slaPoliciesRepository,
    private readonly audit: AuditLogService = auditLogService,
  ) {}

  async execute(input: CreateSlaPolicyInput): Promise<SlaPolicy> {
    const categoryIds = input.categoryIds ?? [];
    await assertCategoriesBelongToTenant(
      this.repository,
      input.tenantId,
      categoryIds,
    );

    const duplicate = await this.repository.findByNameInTenant(
      input.tenantId,
      input.name,
    );

    if (duplicate) {
      throw new ConflictError('An SLA policy with this name already exists');
    }

    const policy = await this.repository.create({
      tenantId: input.tenantId,
      name: input.name,
      description: input.description ?? null,
      priority: input.priority ?? null,
      firstResponseHours: input.firstResponseHours,
      resolutionHours: input.resolutionHours,
      businessHoursOnly: input.businessHoursOnly ?? false,
      isActive: input.isActive ?? true,
      categoryIds,
      createdById: input.actorId,
    });

    logBusinessEvent(BusinessEvent.SLA_POLICY_CREATED, {
      tenantId: input.tenantId,
      slaPolicyId: policy.id,
      actorId: input.actorId,
    });

    await this.audit.record({
      organizationId: input.tenantId,
      userId: input.actorId,
      action: AuditAction.SLA_POLICY_CREATED,
      entity: AuditEntity.SLA_POLICY,
      entityId: policy.id,
      newValues: auditValues(policy),
    });

    return policy;
  }
}

export class UpdateSlaPolicyUseCase {
  constructor(
    private readonly repository: SlaPoliciesRepository = slaPoliciesRepository,
    private readonly audit: AuditLogService = auditLogService,
  ) {}

  async execute(input: UpdateSlaPolicyInput): Promise<SlaPolicy> {
    const existing = await this.repository.findById(input.tenantId, input.id);

    if (!existing) {
      throw new NotFoundError('SLA policy not found');
    }

    if (input.categoryIds !== undefined) {
      await assertCategoriesBelongToTenant(
        this.repository,
        input.tenantId,
        input.categoryIds,
      );
    }

    if (input.name !== undefined && input.name !== existing.name) {
      const duplicate = await this.repository.findByNameInTenant(
        input.tenantId,
        input.name,
      );

      if (duplicate && duplicate.id !== existing.id) {
        throw new ConflictError('An SLA policy with this name already exists');
      }
    }

    const resolvedFirstResponse =
      input.firstResponseHours ?? existing.firstResponseHours;
    const resolvedResolution =
      input.resolutionHours ?? existing.resolutionHours;

    if (resolvedResolution < resolvedFirstResponse) {
      throw new ValidationError(
        'resolutionHours must be greater than or equal to firstResponseHours',
        [
          {
            path: 'resolutionHours',
            message:
              'resolutionHours must be greater than or equal to firstResponseHours',
          },
        ],
      );
    }

    const updated = await this.repository.update(input.tenantId, input.id, {
      name: input.name,
      description: input.description,
      priority: input.priority,
      firstResponseHours: input.firstResponseHours,
      resolutionHours: input.resolutionHours,
      businessHoursOnly: input.businessHoursOnly,
      isActive: input.isActive,
      categoryIds: input.categoryIds,
    });

    if (!updated) {
      throw new NotFoundError('SLA policy not found');
    }

    logBusinessEvent(BusinessEvent.SLA_POLICY_UPDATED, {
      tenantId: input.tenantId,
      slaPolicyId: updated.id,
      actorId: input.actorId,
    });

    await this.audit.record({
      organizationId: input.tenantId,
      userId: input.actorId,
      action: AuditAction.SLA_POLICY_UPDATED,
      entity: AuditEntity.SLA_POLICY,
      entityId: updated.id,
      oldValues: auditValues(existing),
      newValues: auditValues(updated),
    });

    return updated;
  }
}

export class DeleteSlaPolicyUseCase {
  constructor(
    private readonly repository: SlaPoliciesRepository = slaPoliciesRepository,
    private readonly audit: AuditLogService = auditLogService,
  ) {}

  async execute(input: {
    tenantId: string;
    actorId: string;
    id: string;
  }): Promise<void> {
    const existing = await this.repository.findById(input.tenantId, input.id);

    if (!existing) {
      throw new NotFoundError('SLA policy not found');
    }

    await this.repository.delete(input.tenantId, input.id);

    logBusinessEvent(BusinessEvent.SLA_POLICY_DELETED, {
      tenantId: input.tenantId,
      slaPolicyId: input.id,
      actorId: input.actorId,
    });

    await this.audit.record({
      organizationId: input.tenantId,
      userId: input.actorId,
      action: AuditAction.SLA_POLICY_DELETED,
      entity: AuditEntity.SLA_POLICY,
      entityId: input.id,
      oldValues: auditValues(existing),
    });
  }
}

export class ListSlaPoliciesUseCase {
  constructor(
    private readonly repository: SlaPoliciesRepository = slaPoliciesRepository,
  ) {}

  execute(input: ListSlaPoliciesInput): Promise<SlaPolicy[]> {
    return this.repository.findAllByTenant({
      tenantId: input.tenantId,
      isActive: input.isActive,
      priority: input.priority,
    });
  }
}

export class GetSlaPolicyUseCase {
  constructor(
    private readonly repository: SlaPoliciesRepository = slaPoliciesRepository,
  ) {}

  async execute(input: { tenantId: string; id: string }): Promise<SlaPolicy> {
    const policy = await this.repository.findById(input.tenantId, input.id);

    if (!policy) {
      throw new NotFoundError('SLA policy not found');
    }

    return policy;
  }
}

export const createSlaPolicyUseCase = new CreateSlaPolicyUseCase();
export const updateSlaPolicyUseCase = new UpdateSlaPolicyUseCase();
export const deleteSlaPolicyUseCase = new DeleteSlaPolicyUseCase();
export const listSlaPoliciesUseCase = new ListSlaPoliciesUseCase();
export const getSlaPolicyUseCase = new GetSlaPolicyUseCase();
