import type { Request } from 'express';

export function getClientIp(req: Request): string | undefined {
  return req.ip ?? req.socket?.remoteAddress ?? undefined;
}

export function getUserAgent(req: Request): string | undefined {
  const userAgent = req.headers?.['user-agent'];
  return typeof userAgent === 'string' ? userAgent : undefined;
}
