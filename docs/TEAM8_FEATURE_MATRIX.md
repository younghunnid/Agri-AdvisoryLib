# Team 8 — Feature Verification Matrix

| Feature | Implemented | Tested | Working | Issues | Priority |
|---|---|---|---|---|---|
| Homepage (Option C hero, 4 cards, 6 crops, tip) | Yes | Partially (HTTP GET `/public/home`; no browser) | Likely / Unverified visually | `320px` 2-col card density & missing `<html lang>` update | P2 |
| Public Crop Guides Library & Filtering | Yes | Yes (`test:api` + live `curl`) | Yes (online); Partial (offline) | Search/crop/topic filters hidden when offline (`GuidesLibraryPage.tsx:174`) | P1 |
| Guide Detail & Markdown Rendering | Yes | Yes (`test:api` + live `curl`) | Yes | Local `.jpg` images are ~1.2 MB each (heavy on 2G/3G) | P2 |
| Pests & Diseases Hub (`/pests`) | Yes | Partially (HTTP GET `/guides?pest=1`) | Yes (online/offline filter) | None critical; uses shared guide cards | P2 |
| Content Approval Gate (Unpublished hidden) | Yes | Yes (`test:api` + live `curl` 404 check) | Yes | No guide edit/delete route in Admin UI after creation | P2 |
| Live AI Farming Advisor (`Gemini`) | Yes (`server/ai.ts`) | Not verified live (key not in CLI; DB read-only) | **Likely Broken** | Hardcodes invalid model `'gemini-4-hydrogen'` (`server/ai.ts:189`, `AiAdvisor.php:27`) | **P0** |
| AI Advisor Transparent Fallback (`unavailable_demo`) | Yes | Yes (`test:api` + isolated script) | Yes | Returns helpful static guidance + matched guides when key missing/erroring | P1 |
| AI Advisor Rate Limiting (Guest & Farmer) | Yes | Yes (`test:api` guest limit) | Partial | Cookie-based guest limit (`agri_anon`) easily bypassed; ignores Admin limit settings | **P0 / P1** |
| Voice Input (Web Speech STT + Confirm Draft) | Yes (`src/lib/voice.ts`) | **Blocked** (no browser/mic) | Untested | Hardcoded `'en-US'`; no Liberian English/Kpelle/Bassa STT support | P2 |
| Audio Readout (Speech Synthesis TTS) | Yes (`src/lib/voice.ts`) | **Blocked** (no browser/audio) | Untested | Hardcoded `'en-US'`; no voice speed/pitch preference persistence | P2 |
| Language Switcher & Honest Fallback (`EN`, `LRE`, `KPE`, `BAS`) | Partial | Yes (API `lre` & `kpe` verified) | Partial | Only 1 guide (`lre`) & 9 UI strings translated; `<html lang>` not updated | P1 |
| Offline Guide Download & Offline Library (`/offline`) | Yes (`localStorage` + Cache API) | **Blocked** in browser | Untested end-to-end offline | Keyed by `id` only (language overwrite); `.jpg` excluded from SW precache | P1 |
| PWA Manifest, Icons & Service Worker | Yes (`vite-plugin-pwa`) | Partially (`curl` 200 on manifest/sw/icons) | Built & served; reload untested | No browser offline reload test possible in container | P1 |
| Farmer Registration & County Selector (15 Counties) | Yes | Yes (`test:api`) | Yes | Ignores Admin `allow_public_registration` setting (`v1.ts:282`) | P1 |
| Farmer Login, Logout & Session Persistence | Yes | Yes (`test:api`) | Partial | Ephemeral `SESSION_SECRET` logs users out on restart; `Secure` cookie risk on HTTP prod | **P0** |
| Password Reset Flow (`/auth/forgot-password`, `/reset-password`) | Partial | No (untested in `test:api`) | Partial | No SMS/email gateway; reset does not revoke active stateless session cookies | P1 |
| Farmer Workspace (Dashboard, Saved, Questions, Profile) | Yes (5 pages) | Yes (`test:api` isolation & CRUD) | Yes | No pagination; silent error handling on several UI forms | P1 |
| Expert Consultation & Privacy (Phone/Email hidden) | Yes (4 pages) | Yes (`test:api` + code review) | Yes | Only 1 demo expert seeded; experts cannot claim unassigned questions | P2 |
| Admin Console (Overview, Users, Experts, Guides, Review, Qs, Audit, Settings) | Yes (8 pages) | Yes (`test:api` workflow) | **Blocked in live DB** | **0 admin accounts** in `./data/agri_advisory.db`; form labels missing; settings ignored | **P0** |
| PHP 8.3 + MySQL 8 Companion Backend (`php-backend/`, `database/mysql/`) | Partial (7 routes only) | **Blocked** (no `php`, `mysql`, `vendor/`) | Non-functional as parity backend | Missing 20+ API endpoints, 3 MySQL tables, rate limits, and Composer install | P1 / P2 |
| Mobile Responsiveness (`320px`–`1440px`) | Yes (Tailwind responsive) | **Blocked** (no Chromium) | Untested visually | Potential tight spacing on `320px` reply input & 2-col home cards | P1 |
| WCAG 2.2 AA Accessibility | Partial | Static audit only | Partial | Missing `<label>`/`aria-label` on 3 Admin forms; dialogs lack Esc/focus trap | P1 |
