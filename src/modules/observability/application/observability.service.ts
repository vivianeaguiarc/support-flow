import { Redis } from 'ioredis';

import { env } from '../../../config/env.js';
import { prisma } from '../../../shared/database/prisma.js';
import { jobsMonitorService } from '../../jobs/application/jobs-monitor.service.js';
import { metricsService } from './metrics.service.js';

export type ObservabilityHealthResponse = {
  status: 'ok' | 'degraded';
  service: string;
  environment: string;
  timestamp: string;
  openTelemetry: {
    enabled: boolean;
    serviceName: string;
    otlpEndpoint: string | null;
  };
  metrics: {
    enabled: boolean;
  };
  checks: {
    database: 'up' | 'down';
    redis: 'up' | 'down' | 'skipped';
  };
  http: ReturnType<typeof metricsService.getHttpSummary>;
  jobs: {
    overview: Awaited<ReturnType<typeof jobsMonitorService.getOverview>>;
    processing: ReturnType<typeof metricsService.getJobSummary>;
  };
};

async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function checkRedis(): Promise<boolean | null> {
  if (!env.QUEUE_ENABLED) {
    return null;
  }

  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2_000,
    lazyConnect: true,
  });

  try {
    await redis.connect();
    const response = await redis.ping();
    return response === 'PONG';
  } catch {
    return false;
  } finally {
    redis.disconnect();
  }
}

export class ObservabilityService {
  async getHealth(): Promise<ObservabilityHealthResponse> {
    const [databaseHealthy, redisHealthy] = await Promise.all([
      checkDatabase(),
      checkRedis(),
    ]);

    metricsService.setDatabaseUp(databaseHealthy);
    metricsService.setRedisUp(redisHealthy);

    const jobsOverview = await jobsMonitorService.getOverview();

    const checks = {
      database: databaseHealthy ? ('up' as const) : ('down' as const),
      redis:
        redisHealthy === null
          ? ('skipped' as const)
          : redisHealthy
            ? ('up' as const)
            : ('down' as const),
    };

    const degraded =
      checks.database === 'down' ||
      (env.QUEUE_ENABLED && checks.redis === 'down');

    return {
      status: degraded ? 'degraded' : 'ok',
      service: env.OTEL_SERVICE_NAME,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      openTelemetry: {
        enabled: env.OTEL_ENABLED,
        serviceName: env.OTEL_SERVICE_NAME,
        otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? null,
      },
      metrics: {
        enabled: env.METRICS_ENABLED,
      },
      checks,
      http: metricsService.getHttpSummary(),
      jobs: {
        overview: jobsOverview,
        processing: metricsService.getJobSummary(),
      },
    };
  }
}

export const observabilityService = new ObservabilityService();
