import { Router } from 'express';
import { z } from 'zod';

import { authenticate } from '../../../shared/http/middlewares/authenticate.js';
import { authorize } from '../../../shared/http/middlewares/authorize.js';
import { optionalAuthenticate } from '../../../shared/http/middlewares/optional-authenticate.js';
import { validateRequest } from '../../../shared/http/middlewares/validate-request.js';
import { ROLE_GROUPS } from '../../../shared/security/rbac.js';
import { usersController } from '../controllers/users.controller.js';
import { createUserSchema } from '../dtos/create-user.dto.js';
import { listUsersQuerySchema } from '../dtos/list-users-query.dto.js';
import { enforceUserCreationPolicy } from '../middlewares/enforce-user-creation-policy.js';

const idParamSchema = z.object({
  id: z.uuid('Invalid user ID'),
});

export const usersRouter = Router();

usersRouter.post(
  '/',
  optionalAuthenticate,
  validateRequest({ body: createUserSchema }),
  enforceUserCreationPolicy,
  usersController.create,
);

usersRouter.get(
  '/',
  authenticate,
  authorize(...ROLE_GROUPS.USER_ADMIN),
  validateRequest({ query: listUsersQuerySchema }),
  usersController.list,
);

usersRouter.get(
  '/:id',
  authenticate,
  authorize(...ROLE_GROUPS.USER_ADMIN),
  validateRequest({ params: idParamSchema }),
  usersController.findById,
);
