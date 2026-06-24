import { Router } from 'express';

import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { authorize } from '../../../../shared/http/middlewares/authorize.js';
import { sendSuccess } from '../../../../shared/http/response/api-response.js';
import { UserRole } from '../../../../shared/types/user-role.js';
import { ticketsService } from '../../application/services/tickets.service.js';

export const metricsRouter = Router();

metricsRouter.get(
  '/agents',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPERVISOR),
  async (req, res, next) => {
    try {
      const metrics = await ticketsService.agentMetrics(
        getAuthenticatedUser(req),
      );
      sendSuccess(res, metrics);
    } catch (error) {
      next(error);
    }
  },
);
