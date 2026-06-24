import type { NextFunction, Request, Response } from 'express';

import type { ApiVersion } from '../api-version.js';

export function attachApiVersion(version: ApiVersion) {
  return (req: Request, res: Response, next: NextFunction): void => {
    req.apiVersion = version;
    res.setHeader('X-API-Version', version);
    next();
  };
}
