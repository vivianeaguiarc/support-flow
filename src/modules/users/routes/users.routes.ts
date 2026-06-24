import { Router } from 'express';
import { z } from 'zod';

import { authenticate } from '../../../shared/http/middlewares/authenticate.js';
import { optionalAuthenticate } from '../../../shared/http/middlewares/optional-authenticate.js';
import { requirePermission } from '../../../shared/http/middlewares/require-permission.js';
import { validateRequest } from '../../../shared/http/middlewares/validate-request.js';
import { PermissionKey } from '../../../shared/security/permissions.js';
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
  requirePermission(PermissionKey.USERS_MANAGE),
  validateRequest({ query: listUsersQuerySchema }),
  usersController.list,
);

usersRouter.get(
  '/:id',
  authenticate,
  requirePermission(PermissionKey.USERS_MANAGE),
  validateRequest({ params: idParamSchema }),
  usersController.findById,
);
