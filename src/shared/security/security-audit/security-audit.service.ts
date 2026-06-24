import type { Prisma, SecurityAuditEvent } from '@prisma/client';

import { auditLogService } from '../../../modules/audit/application/services/audit-log.service.js';
import {
  AuditAction,
  type AuditActionValue,
  AuditEntity,
  type AuditEntityValue,
} from '../../../modules/audit/domain/audit-actions.js';
import { logger } from '../../logger/logger.js';
import {
  type RecordSecurityAuditInput,
  SecurityAuditRepository,
  securityAuditRepository as defaultSecurityAuditRepository,
} from './security-audit.repository.js';

const AUDIT_EVENT_MAP: Record<
  SecurityAuditEvent,
  { action: AuditActionValue; entity: AuditEntityValue }
> = {
  LOGIN_FAILED: {
    action: AuditAction.AUTH_LOGIN_FAILED,
    entity: AuditEntity.AUTH,
  },
  LOGIN_LOCKED: {
    action: AuditAction.AUTH_LOGIN_LOCKED,
    entity: AuditEntity.AUTH,
  },
  ACCESS_DENIED: {
    action: AuditAction.ACCESS_DENIED,
    entity: AuditEntity.AUTHORIZATION,
  },
  API_KEY_CREATED: {
    action: AuditAction.API_KEY_CREATED,
    entity: AuditEntity.API_KEY,
  },
  API_KEY_REVOKED: {
    action: AuditAction.API_KEY_REVOKED,
    entity: AuditEntity.API_KEY,
  },
  USER_PERMISSION_ASSIGNED: {
    action: AuditAction.USER_PERMISSION_ASSIGNED,
    entity: AuditEntity.USER,
  },
  ROLE_CREATED: { action: AuditAction.ROLE_CREATED, entity: AuditEntity.ROLE },
  ROLE_UPDATED: { action: AuditAction.ROLE_UPDATED, entity: AuditEntity.ROLE },
  ROLE_DELETED: { action: AuditAction.ROLE_DELETED, entity: AuditEntity.ROLE },
  ROLE_PERMISSIONS_UPDATED: {
    action: AuditAction.ROLE_PERMISSIONS_UPDATED,
    entity: AuditEntity.ROLE,
  },
};

export type SecurityAuditContext = {
  tenantId?: string | null;
  userId?: string | null;
  actorId?: string | null;
  email?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export class SecurityAuditService {
  constructor(
    private readonly repository: SecurityAuditRepository = defaultSecurityAuditRepository,
  ) {}

  async record(
    event: SecurityAuditEvent,
    context: SecurityAuditContext = {},
  ): Promise<void> {
    const payload: RecordSecurityAuditInput = {
      event,
      tenantId: context.tenantId,
      userId: context.userId,
      actorId: context.actorId,
      email: context.email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: context.metadata,
    };

    try {
      await this.repository.record(payload);
    } catch (error: unknown) {
      logger.warn(
        { err: error, event },
        'Failed to persist security audit event',
      );
    }

    // Mirror into the immutable, hash-chained audit trail. Detached on purpose:
    // it must never delay or break the security-audit path. `auditLogService`
    // already swallows and logs its own failures.
    void this.mirrorToImmutableAudit(event, context);
  }

  private async mirrorToImmutableAudit(
    event: SecurityAuditEvent,
    context: SecurityAuditContext,
  ): Promise<void> {
    const mapping = AUDIT_EVENT_MAP[event];
    if (!mapping) {
      return;
    }

    const metadata: Record<string, unknown> = {
      ...(context.email ? { email: context.email } : {}),
      ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
      ...(context.userAgent ? { userAgent: context.userAgent } : {}),
      ...(context.metadata && typeof context.metadata === 'object'
        ? (context.metadata as Record<string, unknown>)
        : {}),
    };

    await auditLogService.record({
      organizationId: context.tenantId ?? null,
      userId: context.actorId ?? context.userId ?? null,
      action: mapping.action,
      entity: mapping.entity,
      entityId: this.resolveEntityId(metadata),
      metadata: metadata as Prisma.InputJsonValue,
    });
  }

  private resolveEntityId(metadata: Record<string, unknown>): string | null {
    for (const key of [
      'apiKeyId',
      'roleId',
      'userId',
      'targetUserId',
    ] as const) {
      const value = metadata[key];
      if (typeof value === 'string') {
        return value;
      }
    }
    return null;
  }
}

export const securityAuditService = new SecurityAuditService();
