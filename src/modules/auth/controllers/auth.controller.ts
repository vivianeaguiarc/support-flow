import type { NextFunction, Request, Response } from 'express';

import type { LoginDto } from '../dtos/login.dto.js';
import { type AuthService, authService } from '../services/index.js';

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.service.login(req.body as LoginDto);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
