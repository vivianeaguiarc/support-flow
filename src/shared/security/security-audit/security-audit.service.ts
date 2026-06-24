import type { Prisma, SecurityAuditEvent } from '@prisma/client';

import { logger } from '../../logger/logger.js';
import {
  type RecordSecurityAuditInput,
  SecurityAuditRepository,
  securityAuditRepository as defaultSecurityAuditRepository,
} from './security-audit.repository.js';

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
  }
}

export const securityAuditService = new SecurityAuditService();
