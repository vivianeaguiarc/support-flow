import type { NextFunction, Request, Response } from 'express';

import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import { buildPaginationMeta } from '../../../../shared/http/pagination/pagination.js';
import { getRouteParam } from '../../../../shared/http/request-params.js';
import {
  sendPaginatedSuccess,
  sendSuccess,
} from '../../../../shared/http/response/api-response.js';
import { getRequestTenantId } from '../../../../shared/tenant/get-request-tenant-id.js';
import type { AuthenticatedUser } from '../../../../shared/types/authenticated-user.js';
import { knowledgeArticlesService } from '../../application/services/knowledge-articles.service.js';
import type { CreateKnowledgeArticleDto } from '../dtos/create-knowledge-article.dto.js';
import type { ListKnowledgeArticlesQueryDto } from '../dtos/list-knowledge-articles-query.dto.js';
import type { UpdateKnowledgeArticleDto } from '../dtos/update-knowledge-article.dto.js';

function resolveTenantId(req: Request): string {
  return getRequestTenantId(req, req.user);
}

function resolveOptionalAuthUser(req: Request): AuthenticatedUser | undefined {
  return req.user;
}

export class KnowledgeArticlesController {
  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = req.query as unknown as ListKnowledgeArticlesQueryDto;
      const result = await knowledgeArticlesService.list(
        resolveTenantId(req),
        query,
        resolveOptionalAuthUser(req),
      );

      sendPaginatedSuccess(
        res,
        result.data,
        buildPaginationMeta(result.page, result.limit, result.total),
      );
    } catch (error) {
      next(error);
    }
  };

  getBySlug = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const article = await knowledgeArticlesService.getBySlug(
        resolveTenantId(req),
        getRouteParam(req.params, 'slug'),
        resolveOptionalAuthUser(req),
      );

      sendSuccess(res, article);
    } catch (error) {
      next(error);
    }
  };

  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authUser = getAuthenticatedUser(req);
      const body = req.body as CreateKnowledgeArticleDto;
      const article = await knowledgeArticlesService.create(authUser, body);

      sendSuccess(res, article, { status: 201 });
    } catch (error) {
      next(error);
    }
  };

  update = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authUser = getAuthenticatedUser(req);
      const body = req.body as UpdateKnowledgeArticleDto;
      const article = await knowledgeArticlesService.update(authUser, {
        articleId: getRouteParam(req.params, 'id'),
        ...body,
      });

      sendSuccess(res, article);
    } catch (error) {
      next(error);
    }
  };

  remove = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authUser = getAuthenticatedUser(req);
      await knowledgeArticlesService.delete(
        authUser,
        getRouteParam(req.params, 'id'),
      );

      sendSuccess(res, { id: getRouteParam(req.params, 'id') });
    } catch (error) {
      next(error);
    }
  };

  publish = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authUser = getAuthenticatedUser(req);
      const article = await knowledgeArticlesService.publish(
        authUser,
        getRouteParam(req.params, 'id'),
      );

      sendSuccess(res, article);
    } catch (error) {
      next(error);
    }
  };

  archive = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authUser = getAuthenticatedUser(req);
      const article = await knowledgeArticlesService.archive(
        authUser,
        getRouteParam(req.params, 'id'),
      );

      sendSuccess(res, article);
    } catch (error) {
      next(error);
    }
  };
}

export const knowledgeArticlesController = new KnowledgeArticlesController();
