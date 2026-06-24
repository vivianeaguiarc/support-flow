import type { Request, Response } from 'express';

import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import { sendSuccess } from '../../../../shared/http/response/api-response.js';
import { outboxAdminService } from '../../application/services/outbox-admin.service.js';
import type { ListOutboxQueryDto } from '../dtos/list-outbox-query.dto.js';

class OutboxAdminController {
  list = async (req: Request, res: Response): Promise<void> => {
    getAuthenticatedUser(req);

    const data = await outboxAdminService.list(
      req.query as unknown as ListOutboxQueryDto,
    );

    sendSuccess(res, data, { message: 'Outbox events retrieved successfully' });
  };

  metrics = async (req: Request, res: Response): Promise<void> => {
    getAuthenticatedUser(req);

    const data = await outboxAdminService.metrics();
    sendSuccess(res, data, {
      message: 'Outbox metrics retrieved successfully',
    });
  };
}

export const outboxAdminController = new OutboxAdminController();
