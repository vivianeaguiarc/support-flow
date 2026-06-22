import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './shared/logger/logger.js';

const app = createApp();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server started');
});
