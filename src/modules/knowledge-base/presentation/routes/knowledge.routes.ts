import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { optionalAuthenticateWithApiKey } from '../../../../shared/http/middlewares/authenticate-api-key.js';
import { requirePermission } from '../../../../shared/http/middlewares/require-permission.js';
import { validateRequest } from '../../../../shared/http/middlewares/validate-request.js';
import { PermissionKey } from '../../../../shared/security/permissions.js';
import { knowledgeArticlesController } from '../controllers/knowledge-articles.controller.js';
import { createKnowledgeArticleSchema } from '../dtos/create-knowledge-article.dto.js';
import { knowledgeArticleIdParamSchema } from '../dtos/knowledge-article-id-param.dto.js';
import { knowledgeArticleSlugParamSchema } from '../dtos/knowledge-article-slug-param.dto.js';
import { listKnowledgeArticlesQuerySchema } from '../dtos/list-knowledge-articles-query.dto.js';
import { updateKnowledgeArticleSchema } from '../dtos/update-knowledge-article.dto.js';

export const knowledgeArticlesRouter = Router();

knowledgeArticlesRouter.get(
  '/',
  optionalAuthenticateWithApiKey,
  validateRequest({ query: listKnowledgeArticlesQuerySchema }),
  knowledgeArticlesController.list,
);

knowledgeArticlesRouter.post(
  '/',
  authenticate,
  requirePermission(PermissionKey.KNOWLEDGE_CREATE),
  validateRequest({ body: createKnowledgeArticleSchema }),
  knowledgeArticlesController.create,
);

knowledgeArticlesRouter.patch(
  '/:id/publish',
  authenticate,
  requirePermission(PermissionKey.KNOWLEDGE_PUBLISH),
  validateRequest({ params: knowledgeArticleIdParamSchema }),
  knowledgeArticlesController.publish,
);

knowledgeArticlesRouter.patch(
  '/:id/archive',
  authenticate,
  requirePermission(PermissionKey.KNOWLEDGE_CREATE),
  validateRequest({ params: knowledgeArticleIdParamSchema }),
  knowledgeArticlesController.archive,
);

knowledgeArticlesRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PermissionKey.KNOWLEDGE_CREATE),
  validateRequest({
    params: knowledgeArticleIdParamSchema,
    body: updateKnowledgeArticleSchema,
  }),
  knowledgeArticlesController.update,
);

knowledgeArticlesRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PermissionKey.KNOWLEDGE_CREATE),
  validateRequest({ params: knowledgeArticleIdParamSchema }),
  knowledgeArticlesController.remove,
);

knowledgeArticlesRouter.get(
  '/:slug',
  optionalAuthenticateWithApiKey,
  validateRequest({ params: knowledgeArticleSlugParamSchema }),
  knowledgeArticlesController.getBySlug,
);

export const knowledgeRouter = Router();
knowledgeRouter.use('/articles', knowledgeArticlesRouter);
