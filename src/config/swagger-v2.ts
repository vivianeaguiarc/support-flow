import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Options } from 'swagger-jsdoc';
import swaggerJsdoc from 'swagger-jsdoc';

import { env } from './env.js';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const isProductionBuild = configDir.includes(`${path.sep}dist${path.sep}`);
const docsRoot = path.join(configDir, '..');
const swaggerExtension = isProductionBuild ? 'js' : 'ts';

const swaggerV2Globs = [
  path.join(docsRoot, `routes/v2/docs/*.swagger.${swaggerExtension}`),
];

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SupportFlow API v2',
      version: '2.0',
      description:
        'Versão 2 da API SupportFlow — evolução incremental com compatibilidade preservada na v1. ' +
        'Novos contratos e breaking changes serão introduzidos aqui antes da depreciação da v1.',
      contact: {
        name: 'SupportFlow Team',
        email: 'support@supportflow.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v2`,
        description: 'Development server (v2)',
      },
      {
        url: 'https://api.supportflow.com/api/v2',
        description: 'Production server (v2)',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'JWT obtido em POST /api/v1/auth/login (auth compartilhado entre versões)',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description:
            'API Key no formato supportflow_sk_live_... para integrações externas',
        },
      },
      parameters: {
        TenantIdHeader: {
          name: 'x-tenant-id',
          in: 'header',
          required: false,
          description:
            'UUID da organização (tenant). Obrigatório para SUPER_ADMIN acessar outra organização.',
          schema: { type: 'string', format: 'uuid' },
        },
        TenantSlugHeader: {
          name: 'x-tenant-slug',
          in: 'header',
          required: false,
          description: 'Slug da organização.',
          schema: { type: 'string' },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Health checks da API v2',
      },
      {
        name: 'Tickets',
        description: 'Chamados — superfície inicial da v2',
      },
    ],
  },
  apis: swaggerV2Globs,
};

export const swaggerV2Spec = swaggerJsdoc(options);
