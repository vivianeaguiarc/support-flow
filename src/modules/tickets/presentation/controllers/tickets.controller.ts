import type { NextFunction, Request, Response } from 'express';

import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import { buildPaginationMeta } from '../../../../shared/http/pagination/pagination.js';
import { getRouteParam } from '../../../../shared/http/request-params.js';
import {
  sendPaginatedSuccess,
  sendSuccess,
} from '../../../../shared/http/response/api-response.js';
import {
  TicketsService,
  ticketsService,
} from '../../application/services/tickets.service.js';
import type { AssignTicketDto } from '../dtos/assign-ticket.dto.js';
import type { CreateTicketDto } from '../dtos/create-ticket.dto.js';
import type { ListTicketsQueryDto } from '../dtos/list-tickets-query.dto.js';
import type { QueueTicketsQueryDto } from '../dtos/queue-tickets-query.dto.js';
import type { TicketMetricsQueryDto } from '../dtos/ticket-metrics-query.dto.js';
import type { TicketSummaryQueryDto } from '../dtos/ticket-summary-query.dto.js';
import type { UpdateTicketStatusDto } from '../dtos/update-ticket-status.dto.js';

export class TicketsController {
  constructor(private readonly service: TicketsService = ticketsService) {}

  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = req.body as CreateTicketDto;
      const ticket = await this.service.create(
        {
          title: body.title,
          description: body.description,
          customerId: body.customerId,
          priority: body.priority,
          categoryId: body.categoryId,
          assignedToId: body.assignedToId,
        },
        getAuthenticatedUser(req),
      );
      sendSuccess(res, ticket, {
        status: 201,
        message: 'Ticket created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const rawQuery = req.query as unknown as ListTicketsQueryDto & {
        assignedTo?: string;
      };
      const query: ListTicketsQueryDto = {
        ...rawQuery,
        assignedToId: rawQuery.assignedToId ?? rawQuery.assignedTo,
      };
      const result = await this.service.list(getAuthenticatedUser(req), query);
      sendPaginatedSuccess(
        res,
        result.data,
        buildPaginationMeta(result.page, result.limit, result.total),
      );
    } catch (error) {
      next(error);
    }
  };

  findById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const ticket = await this.service.findById(
        req.params.id as string,
        getAuthenticatedUser(req),
      );
      sendSuccess(res, ticket);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { status } = req.body as UpdateTicketStatusDto;
      const ticket = await this.service.updateStatus(
        req.params.id as string,
        status,
        getAuthenticatedUser(req),
      );
      sendSuccess(res, ticket, {
        message: 'Ticket status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  assign = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { agentId } = req.body as AssignTicketDto;
      const ticket = await this.service.assignAgent(
        req.params.id as string,
        agentId,
        getAuthenticatedUser(req),
      );
      sendSuccess(res, ticket, { message: 'Ticket assigned successfully' });
    } catch (error) {
      next(error);
    }
  };

  myQueue = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = req.query as unknown as QueueTicketsQueryDto;
      const result = await this.service.listMyQueue(
        getAuthenticatedUser(req),
        query,
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

  unassigned = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = req.query as unknown as QueueTicketsQueryDto;
      const result = await this.service.listUnassigned(
        getAuthenticatedUser(req),
        query,
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

  getStatusTransitions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const transitions = await this.service.getStatusTransitions(
        req.params.id as string,
        getAuthenticatedUser(req),
      );
      sendSuccess(res, transitions);
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const ticketId =
        typeof req.params.ticketId === 'string'
          ? getRouteParam(req.params, 'ticketId')
          : getRouteParam(req.params, 'id');

      const history = await this.service.getHistory(
        ticketId,
        getAuthenticatedUser(req),
      );
      sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  };

  summary = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = req.query as unknown as TicketSummaryQueryDto;
      const summary = await this.service.summary(
        getAuthenticatedUser(req),
        query,
      );
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  };

  metrics = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = req.query as unknown as TicketMetricsQueryDto;
      const metrics = await this.service.metrics(
        getAuthenticatedUser(req),
        query,
      );
      sendSuccess(res, metrics);
    } catch (error) {
      next(error);
    }
  };
}

export const ticketsController = new TicketsController();
