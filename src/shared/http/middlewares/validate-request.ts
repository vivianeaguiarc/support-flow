import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodType } from 'zod';

import {
  ValidationError,
  type ValidationIssue,
} from '../../errors/http-errors.js';

type RequestValidationSchema = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

function formatValidationMessage(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'request';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}

function formatValidationDetails(error: ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : 'request',
    message: issue.message,
  }));
}

export function validateRequest(schema: RequestValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      if (schema.params) {
        Object.assign(req.params, schema.params.parse(req.params));
      }

      if (schema.query) {
        Object.assign(req.query, schema.query.parse(req.query));
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new ValidationError(
            formatValidationMessage(error),
            formatValidationDetails(error),
          ),
        );
        return;
      }

      next(error);
    }
  };
}
