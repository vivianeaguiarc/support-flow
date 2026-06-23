import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './shared/logger/logger.js';

export function bootstrap(): void {
  const swaggerEnabled = env.swaggerEnabled;
  const app = createApp({ swagger: swaggerEnabled });

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server started');
  });
}
