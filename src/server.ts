import './instrumentation.js';

import { bootstrap } from './main.js';
import { shutdownOpenTelemetry } from './modules/observability/infrastructure/opentelemetry.js';

void bootstrap().catch(async (error: unknown) => {
  await shutdownOpenTelemetry();
  console.error(error);
  process.exit(1);
});
