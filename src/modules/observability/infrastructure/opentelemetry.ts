import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
  type SpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { PrismaInstrumentation } from '@prisma/instrumentation';

import { env } from '../../../config/env.js';
import { logger } from '../../../shared/logger/logger.js';

let sdk: NodeSDK | undefined;
let started = false;

function buildSpanProcessors(): SpanProcessor[] {
  const processors: SpanProcessor[] = [];

  if (env.NODE_ENV === 'development' && !env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    processors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  }

  if (env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    processors.push(
      new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: `${env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
        }),
      ),
    );
  }

  return processors;
}

function buildMetricReader(): PeriodicExportingMetricReader | undefined {
  if (!env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    return undefined;
  }

  return new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: `${env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/metrics`,
    }),
    exportIntervalMillis: 60_000,
  });
}

export function initializeOpenTelemetry(): void {
  if (!env.OTEL_ENABLED || started) {
    return;
  }

  if (env.NODE_ENV === 'development') {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
  }

  const spanProcessors = buildSpanProcessors();
  if (spanProcessors.length === 0) {
    logger.warn(
      'OpenTelemetry is enabled but no trace exporters are configured',
    );
  }

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: env.OTEL_SERVICE_NAME,
    }),
    spanProcessors: spanProcessors.length > 0 ? spanProcessors : undefined,
    metricReader: buildMetricReader(),
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new IORedisInstrumentation(),
      new PrismaInstrumentation(),
    ],
  });

  sdk.start();
  started = true;

  logger.info(
    {
      serviceName: env.OTEL_SERVICE_NAME,
      otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? null,
      consoleExporter:
        env.NODE_ENV === 'development' && !env.OTEL_EXPORTER_OTLP_ENDPOINT,
    },
    'opentelemetry.started',
  );
}

export async function shutdownOpenTelemetry(): Promise<void> {
  if (!sdk) {
    return;
  }

  await sdk.shutdown();
  sdk = undefined;
  started = false;
}
