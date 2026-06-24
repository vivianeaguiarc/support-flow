import type { NextFunction, Request, Response } from 'express';

import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import { buildPaginationMeta } from '../../../../shared/http/pagination/pagination.js';
import { sendPaginatedSuccess } from '../../../../shared/http/response/api-response.js';
import { resolveTenantId } from '../../../../shared/tenant/get-request-tenant-id.js';
import type { TicketCategory } from '../../domain/ticket-category.entity.js';
import {
  TicketCategoriesRepository,
  ticketCategoriesRepository,
} from '../../infrastructure/repositories/ticket-categories.repository.js';
import type { ListTicketCategoriesQueryDto } from '../dtos/list-ticket-categories-query.dto.js';

export class TicketCategoriesController {
  constructor(
    private readonly repository: TicketCategoriesRepository = ticketCategoriesRepository,
  ) {}

  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authUser = getAuthenticatedUser(req);
      const query = req.query as unknown as ListTicketCategoriesQueryDto;
      const tenantId = resolveTenantId(authUser);

      const result = await this.repository.listWithFilters({
        tenantId,
        search: query.search,
        isActive: query.isActive,
        createdFrom: query.createdFrom,
        createdTo: query.createdTo,
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      sendPaginatedSuccess(
        res,
        result.data as TicketCategory[],
        buildPaginationMeta(result.page, result.limit, result.total),
      );
    } catch (error) {
      next(error);
    }
  };
}

export const ticketCategoriesController = new TicketCategoriesController();
