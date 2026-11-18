#!/usr/bin/env bash
set -euo pipefail

# Detects a PHP >= 8.3 binary on macOS / XAMPP without modifying global system PATH.
CANDIDATES=(
  "$(command -v php || true)"
  "/opt/homebrew/opt/php@8.4/bin/php"
  "/opt/homebrew/opt/php@8.3/bin/php"
  "/opt/homebrew/bin/php"
  "/usr/local/opt/php@8.3/bin/php"
  "/Applications/XAMPP/xamppfiles/bin/php"
)

for bin in "${CANDIDATES[@]}"; do
  if [[ -n "$bin" && -x "$bin" ]]; then
    ver="$("$bin" -r 'echo PHP_VERSION_ID;' 2>/dev/null || echo 0)"
    if [[ "$ver" -ge 80300 ]]; then
      echo "$bin"
      exit 0
    fi
  fi
done

echo "ERROR: No PHP >= 8.3 executable found. Install PHP 8.3+ via Homebrew (brew install php@8.3)." >&2
exit 1
