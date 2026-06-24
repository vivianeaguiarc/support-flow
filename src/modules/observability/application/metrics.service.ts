import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from 'prom-client';

import { env } from '../../../config/env.js';

type HttpMetricLabels = {
  method: string;
  route: string;
  statusCode: string;
};

type JobMetricLabels = {
  queue: string;
  status: 'completed' | 'failed';
};

class MetricsService {
  private readonly registry = new Registry();
  private readonly httpRequestsTotal: Counter<
    'method' | 'route' | 'status_code'
  >;
  private readonly httpRequestDurationSeconds: Histogram<
    'method' | 'route' | 'status_code'
  >;
  private readonly httpErrorsTotal: Counter<'method' | 'route' | 'status_code'>;
  private readonly jobsProcessedTotal: Counter<'queue' | 'status'>;
  private readonly jobsFailedTotal: Counter<'queue'>;
  private readonly jobProcessingDurationSeconds: Histogram<'queue' | 'status'>;
  private readonly outboxEventsProcessedTotal: Counter;
  private readonly outboxEventsFailedTotal: Counter;
  private readonly outboxEventsPending: Gauge;
  private readonly redisUp: Gauge;
  private readonly databaseUp: Gauge;
  private httpDurationSumMs = 0;
  private httpRequestCount = 0;
  private httpErrorCount = 0;
  private jobDurationSumMs = 0;
  private jobProcessedCount = 0;

  constructor() {
    if (env.METRICS_ENABLED) {
      collectDefaultMetrics({ register: this.registry });
    }

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDurationSeconds = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.httpErrorsTotal = new Counter({
      name: 'http_errors_total',
      help: 'Total number of HTTP error responses (4xx and 5xx)',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.jobsProcessedTotal = new Counter({
      name: 'jobs_processed_total',
      help: 'Total number of processed jobs',
      labelNames: ['queue', 'status'],
      registers: [this.registry],
    });

    this.jobsFailedTotal = new Counter({
      name: 'jobs_failed_total',
      help: 'Total number of failed jobs',
      labelNames: ['queue'],
      registers: [this.registry],
    });

    this.jobProcessingDurationSeconds = new Histogram({
      name: 'job_processing_duration_seconds',
      help: 'Job processing duration in seconds',
      labelNames: ['queue', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60, 120],
      registers: [this.registry],
    });

    this.outboxEventsProcessedTotal = new Counter({
      name: 'outbox_events_processed_total',
      help: 'Total number of outbox events processed successfully',
      registers: [this.registry],
    });

    this.outboxEventsFailedTotal = new Counter({
      name: 'outbox_events_failed_total',
      help: 'Total number of outbox events moved to failed/dead-letter',
      registers: [this.registry],
    });

    this.outboxEventsPending = new Gauge({
      name: 'outbox_events_pending',
      help: 'Current number of pending outbox events',
      registers: [this.registry],
    });

    this.redisUp = new Gauge({
      name: 'redis_up',
      help: 'Redis connectivity (1 = up, 0 = down or skipped)',
      registers: [this.registry],
    });

    this.databaseUp = new Gauge({
      name: 'database_up',
      help: 'PostgreSQL connectivity (1 = up, 0 = down)',
      registers: [this.registry],
    });
  }

  isEnabled(): boolean {
    return env.METRICS_ENABLED;
  }

  recordHttpRequest(labels: HttpMetricLabels, durationMs: number): void {
    if (!this.isEnabled()) {
      return;
    }

    const promLabels = {
      method: labels.method,
      route: labels.route,
      status_code: labels.statusCode,
    };

    this.httpRequestsTotal.inc(promLabels);
    this.httpRequestDurationSeconds.observe(promLabels, durationMs / 1000);

    const statusCode = Number(labels.statusCode);
    if (statusCode >= 400) {
      this.httpErrorsTotal.inc(promLabels);
      this.httpErrorCount += 1;
    }

    this.httpRequestCount += 1;
    this.httpDurationSumMs += durationMs;
  }

  recordJobCompletion(
    queue: string,
    durationMs: number,
    status: JobMetricLabels['status'],
  ): void {
    if (!this.isEnabled()) {
      return;
    }

    const labels = { queue, status };
    this.jobsProcessedTotal.inc(labels);
    this.jobProcessingDurationSeconds.observe(labels, durationMs / 1000);

    if (status === 'failed') {
      this.jobsFailedTotal.inc({ queue });
    }

    this.jobProcessedCount += 1;
    this.jobDurationSumMs += durationMs;
  }

  recordOutboxProcessed(): void {
    if (!this.isEnabled()) {
      return;
    }

    this.outboxEventsProcessedTotal.inc();
  }

  recordOutboxFailed(): void {
    if (!this.isEnabled()) {
      return;
    }

    this.outboxEventsFailedTotal.inc();
  }

  setOutboxPending(count: number): void {
    if (!this.isEnabled()) {
      return;
    }

    this.outboxEventsPending.set(count);
  }

  async refreshOutboxPendingGauge(): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    const { outboxRepository } =
      await import('../../outbox/infrastructure/repositories/outbox.repository.js');
    const byStatus = await outboxRepository.countByStatus();
    this.setOutboxPending(byStatus.PENDING ?? 0);
  }

  setRedisUp(isUp: boolean | null): void {
    if (!this.isEnabled()) {
      return;
    }

    this.redisUp.set(isUp === null ? -1 : isUp ? 1 : 0);
  }

  setDatabaseUp(isUp: boolean): void {
    if (!this.isEnabled()) {
      return;
    }

    this.databaseUp.set(isUp ? 1 : 0);
  }

  getHttpSummary(): {
    totalRequests: number;
    averageDurationMs: number;
    errorRate: number;
  } {
    return {
      totalRequests: this.httpRequestCount,
      averageDurationMs:
        this.httpRequestCount === 0
          ? 0
          : this.httpDurationSumMs / this.httpRequestCount,
      errorRate:
        this.httpRequestCount === 0
          ? 0
          : this.httpErrorCount / this.httpRequestCount,
    };
  }

  getJobSummary(): {
    processedTotal: number;
    averageProcessingMs: number;
  } {
    return {
      processedTotal: this.jobProcessedCount,
      averageProcessingMs:
        this.jobProcessedCount === 0
          ? 0
          : this.jobDurationSumMs / this.jobProcessedCount,
    };
  }

  async getPrometheusMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }

  resetForTests(): void {
    this.registry.resetMetrics();
    this.httpDurationSumMs = 0;
    this.httpRequestCount = 0;
    this.httpErrorCount = 0;
    this.jobDurationSumMs = 0;
    this.jobProcessedCount = 0;
  }
}

export const metricsService = new MetricsService();
