import cors from 'cors';
import type { RequestHandler } from 'express';
import helmet from 'helmet';

import { env } from '../../../config/env.js';

export const securityMiddleware: RequestHandler[] = [
  helmet(),
  cors({ origin: env.CORS_ORIGIN }),
];
