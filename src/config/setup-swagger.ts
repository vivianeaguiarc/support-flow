import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './swagger.js';
import { swaggerV2Spec } from './swagger-v2.js';

const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SupportFlow API Documentation',
};

const swaggerV2UiOptions: swaggerUi.SwaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SupportFlow API v2 Documentation',
};

export function setupSwagger(app: Express): void {
  // Two important details when serving multiple Swagger UIs in the same app:
  //
  // 1. Use `serveFiles(spec, ...)` instead of the shared `swaggerUi.serve`.
  //    The shared `serve` middleware keeps a single module-level spec, so the
  //    last `setup()` would override the spec rendered everywhere (that is why
  //    `/api/docs` was wrongly showing the v2 spec).
  //
  // 2. Register the more specific `/api/docs/v2` BEFORE `/api/docs`. Since
  //    `/api/docs/v2/...` is a sub-path of `/api/docs`, the v1 mount would
  //    otherwise intercept the v2 assets (e.g. `swagger-ui-init.js`).
  app.get('/api/docs/v2.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerV2Spec);
  });

  app.use(
    '/api/docs/v2',
    swaggerUi.serveFiles(swaggerV2Spec, swaggerV2UiOptions),
    swaggerUi.setup(swaggerV2Spec, swaggerV2UiOptions),
  );

  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.use(
    '/api/docs',
    swaggerUi.serveFiles(swaggerSpec, swaggerUiOptions),
    swaggerUi.setup(swaggerSpec, swaggerUiOptions),
  );

  app.get('/api-docs', (_req, res) => {
    res.redirect(301, '/api/docs');
  });

  app.get('/api-docs.json', (_req, res) => {
    res.redirect(301, '/api/docs.json');
  });

  app.get('/api-docs/v2', (_req, res) => {
    res.redirect(301, '/api/docs/v2');
  });

  app.get('/api-docs/v2.json', (_req, res) => {
    res.redirect(301, '/api/docs/v2.json');
  });
}
