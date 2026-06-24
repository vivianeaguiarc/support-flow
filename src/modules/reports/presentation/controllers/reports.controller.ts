import type { NextFunction, Request, Response } from 'express';

import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import type { AnalyticsQueryDto } from '../../../analytics/presentation/dtos/analytics-query.dto.js';
import { reportsService } from '../../application/services/reports.service.js';

export class ReportsController {
  exportTickets = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await reportsService.exportTicketsCsv(
        getAuthenticatedUser(req),
        req.query as AnalyticsQueryDto,
        res,
      );
    } catch (error) {
      next(error);
    }
  };

  exportAgentsPerformance = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await reportsService.exportAgentsPerformanceCsv(
        getAuthenticatedUser(req),
        req.query as AnalyticsQueryDto,
        res,
      );
    } catch (error) {
      next(error);
    }
  };

  exportSla = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await reportsService.exportSlaCsv(
        getAuthenticatedUser(req),
        req.query as AnalyticsQueryDto,
        res,
      );
    } catch (error) {
      next(error);
    }
  };
}

export const reportsController = new ReportsController();
