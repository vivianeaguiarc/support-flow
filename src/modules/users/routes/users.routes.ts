import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { authenticate } from '../../../shared/http/middlewares/authenticate.js';
import { authorize } from '../../../shared/http/middlewares/authorize.js';
import { validateRequest } from '../../../shared/http/middlewares/validate-request.js';
import { usersController } from '../controllers/users.controller.js';
import { createUserSchema } from '../dtos/create-user.dto.js';

const idParamSchema = z.object({
  id: z.uuid('Invalid user ID'),
});

export const usersRouter = Router();

usersRouter.post(
  '/',
  validateRequest({ body: createUserSchema }),
  usersController.create,
);

usersRouter.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  usersController.list,
);

usersRouter.get(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest({ params: idParamSchema }),
  usersController.findById,
);
