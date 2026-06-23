import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../../shared/errors/app-error.js';
import { UserRole } from '../../../shared/types/user-role.js';
import type { CreateUserDto } from '../dtos/create-user.dto.js';

export function enforceUserCreationPolicy(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const { role } = req.body as CreateUserDto;

  if (role === UserRole.CUSTOMER) {
    next();
    return;
  }

  if (!req.user || req.user.role !== UserRole.ADMIN) {
    next(
      new AppError(
        'Only administrators can create users with staff roles',
        403,
      ),
    );
    return;
  }

  next();
}
