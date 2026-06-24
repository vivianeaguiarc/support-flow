import type { NextFunction, Request, Response } from 'express';

import { DEFAULT_TENANT_ID } from '../../../shared/constants/tenant.js';
import { UnauthorizedError } from '../../../shared/errors/http-errors.js';
import { sendSuccess } from '../../../shared/http/response/api-response.js';
import type { CreateUserDto } from '../dtos/create-user.dto.js';
import { toPublicUser } from '../mappers/to-public-user.js';
import { UsersService, usersService } from '../services/users.service.js';

function getTenantId(req: Request): string {
  return req.user?.tenantId ?? DEFAULT_TENANT_ID;
}

export class UsersController {
  constructor(private readonly service: UsersService = usersService) {}

  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = req.body as CreateUserDto;
      const user = await this.service.create({
        ...body,
        tenantId: getTenantId(req),
      });
      sendSuccess(res, toPublicUser(user), {
        status: 201,
        message: 'User created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  findById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const user = await this.service.findById(
        req.params.id as string,
        req.user.tenantId,
      );
      sendSuccess(res, toPublicUser(user));
    } catch (error) {
      next(error);
    }
  };

  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const users = await this.service.list(req.user.tenantId);
      sendSuccess(res, users.map(toPublicUser));
    } catch (error) {
      next(error);
    }
  };
}

export const usersController = new UsersController();
