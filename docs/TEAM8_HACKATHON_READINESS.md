# Team 8 — Hackathon Demonstration Readiness Assessment

**Overall Verdict:** **CONDITIONALLY READY — 2 P0 BLOCKERS MUST BE RESOLVED BEFORE LIVE DEMO**

The core React UI, SQLite persistence, RBAC workflows, CSRF protection, and PWA shell are cleanly implemented and pass backend API tests. However, **two P0 blockers** threaten the live hackathon demo: (1) an invalid hardcoded Gemini model ID (`'gemini-4-hydrogen'`) in `server/ai.ts`, and (2) **zero admin user accounts** currently bootstrapped in `./data/agri_advisory.db`. Additionally, mobile viewport rendering (`320px`–`1440px`), real offline SW reloads, and real browser voice recognition were not executable in this container and must be smoke-tested on a real phone/browser before judging.

---

## Step-by-Step Evaluation of the 14-Step Hackathon Demo Flow

| Step | Demo Action | Current Status | Evidence / Blocker |
|---|---|---|---|
| 1 | Open mobile homepage (`/`) | **Implemented (Browser Untested)** | `/api/v1/public/home` returns 200 with 6 crops & daily tip; 320px viewport not tested due to missing Chromium |
| 2 | Tap Voice Ask / Ask Question | **Implemented (Mic Untested)** | Routes to `/advisor?voice=1` and `/advisor`; Web Speech STT requires real browser microphone |
| 3 | Browse Cassava Yellow Leaves guide (`/guides`) | **Implemented & Verified** | Live `curl` returns 7 approved guides; unpublished guides return 404 |
| 4 | Download guide for offline reading | **Implemented (Browser Untested)** | `saveGuideOffline` stores JSON in `localStorage` + Cache API; needs browser verification |
| 5 | Switch browser offline & reload guide from `/offline` | **Blocked / Untested in Browser** | SW (`dist/sw.js`) and manifest serve 200, but offline reload cannot run without Chromium |
| 6 | Reconnect & submit agricultural question on `/advisor` | **At Risk (Likely Broken Live AI)** | `server/ai.ts:189` calls `model: 'gemini-4-hydrogen'`; likely triggers error fallback to `unavailable_demo` instead of live Gemini advice |
| 7 | Listen to response via TTS ("Listen") | **Implemented (Audio Untested)** | `speakText` implemented in `src/lib/voice.ts`; requires browser speaker check |
| 8 | Switch language to Liberian English (`LRE`) | **Implemented & Verified (Partial)** | API serves reviewed `lre` Cassava guide (`?lang=lre`) & `kpe` falls back to English; only 9 UI keys & 1 guide are translated |
| 9 | Register or sign in as Farmer (`+231770000101`) | **Implemented & Verified** | Demo farmer exists in `./data/agri_advisory.db`; registration & login verified in `tests/api.test.ts` |
| 10 | Submit question to Agricultural Expert (`/experts`) | **Implemented & Verified** | `POST /api/v1/farmer/questions` verified in `tests/api.test.ts` |
| 11 | Sign in as Admin & assign question (`/admin/questions`) | **BLOCKED (P0)** | **Zero admin accounts exist** in `./data/agri_advisory.db`; requires running `npm run db:bootstrap-admin` before demo |
| 12 | Sign in as Expert (`+231770000201`) & publish answer | **Implemented & Verified** | Demo approved expert `Samuel Tarnue` exists in DB; `/expert/questions/:id/respond` verified in `tests/api.test.ts` |
| 13 | Sign back in as Farmer & read answer (`/farmer/questions`) | **Implemented & Verified** | Farmer thread view & follow-up replies verified in `tests/api.test.ts` |
| 14 | Open Admin Reports & Audit Logs (`/admin/reports`) | **BLOCKED (P0)** | Same P0 admin bootstrap blocker; currently `audit_logs` has 0 rows |

---

## Pre-Demo Readiness Checklist (Required Before Judging)

1. **Fix AI Model ID (`P0`):** Update `gemini-4-hydrogen` to `gemini-2.5-flash` in `server/ai.ts:189` (and `php-backend/src/AiAdvisor.php:27`) and verify a live `/advisor` question returns `providerMode: 'live_gemini'`.
2. **Bootstrap Admin User (`P0`):** Run `npm run db:bootstrap-admin` against `./data/agri_advisory.db` so Steps 11 & 14 work cleanly.
3. **Configure Persistent `SESSION_SECRET` (`P0`):** Set `SESSION_SECRET` (>= 32 chars) in runtime environment if restarts happen, and fix `cookieOptions` `Secure` handling if running `npm start` over plain HTTP.
4. **Physical Mobile + Offline Smoke Test (`P1`):** Test on Chrome Android / Safari iOS at `360px`–`390px`: download Cassava guide, enable Airplane Mode, reload `/offline`, open guide, and test `"Tap to Speak"` + `"Listen"`.
