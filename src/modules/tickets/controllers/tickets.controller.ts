import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../../shared/errors/app-error.js';
import type { AssignTicketAgentDto } from '../dtos/assign-ticket-agent.dto.js';
import type { CreateTicketDto } from '../dtos/create-ticket.dto.js';
import type { UpdateTicketStatusDto } from '../dtos/update-ticket-status.dto.js';
import { TicketsService, ticketsService } from '../services/tickets.service.js';

function getAuthenticatedUser(req: Request) {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  return req.user;
}

export class TicketsController {
  constructor(private readonly service: TicketsService = ticketsService) {}

  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const ticket = await this.service.create(
        req.body as CreateTicketDto,
        getAuthenticatedUser(req),
      );
      res.status(201).json(ticket);
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
      res.status(200).json(ticket);
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
      const tickets = await this.service.list(getAuthenticatedUser(req));
      res.status(200).json(tickets);
    } catch (error) {
      next(error);
    }
  };

  listByCustomerId = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const tickets = await this.service.listByCustomerId(
        req.params.customerId as string,
        getAuthenticatedUser(req),
      );
      res.status(200).json(tickets);
    } catch (error) {
      next(error);
    }
  };

  listByAssignedAgentId = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const tickets = await this.service.listByAssignedAgentId(
        req.params.agentId as string,
        getAuthenticatedUser(req),
      );
      res.status(200).json(tickets);
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
      res.status(200).json(ticket);
    } catch (error) {
      next(error);
    }
  };

  assignAgent = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { assignedAgentId } = req.body as AssignTicketAgentDto;
      const ticket = await this.service.assignAgent(
        req.params.id as string,
        assignedAgentId,
        getAuthenticatedUser(req),
      );
      res.status(200).json(ticket);
    } catch (error) {
      next(error);
    }
  };
}

export const ticketsController = new TicketsController();
