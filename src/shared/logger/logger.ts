import pino from 'pino';

import { env } from '../../config/env.js';
import { SENSITIVE_REDACT_PATHS } from './sensitive-redaction.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [...SENSITIVE_REDACT_PATHS],
    censor: '[Redacted]',
  },
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
});
