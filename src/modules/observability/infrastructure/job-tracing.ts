import { context, SpanStatusCode, trace } from '@opentelemetry/api';

import { metricsService } from '../application/metrics.service.js';

const tracer = trace.getTracer('supportflow.jobs');

export async function runJobWithTracing<T>(
  queueName: string,
  jobId: string,
  processor: () => Promise<T>,
  parentContext = context.active(),
): Promise<T> {
  const startedAt = Date.now();

  return tracer.startActiveSpan(
    `job.process ${queueName}`,
    {},
    parentContext,
    async (span) => {
      span.setAttribute('job.queue', queueName);
      span.setAttribute('job.id', jobId);

      try {
        const result = await processor();
        const durationMs = Date.now() - startedAt;
        metricsService.recordJobCompletion(queueName, durationMs, 'completed');
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        const durationMs = Date.now() - startedAt;
        metricsService.recordJobCompletion(queueName, durationMs, 'failed');
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Job failed',
        });

        if (error instanceof Error) {
          span.recordException(error);
        }

        throw error;
      } finally {
        span.end();
      }
    },
  );
}
