import { Router } from 'express';

import { validateRequest } from '../../../shared/http/middlewares/validate-request.js';
import { authController } from '../controllers/auth.controller.js';
import { loginSchema } from '../dtos/login.dto.js';

export const authRouter = Router();

authRouter.post(
  '/login',
  validateRequest({ body: loginSchema }),
  authController.login,
);
