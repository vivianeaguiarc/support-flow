/**
 * Post-deploy smoke tests for the SupportFlow API.
 *
 * Validates that a published instance answers on its critical endpoints
 * (health, docs, versioned APIs), that authentication works with the demo
 * user, and that the minimal tickets read flow responds.
 *
 * The script is READ-ONLY (it never creates/changes data), so it is safe to
 * run against production.
 *
 * Configuration (environment variables):
 *   SMOKE_BASE_URL        Base URL of the API (default http://localhost:3000)
 *   SMOKE_TIMEOUT_MS      Per-request timeout in ms (default 10000)
 *   SMOKE_ADMIN_EMAIL     Login email (default admin.demo@supportflow.com)
 *   SMOKE_ADMIN_PASSWORD  Login password (default DemoSupport123!)
 *   SMOKE_SKIP_AUTH       "true" to run only public checks (default false)
 *
 * Exits with code 1 if any CRITICAL check fails.
 */

type Json = Record<string, unknown>;

interface RequestResult {
  status: number;
  ok: boolean;
  durationMs: number;
  json?: unknown;
  error?: string;
}

interface CheckResult extends RequestResult {
  name: string;
  critical: boolean;
  passed: boolean;
}

// Use `||` so empty env vars (e.g. unset CI secrets) fall back to defaults.
const baseUrl = (process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(
  /\/+$/,
  '',
);
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 10_000);
const adminEmail =
  process.env.SMOKE_ADMIN_EMAIL || 'admin.demo@supportflow.com';
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || 'DemoSupport123!';
const skipAuth = process.env.SMOKE_SKIP_AUTH === 'true';

const results: CheckResult[] = [];

function asObject(value: unknown): Json | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Json)
    : undefined;
}

async function request(
  method: string,
  url: string,
  init: { headers?: Record<string, string>; body?: string } = {},
): Promise<RequestResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();

  try {
    const response = await fetch(url, {
      method,
      headers: init.headers,
      body: init.body,
      signal: controller.signal,
    });
    const durationMs = Math.round(performance.now() - start);
    const text = await response.text();
    let json: unknown;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch {
      json = undefined;
    }
    return { status: response.status, ok: response.ok, durationMs, json };
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    const message =
      error instanceof Error
        ? error.name === 'AbortError'
          ? `timeout after ${timeoutMs}ms`
          : error.message
        : String(error);
    return { status: 0, ok: false, durationMs, error: message };
  } finally {
    clearTimeout(timer);
  }
}

interface CheckOptions {
  name: string;
  method: string;
  path: string;
  critical?: boolean;
  expectStatus?: number;
  headers?: Record<string, string>;
  body?: string;
}

async function check(options: CheckOptions): Promise<CheckResult> {
  const { name, method, path, expectStatus = 200, critical = true } = options;
  const result = await request(method, `${baseUrl}${path}`, {
    headers: options.headers,
    body: options.body,
  });

  const passed = result.status === expectStatus;
  const checkResult: CheckResult = { ...result, name, critical, passed };
  results.push(checkResult);

  const icon = passed ? '✓' : '✗';
  const label = `${method} ${path}`.padEnd(34);
  const statusText = result.status === 0 ? 'ERR' : String(result.status);
  const flags = [
    passed ? '' : `expected ${expectStatus}`,
    result.error ?? '',
    !passed && critical ? 'CRITICAL' : '',
  ]
    .filter(Boolean)
    .join(' • ');

  console.log(
    `  ${icon} ${label} ${statusText.padEnd(4)} ${result.durationMs
      .toString()
      .padStart(5)}ms${flags ? `  [${flags}]` : ''}`,
  );

  return checkResult;
}

function extractToken(body: unknown): string | undefined {
  const root = asObject(body);
  const data = asObject(root?.data);
  const token = data?.accessToken ?? root?.accessToken ?? root?.token;
  return typeof token === 'string' && token.length > 0 ? token : undefined;
}

function firstTicketId(body: unknown): string | undefined {
  const root = asObject(body);
  const data = Array.isArray(root?.data) ? root.data : undefined;
  const first = asObject(data?.[0]);
  return typeof first?.id === 'string' ? first.id : undefined;
}

async function run(): Promise<void> {
  console.log(`\n▶ Smoke test: ${baseUrl}`);
  console.log(
    `  timeout=${timeoutMs}ms • auth=${skipAuth ? 'skipped' : adminEmail}\n`,
  );

  // --- Public / infrastructure endpoints (critical) ---
  await check({ name: 'liveness', method: 'GET', path: '/health/ready' });
  await check({
    name: 'v1-ready',
    method: 'GET',
    path: '/api/v1/health/ready',
  });
  await check({ name: 'v1-root', method: 'GET', path: '/api/v1/health' });
  await check({ name: 'v2-root', method: 'GET', path: '/api/v2/health' });
  await check({ name: 'docs', method: 'GET', path: '/api/docs' });

  if (skipAuth) {
    console.log('\n  (auth + tickets checks skipped via SMOKE_SKIP_AUTH)');
    return;
  }

  // --- Authentication (critical) ---
  const login = await check({
    name: 'login',
    method: 'POST',
    path: '/api/v1/auth/login',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });

  if (!login.passed) {
    console.log('\n  (skipping authenticated checks — login failed)');
    return;
  }

  const token = extractToken(login.json);
  results.push({
    name: 'token',
    critical: true,
    passed: Boolean(token),
    status: login.status,
    ok: Boolean(token),
    durationMs: 0,
  });
  console.log(
    `  ${token ? '✓' : '✗'} access token in response          ${
      token ? 'ok' : 'MISSING'
    }${token ? '' : '  [CRITICAL]'}`,
  );

  if (!token) return;

  const authHeader = { Authorization: `Bearer ${token}` };

  await check({
    name: 'me',
    method: 'GET',
    path: '/api/v1/auth/me',
    headers: authHeader,
  });

  // --- Minimal tickets read flow ---
  const tickets = await check({
    name: 'tickets-list',
    method: 'GET',
    path: '/api/v1/tickets',
    headers: authHeader,
  });

  const ticketId = firstTicketId(tickets.json);
  if (ticketId) {
    await check({
      name: 'ticket-by-id',
      method: 'GET',
      path: `/api/v1/tickets/${ticketId}`,
      headers: authHeader,
      critical: false,
    });
  } else {
    console.log('  - ticket by id skipped (no demo tickets available)');
  }
}

await run();

const passed = results.filter((result) => result.passed).length;
const failed = results.filter((result) => !result.passed);
const criticalFailures = failed.filter((result) => result.critical);

console.log(
  `\nSummary: ${passed} passed, ${failed.length} failed` +
    (criticalFailures.length ? ` (${criticalFailures.length} critical)` : ''),
);

if (criticalFailures.length > 0) {
  console.error(
    `\nSmoke test FAILED: ${criticalFailures
      .map((result) => result.name)
      .join(', ')}`,
  );
  process.exit(1);
}

console.log('\nSmoke test passed.');
