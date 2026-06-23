import { Router } from 'express';

import { authRateLimitMiddleware } from '../../../shared/http/middlewares/auth-rate-limit.js';
import { validateRequest } from '../../../shared/http/middlewares/validate-request.js';
import { authController } from '../controllers/auth.controller.js';
import { loginSchema } from '../dtos/login.dto.js';

export const authRouter = Router();

authRouter.post(
  '/login',
  authRateLimitMiddleware,
  validateRequest({ body: loginSchema }),
  authController.login,
);
