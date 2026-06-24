import { Router } from 'express';

import { ticketsRouter } from '../../modules/tickets/presentation/routes/tickets.routes.js';
import { API_VERSION } from '../../shared/http/api-version.js';
import { attachApiVersion } from '../../shared/http/middlewares/attach-api-version.js';
import { resolveTenantContext } from '../../shared/http/middlewares/tenant-scope.middleware.js';
import { v2HealthRouter } from './health.routes.js';

export function createApiV2Router(): Router {
  const router = Router();

  router.use(attachApiVersion(API_VERSION.V2));
  router.use(resolveTenantContext);
  router.use('/health', v2HealthRouter);
  router.use('/tickets', ticketsRouter);

  return router;
}
