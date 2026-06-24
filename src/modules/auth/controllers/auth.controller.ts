import type { NextFunction, Request, Response } from 'express';

import {
  getClientIp,
  getUserAgent,
} from '../../../shared/http/request-client.js';
import { sendSuccess } from '../../../shared/http/response/api-response.js';
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
      const result = await this.service.login(req.body as LoginDto, {
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });
      sendSuccess(res, result);
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
      sendSuccess(res, result);
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
      sendSuccess(res, result, { message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
