import type { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../../../shared/errors/http-errors.js';
import { buildPaginationMeta } from '../../../shared/http/pagination/pagination.js';
import { sendPaginatedSuccess } from '../../../shared/http/response/api-response.js';
import type { ListCustomersQueryDto } from '../dtos/list-customers-query.dto.js';
import {
  CustomersService,
  customersService,
} from '../services/customers.service.js';

export class CustomersController {
  constructor(private readonly service: CustomersService = customersService) {}

  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const query = req.query as unknown as ListCustomersQueryDto;
      const result = await this.service.list(req.user.tenantId, query);
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

export const customersController = new CustomersController();
