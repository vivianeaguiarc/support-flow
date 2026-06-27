import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Express, Request, Response } from 'express';
import { marked } from 'marked';
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

// Project root resolves to the same relative depth in `src/` (dev) and `dist/`
// (build): both live directly under the repository root.
const configDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(configDir, '..', '..');
const guidesDir = path.join(projectRoot, 'docs');

// Whitelist of complementary guides exposed by the docs landing page. Keys are
// the public slugs linked from the OpenAPI description; values are the markdown
// files shipped in `docs/`.
const GUIDES: Record<string, { file: string; title: string }> = {
  authentication: { file: 'authentication.md', title: 'Autenticação' },
  security: { file: 'security.md', title: 'Segurança' },
  rbac: { file: 'rbac.md', title: 'RBAC' },
  'api-versioning': {
    file: 'api-versioning.md',
    title: 'Versionamento da API',
  },
  architecture: { file: 'architecture.md', title: 'Arquitetura' },
};

function renderGuidePage(title: string, bodyHtml: string): string {
  return [
    '<!doctype html>',
    '<html lang="pt-br">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${title} · SupportFlow API</title>`,
    '<style>',
    ':root{color-scheme:light dark}',
    'body{max-width:880px;margin:0 auto;padding:2.5rem 1.5rem;',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;',
    'line-height:1.65;color:#1f2933;background:#fff}',
    'a{color:#7c3aed}',
    'a.back{display:inline-block;margin-bottom:1.5rem;text-decoration:none;font-weight:600}',
    'h1,h2,h3{line-height:1.25}',
    'pre{background:#f4f4f7;padding:1rem;border-radius:8px;overflow:auto}',
    'code{background:#f4f4f7;padding:.15rem .35rem;border-radius:4px;font-size:.9em}',
    'pre code{background:none;padding:0}',
    'table{border-collapse:collapse;width:100%}',
    'th,td{border:1px solid #d9d9e3;padding:.5rem .75rem;text-align:left}',
    'blockquote{margin:1rem 0;padding:.25rem 1rem;border-left:4px solid #7c3aed;color:#52606d}',
    '@media(prefers-color-scheme:dark){body{color:#e4e7eb;background:#15151b}',
    'pre,code{background:#23232b}th,td{border-color:#3a3a44}blockquote{color:#9aa5b1}}',
    '</style>',
    '</head>',
    '<body>',
    '<a class="back" href="/api/docs">← Voltar para a documentação da API</a>',
    bodyHtml,
    '</body>',
    '</html>',
  ].join('\n');
}

function handleGuideRequest(req: Request, res: Response): void {
  const slugParam = req.params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  const guide = slug ? GUIDES[slug] : undefined;

  if (!guide) {
    res
      .status(404)
      .type('text/html')
      .send(
        renderGuidePage(
          'Guia não encontrado',
          '<h1>Guia não encontrado</h1><p>O documento solicitado não existe.</p>',
        ),
      );
    return;
  }

  const filePath = path.join(guidesDir, guide.file);

  fs.readFile(filePath, 'utf-8', (error, markdown) => {
    if (error) {
      res
        .status(404)
        .type('text/html')
        .send(
          renderGuidePage(
            'Guia indisponível',
            '<h1>Guia indisponível</h1><p>Não foi possível carregar este documento.</p>',
          ),
        );
      return;
    }

    const bodyHtml = marked.parse(markdown, { async: false }) as string;
    res
      .status(200)
      .type('text/html')
      .send(renderGuidePage(guide.title, bodyHtml));
  });
}

export function setupSwagger(app: Express): void {
  // Serve the complementary markdown guides (linked from the OpenAPI landing
  // page) BEFORE the `/api/docs` Swagger mount, otherwise `swaggerUi.serveFiles`
  // would intercept `/api/docs/guides/*` and return 404.
  app.get('/api/docs/guides/:slug', handleGuideRequest);

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
