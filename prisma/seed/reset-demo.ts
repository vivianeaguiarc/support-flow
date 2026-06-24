import type { PrismaClient } from '@prisma/client';

import { DEMO_TENANT_ID } from './config.js';

export async function resetDemoData(
  prisma: PrismaClient,
  tenantId: string = DEMO_TENANT_ID,
): Promise<void> {
  await prisma.$transaction([
    prisma.notification.deleteMany({ where: { tenantId } }),
    prisma.ticketAttachment.deleteMany({ where: { tenantId } }),
    prisma.ticketComment.deleteMany({ where: { tenantId } }),
    prisma.ticketHistory.deleteMany({ where: { tenantId } }),
    prisma.ticket.deleteMany({ where: { tenantId } }),
    prisma.refreshToken.deleteMany({ where: { tenantId } }),
    prisma.ticketCategory.deleteMany({ where: { tenantId } }),
    prisma.user.deleteMany({ where: { tenantId } }),
    prisma.customer.deleteMany({ where: { tenantId } }),
    prisma.tenant.deleteMany({ where: { id: tenantId } }),
  ]);
}
