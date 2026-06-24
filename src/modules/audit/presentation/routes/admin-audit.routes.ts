import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { requirePermission } from '../../../../shared/http/middlewares/require-permission.js';
import { validateRequest } from '../../../../shared/http/middlewares/validate-request.js';
import { PermissionKey } from '../../../../shared/security/permissions.js';
import { auditAdminController } from '../controllers/audit-admin.controller.js';
import { listAuditLogsQuerySchema } from '../dtos/list-audit-logs-query.dto.js';

export const adminAuditRouter = Router();

const auditReaders = [
  authenticate,
  requirePermission(PermissionKey.AUDIT_READ),
] as const;

adminAuditRouter.get(
  '/',
  ...auditReaders,
  validateRequest({ query: listAuditLogsQuerySchema }),
  auditAdminController.list,
);

adminAuditRouter.get('/verify', ...auditReaders, auditAdminController.verify);
