import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './swagger.js';

const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SupportFlow API Documentation',
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

  app.get('/api-docs', (_req, res) => {
    res.redirect(301, '/api/docs');
  });

  app.get('/api-docs.json', (_req, res) => {
    res.redirect(301, '/api/docs.json');
  });
}
