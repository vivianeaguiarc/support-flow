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
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerUiOptions),
  );

  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.use(
    '/api/docs/v2',
    swaggerUi.serve,
    swaggerUi.setup(swaggerV2Spec, swaggerV2UiOptions),
  );

  app.get('/api/docs/v2.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerV2Spec);
  });

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
