import type { Request, Response } from 'express';

import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import { sendSuccess } from '../../../../shared/http/response/api-response.js';
import { auditAdminService } from '../../application/services/audit-admin.service.js';
import type { ListAuditLogsQueryDto } from '../dtos/list-audit-logs-query.dto.js';

class AuditAdminController {
  list = async (req: Request, res: Response): Promise<void> => {
    getAuthenticatedUser(req);

    const data = await auditAdminService.list(
      req.query as unknown as ListAuditLogsQueryDto,
    );

    sendSuccess(res, data, {
      message: 'Audit logs retrieved successfully',
    });
  };

  verify = async (req: Request, res: Response): Promise<void> => {
    getAuthenticatedUser(req);

    const data = await auditAdminService.verify();

    sendSuccess(res, data, {
      message: 'Audit chain verification completed',
    });
  };
}

export const auditAdminController = new AuditAdminController();
