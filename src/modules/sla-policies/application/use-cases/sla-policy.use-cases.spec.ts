import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../../shared/errors/http-errors.js';
import { AuditAction } from '../../../audit/domain/audit-actions.js';
import type { SlaPolicy } from '../../domain/sla-policy.entity.js';
import {
  CreateSlaPolicyUseCase,
  DeleteSlaPolicyUseCase,
  UpdateSlaPolicyUseCase,
} from './sla-policy.use-cases.js';

const basePolicy: SlaPolicy = {
  id: 'policy-1',
  tenantId: 'tenant-1',
  name: 'High priority',
  description: 'desc',
  priority: 'HIGH',
  firstResponseHours: 4,
  resolutionHours: 24,
  businessHoursOnly: false,
  isActive: true,
  categoryIds: ['cat-1'],
  createdById: 'admin-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('SLA policy use cases', () => {
  const repository = {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findById: vi.fn(),
    findByNameInTenant: vi.fn(),
    findExistingCategoryIds: vi.fn(),
    findAllByTenant: vi.fn(),
  };

  const audit = { record: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    repository.create.mockResolvedValue(basePolicy);
    repository.update.mockResolvedValue(basePolicy);
    repository.delete.mockResolvedValue(true);
    repository.findById.mockResolvedValue(basePolicy);
    repository.findByNameInTenant.mockResolvedValue(null);
    repository.findExistingCategoryIds.mockResolvedValue(['cat-1']);
  });

  describe('create', () => {
    it('creates a policy and records an audit log', async () => {
      const useCase = new CreateSlaPolicyUseCase(
        repository as never,
        audit as never,
      );

      const result = await useCase.execute({
        tenantId: 'tenant-1',
        actorId: 'admin-1',
        name: 'High priority',
        priority: 'HIGH',
        categoryIds: ['cat-1'],
        firstResponseHours: 4,
        resolutionHours: 24,
      });

      expect(result).toEqual(basePolicy);
      expect(repository.create).toHaveBeenCalledOnce();
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.SLA_POLICY_CREATED,
          entityId: basePolicy.id,
          organizationId: 'tenant-1',
          userId: 'admin-1',
        }),
      );
    });

    it('rejects unknown categories with a validation error', async () => {
      repository.findExistingCategoryIds.mockResolvedValue([]);
      const useCase = new CreateSlaPolicyUseCase(
        repository as never,
        audit as never,
      );

      await expect(
        useCase.execute({
          tenantId: 'tenant-1',
          actorId: 'admin-1',
          name: 'High priority',
          categoryIds: ['missing'],
          firstResponseHours: 4,
          resolutionHours: 24,
        }),
      ).rejects.toBeInstanceOf(ValidationError);

      expect(repository.create).not.toHaveBeenCalled();
      expect(audit.record).not.toHaveBeenCalled();
    });

    it('rejects duplicate names with a conflict error', async () => {
      repository.findByNameInTenant.mockResolvedValue(basePolicy);
      const useCase = new CreateSlaPolicyUseCase(
        repository as never,
        audit as never,
      );

      await expect(
        useCase.execute({
          tenantId: 'tenant-1',
          actorId: 'admin-1',
          name: 'High priority',
          firstResponseHours: 4,
          resolutionHours: 24,
        }),
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe('update', () => {
    it('throws when the policy does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      const useCase = new UpdateSlaPolicyUseCase(
        repository as never,
        audit as never,
      );

      await expect(
        useCase.execute({
          tenantId: 'tenant-1',
          actorId: 'admin-1',
          id: 'missing',
          isActive: false,
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('rejects when resolution becomes shorter than first response', async () => {
      const useCase = new UpdateSlaPolicyUseCase(
        repository as never,
        audit as never,
      );

      await expect(
        useCase.execute({
          tenantId: 'tenant-1',
          actorId: 'admin-1',
          id: 'policy-1',
          resolutionHours: 1,
        }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('updates and records old and new values in the audit log', async () => {
      repository.update.mockResolvedValue({
        ...basePolicy,
        resolutionHours: 16,
      });
      const useCase = new UpdateSlaPolicyUseCase(
        repository as never,
        audit as never,
      );

      await useCase.execute({
        tenantId: 'tenant-1',
        actorId: 'admin-1',
        id: 'policy-1',
        resolutionHours: 16,
      });

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.SLA_POLICY_UPDATED,
          oldValues: expect.objectContaining({ resolutionHours: 24 }),
          newValues: expect.objectContaining({ resolutionHours: 16 }),
        }),
      );
    });
  });

  describe('delete', () => {
    it('throws when the policy does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      const useCase = new DeleteSlaPolicyUseCase(
        repository as never,
        audit as never,
      );

      await expect(
        useCase.execute({
          tenantId: 'tenant-1',
          actorId: 'admin-1',
          id: 'missing',
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('deletes and records an audit log with the previous values', async () => {
      const useCase = new DeleteSlaPolicyUseCase(
        repository as never,
        audit as never,
      );

      await useCase.execute({
        tenantId: 'tenant-1',
        actorId: 'admin-1',
        id: 'policy-1',
      });

      expect(repository.delete).toHaveBeenCalledWith('tenant-1', 'policy-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.SLA_POLICY_DELETED,
          oldValues: expect.objectContaining({ name: 'High priority' }),
        }),
      );
    });
  });
});
