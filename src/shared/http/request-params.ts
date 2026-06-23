import { AppError } from '../errors/app-error.js';

export function getRouteParam(
  params: Record<string, string | string[] | undefined>,
  name: string,
): string {
  const value = params[name];

  if (typeof value === 'string') {
    return value;
  }

  throw new AppError(`Missing route parameter: ${name}`, 400);
}
