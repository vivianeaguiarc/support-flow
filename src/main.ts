import { createApp } from './app.js';
import { env } from './config/env.js';
import { shutdownOpenTelemetry } from './modules/observability/infrastructure/opentelemetry.js';
import { closeRedisConnection } from './modules/queues/infrastructure/redis-connection.js';
import { queueProvider } from './modules/queues/queue-provider.js';
import { logger } from './shared/logger/logger.js';

export async function bootstrap(): Promise<void> {
  if (env.QUEUE_ENABLED && env.QUEUE_WORKERS_ENABLED) {
    await queueProvider.startWorkers();
  }

  const swaggerEnabled = env.swaggerEnabled;
  const app = createApp({ swagger: swaggerEnabled });

  const server = app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        env: env.NODE_ENV,
        swagger: swaggerEnabled,
        queueEnabled: env.QUEUE_ENABLED,
        queueWorkersEnabled: env.QUEUE_WORKERS_ENABLED,
        ...(swaggerEnabled ? { docsPath: '/api/docs' } : {}),
      },
      'Server started',
    );
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down server');
    server.close(async () => {
      await queueProvider.close();
      await closeRedisConnection();
      await shutdownOpenTelemetry();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}
