#!/usr/bin/env bash
# Validate staging API endpoints (local Docker or Render URL).
# Usage: BASE_URL=https://supportflow-api-staging.onrender.com ./scripts/validate-staging.sh
#        BASE_URL=http://localhost:3000 ./scripts/validate-staging.sh

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_EMAIL="${SEED_DEMO_ADMIN_EMAIL:-admin.demo@supportflow.com}"
ADMIN_PASSWORD="${SEED_DEMO_ADMIN_PASSWORD:-DemoSupport123!}"
CUSTOMER_ID="${SEED_DEMO_CUSTOMER_ID:-00000000-0000-4000-8000-000000000002}"

pass() { echo "  OK  $1"; }
fail() { echo "  FAIL $1"; exit 1; }

echo "Validating SupportFlow staging API at: $BASE_URL"
echo ""

# Health
code=$(curl -s -o /tmp/sf-health.json -w "%{http_code}" "$BASE_URL/health")
[[ "$code" == "200" ]] && pass "GET /health ($code)" || fail "GET /health ($code)"

code=$(curl -s -o /tmp/sf-ready.json -w "%{http_code}" "$BASE_URL/health/ready")
[[ "$code" == "200" ]] && pass "GET /health/ready ($code)" || fail "GET /health/ready ($code)"
grep -q '"database":"up"' /tmp/sf-ready.json && pass "readiness database=up" || fail "readiness database check"

# Swagger
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/docs/")
[[ "$code" == "200" ]] && pass "GET /api/docs ($code)" || fail "GET /api/docs ($code)"

# Login
login_response=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
echo "$login_response" | grep -qE 'accessToken|refreshToken|"token"' && pass "POST /api/v1/auth/login" || {
  echo "$login_response"
  fail "POST /api/v1/auth/login"
}

TOKEN=$(echo "$login_response" | node -e "
const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
process.stdout.write(d.accessToken || d.token || '');
")
[[ -n "$TOKEN" ]] && pass "accessToken received" || fail "accessToken missing"

AUTH="Authorization: Bearer $TOKEN"

# Tickets
code=$(curl -s -o /tmp/sf-tickets.json -w "%{http_code}" -H "$AUTH" "$BASE_URL/api/v1/tickets")
[[ "$code" == "200" ]] && pass "GET /api/v1/tickets ($code)" || fail "GET /api/v1/tickets ($code)"

create_response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/tickets" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"title\":\"Staging validation ticket\",\"description\":\"Created by validate-staging.sh\",\"customerId\":\"$CUSTOMER_ID\",\"priority\":\"MEDIUM\"}")
create_code=$(echo "$create_response" | tail -1)
[[ "$create_code" == "201" ]] && pass "POST /api/v1/tickets ($create_code)" || {
  echo "$create_response"
  fail "POST /api/v1/tickets ($create_code)"
}

code=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$BASE_URL/api/v1/tickets/summary")
[[ "$code" == "200" ]] && pass "GET /api/v1/tickets/summary ($code)" || fail "GET /api/v1/tickets/summary ($code)"

code=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH" "$BASE_URL/api/v1/tickets/metrics")
[[ "$code" == "200" ]] && pass "GET /api/v1/tickets/metrics ($code)" || fail "GET /api/v1/tickets/metrics ($code)"

echo ""
echo "All staging validations passed."
