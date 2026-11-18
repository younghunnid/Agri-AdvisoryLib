# Team 8 — Security Findings Report

**Scope:** `/server.ts`, `/server/security.ts`, `/server/ai.ts`, `/server/routes/v1.ts`, `/php-backend/*`, `/src/*`  
**Note:** No secret values were printed or modified during this audit.

---

## High Severity

### SEC-01: Ephemeral Session Secret Invalidates Sessions on Restart & Weakens IP Hashing
- **Severity:** High
- **Location:** `/server/security.ts:6-12` (`EPHEMERAL_SECRET`, `getSessionSecret`)
- **Details:** When `process.env.SESSION_SECRET` is unset or shorter than 16 characters (as in `/.env.example`), the server generates a random in-memory `EPHEMERAL_SECRET` on boot. Every server restart invalidates all signed `agri_session` cookies and rotates the HMAC salt used for `audit_logs.ip_hash` and `rate_limit_attempts.rate_key`.
- **Impact:** Active farmers, experts, and admins are unexpectedly logged out across restarts/deploys, and rate-limit / audit IP hashes lose continuity.
- **Recommended Fix:** Require a persistent `SESSION_SECRET` (>= 32 chars) in production (fail fast or derive/persist a local secret file for dev-only) and document setup clearly without committing secrets.

### SEC-02: Guest AI Daily Quota Bypassed by Omitting or Clearing `agri_anon` Cookie
- **Severity:** High
- **Location:** `/server/routes/v1.ts:578`, `/server/security.ts:171-176`
- **Details:** Unauthenticated `POST /api/v1/advisor/ask` requests rate-limit by `anon:${req.anonToken || hashIdentifier(req.ip)}`. Because `sessionMiddleware` auto-generates a new `req.anonToken` whenever the `agri_anon` cookie is absent, any automated client or incognito session can bypass the 5/day limit indefinitely by dropping cookies, exhausting `GEMINI_API_KEY` quota.
- **Impact:** Unlimited anonymous AI API calls and potential API cost/quota exhaustion.
- **Recommended Fix:** Enforce **both** a cookie-based quota and a secondary IP-subnet/IP rate limit (`hashIdentifier(req.ip)`) for unauthenticated requests to `/api/v1/advisor/ask`.

### SEC-03: `Secure` Cookie Flag in `NODE_ENV=production` Breaks Local HTTP (`npm start`)
- **Severity:** High
- **Location:** `/server/security.ts:95-104` (`cookieOptions`)
- **Details:** `cookieOptions` sets `secure: req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production'`. Running `npm start` (`NODE_ENV=production`) over plain HTTP (`http://localhost:3000` or LAN IP during a local hackathon demo without TLS) sets `Secure` on `agri_session`, `agri_anon`, and `agri_csrf`, causing non-HTTPS HTTP clients/browsers on LAN IPs to reject session and CSRF cookies.
- **Impact:** Login, registration, and all state-changing CSRF-protected actions fail under local HTTP production mode.
- **Recommended Fix:** Base `secure` strictly on `req.secure || req.headers['x-forwarded-proto'] === 'https'` (or explicit `COOKIE_SECURE=true` env flag), not unconditionally on `NODE_ENV === 'production'`.

---

## Medium Severity

### SEC-04: Missing Content-Security-Policy (CSP), Permissions-Policy & Exposed `X-Powered-By`
- **Severity:** Medium
- **Location:** `/server.ts:17-26` (verified in live `curl -D -` headers)
- **Details:** Live server responses include `X-Powered-By: Express` and omit `Content-Security-Policy` and `Permissions-Policy`.
- **Impact:** Increases attack surface if XSS or clickjacking vectors are introduced later; reveals framework fingerprint.
- **Recommended Fix:** Call `app.disable('x-powered-by')` and set a strict `Content-Security-Policy` (allowing `'self'` and Google Fonts) plus `Permissions-Policy: microphone=(self)`.

