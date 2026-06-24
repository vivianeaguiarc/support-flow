import { NotFoundError } from '../../../../shared/errors/http-errors.js';
import {
  BusinessEvent,
  logBusinessEvent,
} from '../../../../shared/logger/business-logger.js';
import type { AuthenticatedUser } from '../../../../shared/types/authenticated-user.js';
import { auditLogService } from '../../../audit/application/services/audit-log.service.js';
import {
  AuditAction,
  AuditEntity,
} from '../../../audit/domain/audit-actions.js';
import type { AutomationRule } from '../../domain/automation-rule.entity.js';
import {
  AutomationRulesRepository,
  automationRulesRepository as defaultAutomationRulesRepository,
} from '../../infrastructure/repositories/automation-rules.repository.js';
import type {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
} from '../../presentation/dtos/automation-rule.dto.js';

export class AutomationRulesService {
  constructor(
    private readonly repository: AutomationRulesRepository = defaultAutomationRulesRepository,
  ) {}

  async create(
    authUser: AuthenticatedUser,
    input: CreateAutomationRuleDto,
  ): Promise<AutomationRule> {
    const rule = await this.repository.create({
      tenantId: authUser.tenantId,
      name: input.name,
      description: input.description,
      active: input.active,
      trigger: input.trigger,
      conditions: input.conditions,
      actions: input.actions,
    });

    logBusinessEvent(BusinessEvent.AUTOMATION_RULE_CREATED, {
      tenantId: authUser.tenantId,
      ruleId: rule.id,
      actorId: authUser.id,
      trigger: rule.trigger,
    });

    await auditLogService.record({
      organizationId: authUser.tenantId,
      userId: authUser.id,
      action: AuditAction.AUTOMATION_RULE_CREATED,
      entity: AuditEntity.AUTOMATION_RULE,
      entityId: rule.id,
      newValues: {
        name: rule.name,
        trigger: rule.trigger,
        active: rule.active,
      },
    });

    return rule;
  }

  async list(authUser: AuthenticatedUser): Promise<AutomationRule[]> {
    return this.repository.listByTenant(authUser.tenantId);
  }

  async update(
    authUser: AuthenticatedUser,
    id: string,
    input: UpdateAutomationRuleDto,
  ): Promise<AutomationRule> {
    const existing = await this.repository.findByIdAndTenant(
      id,
      authUser.tenantId,
    );

    if (!existing) {
      throw new NotFoundError('Automation rule not found');
    }

    const rule = await this.repository.update(id, authUser.tenantId, input);

    logBusinessEvent(BusinessEvent.AUTOMATION_RULE_UPDATED, {
      tenantId: authUser.tenantId,
      ruleId: rule.id,
      actorId: authUser.id,
    });

    await auditLogService.record({
      organizationId: authUser.tenantId,
      userId: authUser.id,
      action: AuditAction.AUTOMATION_RULE_UPDATED,
      entity: AuditEntity.AUTOMATION_RULE,
      entityId: rule.id,
      newValues: input as Record<string, unknown>,
    });

    return rule;
  }

  async delete(authUser: AuthenticatedUser, id: string): Promise<void> {
    const existing = await this.repository.findByIdAndTenant(
      id,
      authUser.tenantId,
    );

    if (!existing) {
      throw new NotFoundError('Automation rule not found');
    }

    await this.repository.delete(id, authUser.tenantId);

    logBusinessEvent(BusinessEvent.AUTOMATION_RULE_DELETED, {
      tenantId: authUser.tenantId,
      ruleId: id,
      actorId: authUser.id,
    });

    await auditLogService.record({
      organizationId: authUser.tenantId,
      userId: authUser.id,
      action: AuditAction.AUTOMATION_RULE_DELETED,
      entity: AuditEntity.AUTOMATION_RULE,
      entityId: id,
      oldValues: { name: existing.name, trigger: existing.trigger },
    });
  }
}

export const automationRulesService = new AutomationRulesService();
