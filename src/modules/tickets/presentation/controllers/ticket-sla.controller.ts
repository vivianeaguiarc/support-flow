import type { NextFunction, Request, Response } from 'express';

import { DEFAULT_TENANT_ID } from '../../../../shared/constants/tenant.js';
import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import { buildPaginationMeta } from '../../../../shared/http/pagination/pagination.js';
import {
  sendPaginatedSuccess,
  sendSuccess,
} from '../../../../shared/http/response/api-response.js';
import {
  TicketSlaService,
  ticketSlaService,
} from '../../application/services/ticket-sla.service.js';
import type { ListBreachedSlaTicketsQueryDto } from '../dtos/list-breached-sla-tickets-query.dto.js';

export class TicketSlaController {
  constructor(private readonly service: TicketSlaService = ticketSlaService) {}

  summary = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authUser = getAuthenticatedUser(req);
      const tenantId = authUser.tenantId ?? DEFAULT_TENANT_ID;
      const summary = await this.service.getSummaryForTenant(tenantId);

      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  };

  listBreached = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authUser = getAuthenticatedUser(req);
      const tenantId = authUser.tenantId ?? DEFAULT_TENANT_ID;
      const query = req.query as unknown as ListBreachedSlaTicketsQueryDto;
      const result = await this.service.listBreachedForTenant({
        tenantId,
        page: query.page,
        limit: query.limit,
      });

      sendPaginatedSuccess(
        res,
        result.data,
        buildPaginationMeta(result.page, result.limit, result.total),
      );
    } catch (error) {
      next(error);
    }
  };
}

export const ticketSlaController = new TicketSlaController();