### SEC-05: Unconditional `trust proxy = 1` Enables IP Spoofing if Directly Exposed
- **Severity:** Medium
- **Location:** `/server.ts:18`
- **Details:** Express trusts the first `X-Forwarded-For` hop unconditionally, allowing clients connecting directly without a stripping reverse proxy to spoof `req.ip` and bypass IP rate limits on `/auth/login`, `/auth/register`, `/auth/forgot-password`, and `/feedback`.
- **Recommended Fix:** Make `trust proxy` configurable via environment (`TRUST_PROXY`) or restrict to loopback/known proxy CIDRs in local deployments.

### SEC-06: Stateless Session Tokens Not Invalidated on Password Reset or Password Change
- **Severity:** Medium
- **Location:** `/server/routes/v1.ts:524-528`, `/server/security.ts:57-93,107-164`
- **Details:** `POST /api/v1/auth/reset-password` updates `users.password_hash`, and `loadUserById` checks `status === 'active'`, but `agri_session` tokens carry no `password_updated_at` or `token_version` claim. Previously stolen session cookies remain valid for up to 7 days after a password reset.
- **Recommended Fix:** Include a `tokenVersion` column on `users` (incremented on password reset/logout-all) and verify it in `loadUserById` / `verifySessionToken`.

### SEC-07: Admin `allow_public_registration` Setting Not Enforced on `/auth/register`
- **Severity:** Medium
- **Location:** `/server/routes/v1.ts:282`, `/server/seed.ts:505`
- **Details:** `platform_settings` defines `allow_public_registration = 'true'`, editable via `PATCH /api/v1/admin/settings`, yet `POST /api/v1/auth/register` never reads `platform_settings` to block registration when disabled.
- **Recommended Fix:** Check `platform_settings` in `POST /api/v1/auth/register` (and enforce `anon_ai_daily_limit` / `auth_ai_hourly_limit` from `platform_settings`).

### SEC-08: Minimal Prompt Injection Pattern Matching
- **Severity:** Medium
- **Location:** `/server/ai.ts:25-36`
- **Details:** `PROMPT_INJECTION_PATTERNS` checks only 4 narrow English regexes (`ignore previous instructions`, `system prompt`, `reveal api key`, `act as root`). Paraphrasing or non-English phrasing bypasses the regex filter (secondary protection relies on Gemini `systemInstruction` and structured schema).
- **Recommended Fix:** Keep `systemInstruction` isolation and structured schema validation strict, and treat user input as untrusted data wrapped in explicit XML/delimiter boundaries in `promptText`.

### SEC-09: PHP Companion Backend Lacks Rate Limiting & Full Route Parity
- **Severity:** Medium
- **Location:** `/php-backend/public/index.php:75-102`
- **Details:** PHP `/api/v1/auth/login` and `/api/v1/advisor/ask` have no brute-force or AI quota rate limiting, unlike the Node backend.
- **Recommended Fix:** Implement `rate_limit_attempts` PDO checks in PHP Security helper if PHP backend is deployed.

---

## Low Severity

### SEC-10: Admin Mutation Endpoints Return `200 OK` & Log Audits for Non-Existent Target IDs
- **Severity:** Low
- **Location:** `/server/routes/v1.ts:1152-1162, 1249-1267, 1355-1386, 1420-1444`
- **Details:** `UPDATE` queries do not check `.changes > 0` before writing audit logs and returning `{ok: true}`.
- **Recommended Fix:** Return HTTP `404` when `changes === 0` before logging audit events.

### SEC-11: Weak Password Complexity Rule (Length Only)
- **Severity:** Low
- **Location:** `/server/routes/v1.ts:314,503`
- **Details:** Accepts any 8-character string (including `12345678` or `aaaaaaaa`), though `scrypt` hashing is strong.
- **Recommended Fix:** Keep accessible for low-digital-literacy farmers while rejecting trivial common passwords (`12345678`, `password`).

### SEC-12: Dev Password Reset Token Logged to Console in Non-Production
- **Severity:** Low
- **Location:** `/server/routes/v1.ts:488-490`
- **Details:** Logs raw reset token to stdout when `NODE_ENV !== 'production'`. Never exposed in HTTP responses, which is good, but ensure dev logs remain non-public.
