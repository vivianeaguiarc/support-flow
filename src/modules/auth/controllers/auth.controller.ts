import type { NextFunction, Request, Response } from 'express';

import type { LoginDto } from '../dtos/login.dto.js';
import type { LogoutDto } from '../dtos/logout.dto.js';
import type { RefreshTokenDto } from '../dtos/refresh-token.dto.js';
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

  refresh = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.service.refresh(req.body as RefreshTokenDto);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.service.logout(req.body as LogoutDto);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
