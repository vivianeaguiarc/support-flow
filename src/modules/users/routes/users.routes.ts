import { Router } from 'express';
import { z } from 'zod';

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

usersRouter.get('/', usersController.list);

usersRouter.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  usersController.findById,
);
