import { Router } from 'express';

import { env } from '../../../config/env.js';
import { authRateLimitMiddleware } from '../../../shared/http/middlewares/auth-rate-limit.js';
import { validateRequest } from '../../../shared/http/middlewares/validate-request.js';
import { authController } from '../controllers/auth.controller.js';
import { loginSchema } from '../dtos/login.dto.js';

export const authRouter = Router();

const loginMiddlewares = env.RATE_LIMIT_ENABLED
  ? [authRateLimitMiddleware]
  : [];

authRouter.post(
  '/login',
  ...loginMiddlewares,
  validateRequest({ body: loginSchema }),
  authController.login,
);
