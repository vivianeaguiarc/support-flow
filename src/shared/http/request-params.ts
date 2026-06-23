import type { ParamsDictionary } from 'express-serve-static-core';

import { AppError } from '../errors/app-error.js';

export function getRouteParam(params: ParamsDictionary, name: string): string {
  const value = params[name];

  if (typeof value === 'string') {
    return value;
  }

  throw new AppError(`Missing route parameter: ${name}`, 400);
}
