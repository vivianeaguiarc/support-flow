import { Router } from 'express';

import { env } from '../../../config/env.js';
import { authenticate } from '../../../shared/http/middlewares/authenticate.js';
import { authRateLimitMiddleware } from '../../../shared/http/middlewares/sensitive-rate-limits.js';
import { validateRequest } from '../../../shared/http/middlewares/validate-request.js';
import { authController } from '../controllers/auth.controller.js';
import { loginSchema } from '../dtos/login.dto.js';
import { logoutSchema } from '../dtos/logout.dto.js';
import { refreshTokenSchema } from '../dtos/refresh-token.dto.js';

export const authRouter = Router();

const authRateLimit = env.RATE_LIMIT_ENABLED ? [authRateLimitMiddleware] : [];

authRouter.get('/me', authenticate, authController.me);

authRouter.post(
  '/login',
  ...authRateLimit,
  validateRequest({ body: loginSchema }),
  authController.login,
);

authRouter.post(
  '/refresh',
  ...authRateLimit,
  validateRequest({ body: refreshTokenSchema }),
  authController.refresh,
);

authRouter.post(
  '/logout',
  validateRequest({ body: logoutSchema }),
  authController.logout,
);
