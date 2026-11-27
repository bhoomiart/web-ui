#!/usr/bin/env zsh
# ─────────────────────────────────────────────────────────────────────────────
# Bhoomi Art — QA Runner
# Called by the Kiro hook after an agent session completes.
# Expects the dev server to be running on http://localhost:3000
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

WORKSPACE="$(cd "$(dirname "$0")/.." && pwd)"
REPORT_DIR="$WORKSPACE/qa/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$REPORT_DIR/qa_run_$TIMESTAMP.log"

mkdir -p "$REPORT_DIR"

echo "──────────────────────────────────────────"
echo "  Bhoomi Art QA Run — $(date)"
echo "──────────────────────────────────────────"

# ── 1. Check dev server is reachable ─────────────────────────────────────────
BASE_URL="${QA_BASE_URL:-http://localhost:3000}"
echo "→ Checking dev server at $BASE_URL …"
if ! curl -s --max-time 5 "$BASE_URL" > /dev/null; then
  echo "✗ Dev server not reachable at $BASE_URL"
  echo "  Please run: npm run dev"
  echo "  Then re-trigger the QA hook."
  exit 1
fi
echo "✓ Dev server is up"

# ── 2. Run Playwright tests ───────────────────────────────────────────────────
echo ""
echo "→ Running Playwright QA tests …"
cd "$WORKSPACE"

npx playwright test \
  --project="Desktop Chrome" \
  --project="Mobile Safari" \
  --reporter=list \
  2>&1 | tee "$LOG_FILE"

PLAYWRIGHT_EXIT=$?

# ── 3. Summary ────────────────────────────────────────────────────────────────
echo ""
echo "──────────────────────────────────────────"
if [ $PLAYWRIGHT_EXIT -eq 0 ]; then
  echo "✅  All QA tests passed"
else
  echo "❌  Some QA tests failed — see report:"
  echo "    $REPORT_DIR/html/index.html"
  echo "    $LOG_FILE"
fi
echo "──────────────────────────────────────────"

# Return playwright exit code so hook can read pass/fail
exit $PLAYWRIGHT_EXIT
