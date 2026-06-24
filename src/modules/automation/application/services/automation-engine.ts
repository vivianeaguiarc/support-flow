import {
  BusinessEvent,
  logBusinessEvent,
} from '../../../../shared/logger/business-logger.js';
import { logger } from '../../../../shared/logger/logger.js';
import { featureFlagService } from '../../../feature-flags/application/services/feature-flag.service.js';
import { FeatureFlagKey } from '../../../feature-flags/domain/feature-flag-keys.js';
import { queueProvider } from '../../../queues/queue-provider.js';
import type { AutomationEvent } from '../../domain/automation-event.js';
import { AutomationExecutionStatus } from '../../domain/automation-rule.entity.js';
import { evaluateAutomationConditions } from '../../domain/condition-evaluator.js';
import {
  AutomationRulesRepository,
  automationRulesRepository as defaultAutomationRulesRepository,
} from '../../infrastructure/repositories/automation-rules.repository.js';
import {
  AutomationActionExecutor,
  automationActionExecutor as defaultAutomationActionExecutor,
} from './automation-action-executor.js';

export class AutomationEngine {
  constructor(
    private readonly rulesRepository: AutomationRulesRepository = defaultAutomationRulesRepository,
    private readonly actionExecutor: AutomationActionExecutor = defaultAutomationActionExecutor,
  ) {}

  async processEvent(event: AutomationEvent): Promise<void> {
    await queueProvider.addAutomationJob({
      tenantId: event.tenantId,
      ticketId: event.ticketId,
      trigger: event.trigger,
      actorId: event.actorId,
      metadata: event.metadata,
      previousTicket: event.previousTicket,
    });
  }

  async processEventDirect(event: AutomationEvent): Promise<void> {
    const automationEnabled = await featureFlagService.isEnabled(
      FeatureFlagKey.AUTOMATION,
    );
    if (!automationEnabled) {
      return;
    }

    const rules = await this.rulesRepository.listActiveByTenantAndTrigger(
      event.tenantId,
      event.trigger,
    );

    if (rules.length === 0) {
      return;
    }

    for (const rule of rules) {
      const matched = evaluateAutomationConditions(
        rule.conditions,
        event.ticket,
      );

      if (!matched) {
        await this.rulesRepository.createExecution({
          tenantId: event.tenantId,
          ruleId: rule.id,
          ticketId: event.ticketId,
          trigger: event.trigger,
          status: AutomationExecutionStatus.SKIPPED,
          details: {
            reason: 'conditions_not_met',
          },
        });
        continue;
      }

      try {
        const actionResults = await this.actionExecutor.executeAll(
          rule.actions,
          event.ticket,
        );

        const failedActions = actionResults.filter((result) => !result.success);
        const status =
          failedActions.length > 0
            ? AutomationExecutionStatus.FAILED
            : AutomationExecutionStatus.COMPLETED;

        await this.rulesRepository.createExecution({
          tenantId: event.tenantId,
          ruleId: rule.id,
          ticketId: event.ticketId,
          trigger: event.trigger,
          status,
          details: {
            actionResults,
          },
        });

        logBusinessEvent(BusinessEvent.AUTOMATION_RULE_EXECUTED, {
          tenantId: event.tenantId,
          ruleId: rule.id,
          ticketId: event.ticketId,
          trigger: event.trigger,
          status,
        });

        logger.info(
          {
            tenantId: event.tenantId,
            ruleId: rule.id,
            ticketId: event.ticketId,
            trigger: event.trigger,
            status,
            actionCount: actionResults.length,
          },
          'automation.rule.executed',
        );
      } catch (error) {
        await this.rulesRepository.createExecution({
          tenantId: event.tenantId,
          ruleId: rule.id,
          ticketId: event.ticketId,
          trigger: event.trigger,
          status: AutomationExecutionStatus.FAILED,
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        logger.error(
          {
            err: error,
            tenantId: event.tenantId,
            ruleId: rule.id,
            ticketId: event.ticketId,
            trigger: event.trigger,
          },
          'automation.rule.failed',
        );

        throw error;
      }
    }
  }
}

export const automationEngine = new AutomationEngine();
