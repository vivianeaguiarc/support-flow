import type { Prisma, SecurityAuditEvent } from '@prisma/client';

import { prisma } from '../../database/prisma.js';

export type RecordSecurityAuditInput = {
  event: SecurityAuditEvent;
  tenantId?: string | null;
  userId?: string | null;
  actorId?: string | null;
  email?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export class SecurityAuditRepository {
  async record(input: RecordSecurityAuditInput): Promise<void> {
    await prisma.securityAuditLog.create({
      data: {
        event: input.event,
        tenantId: input.tenantId ?? undefined,
        userId: input.userId ?? undefined,
        actorId: input.actorId ?? undefined,
        email: input.email ?? undefined,
        ipAddress: input.ipAddress ?? undefined,
        userAgent: input.userAgent ?? undefined,
        metadata: input.metadata,
      },
    });
  }
}

export const securityAuditRepository = new SecurityAuditRepository();
