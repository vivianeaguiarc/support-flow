import type { User } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

import type { CreateUserDto } from '../dtos/create-user.dto.js';
import { UsersService, usersService } from '../services/users.service.js';

function toUserResponse(user: User) {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export class UsersController {
  constructor(private readonly service: UsersService = usersService) {}

  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await this.service.create(req.body as CreateUserDto);
      res.status(201).json(toUserResponse(user));
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
      const user = await this.service.findById(req.params.id as string);
      res.status(200).json(toUserResponse(user));
    } catch (error) {
      next(error);
    }
  };

  list = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const users = await this.service.list();
      res.status(200).json(users.map(toUserResponse));
    } catch (error) {
      next(error);
    }
  };
}

export const usersController = new UsersController();
