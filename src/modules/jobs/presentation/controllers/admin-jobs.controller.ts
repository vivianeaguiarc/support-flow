import type { NextFunction, Request, Response } from 'express';

import { sendSuccess } from '../../../../shared/http/response/api-response.js';
import { jobsMonitorService } from '../../application/jobs-monitor.service.js';

export class AdminJobsController {
  list = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const overview = await jobsMonitorService.getOverview();
      sendSuccess(res, overview);
    } catch (error) {
      next(error);
    }
  };

  metrics = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const metrics = await jobsMonitorService.getMetrics();
      sendSuccess(res, metrics);
    } catch (error) {
      next(error);
    }
  };
}

export const adminJobsController = new AdminJobsController();
