import type { NextFunction, Request, Response } from 'express';

import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import { sendSuccess } from '../../../../shared/http/response/api-response.js';
import { analyticsService } from '../../application/services/analytics.service.js';
import type { AnalyticsQueryDto } from '../dtos/analytics-query.dto.js';

export class AnalyticsController {
  overview = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await analyticsService.getOverview(
        getAuthenticatedUser(req),
        req.query as AnalyticsQueryDto,
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  ticketsByStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await analyticsService.getTicketsByStatus(
        getAuthenticatedUser(req),
        req.query as AnalyticsQueryDto,
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  ticketsByPriority = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await analyticsService.getTicketsByPriority(
        getAuthenticatedUser(req),
        req.query as AnalyticsQueryDto,
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  sla = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await analyticsService.getSla(
        getAuthenticatedUser(req),
        req.query as AnalyticsQueryDto,
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  agentsPerformance = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await analyticsService.getAgentsPerformance(
        getAuthenticatedUser(req),
        req.query as AnalyticsQueryDto,
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  csat = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await analyticsService.getCsat(
        getAuthenticatedUser(req),
        req.query as AnalyticsQueryDto,
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };
}

export const analyticsController = new AnalyticsController();
