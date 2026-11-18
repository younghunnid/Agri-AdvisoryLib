# Team 8 — Prioritized Repair Plan

Do **not** apply these changes without explicit user approval (per read-only audit rules).

---

## P0 — Must Fix Before Demonstration

1. **Replace Invalid Gemini Model ID (`server/ai.ts:189`, `php-backend/src/AiAdvisor.php:27`)**
   - **Issue:** Both files hardcode `'gemini-4-hydrogen'`, which is not a valid Gemini API model identifier and will cause live AI calls to fail and fall back to `unavailable_demo`.
   - **Fix:** Update to `'gemini-2.5-flash'` (or `process.env.GEMINI_MODEL || 'gemini-2.5-flash'`) and verify live `POST /api/v1/advisor/ask` returns `providerMode: 'live_gemini'` with structured agricultural output.
2. **Bootstrap an Administrator Account in `./data/agri_advisory.db`**
   - **Issue:** Live DB currently has `0` admin users, blocking Demo Steps 11 & 14 (`/admin/questions`, `/admin/reviews`, `/admin/reports`).
   - **Fix:** Run `npm run db:bootstrap-admin` with strong non-hardcoded demo-day credentials before demonstration.
3. **Fix Cookie `Secure` Flag & Persistent `SESSION_SECRET` Handling (`server/security.ts:6-12, 95-104`)**
   - **Issue:** Unset `SESSION_SECRET` generates a new ephemeral secret per restart (logging out all users), and `NODE_ENV=production` forces `Secure` cookies even over plain `http://localhost:3000`.
   - **Fix:** Set `secure: req.secure || req.headers['x-forwarded-proto'] === 'https'` (plus optional `COOKIE_SECURE=true`), and require/configure a persistent `SESSION_SECRET` in runtime env.
4. **Harden Guest AI Rate Limit Against Cookie Clearing (`server/routes/v1.ts:578`)**
   - **Issue:** Deleting or omitting the `agri_anon` cookie bypasses the 5/day anonymous AI limit.
   - **Fix:** Enforce a combined `anonToken` cookie check AND `hashIdentifier(req.ip)` IP rate limit on unauthenticated `POST /api/v1/advisor/ask` calls.

---

## P1 — Important Improvements (Quality, Security, Accessibility & UX)

1. **Wire Admin `platform_settings` to Runtime Behavior (`server/routes/v1.ts:282, 564-565`)**
   - **Issue:** `anon_ai_daily_limit`, `auth_ai_hourly_limit`, `allow_public_registration`, `default_language`, and `liberian_english_mode` can be edited in `/admin/settings` but are ignored at runtime.
   - **Fix:** Read active limits and registration flag from `platform_settings` with safe env fallbacks.
2. **Fix WCAG 2.2 AA Form Labels, Dialog Focus Trap, Touch Targets & `<html lang>` (`src/pages/admin/*`, `src/components/Layout.tsx`, `src/components/PWAInstallButton.tsx`, `src/context/AppContext.tsx`)**
   - Add `<label>`/`aria-label` to all inputs/selects in `CropGuideManagementPage.tsx`, `ExpertManagementPage.tsx`, and `AdvisoryContentReviewPage.tsx`.
   - Add `Escape`-key close, focus trap, and trigger focus restoration to modals in `Layout.tsx` and `PWAInstallButton.tsx`.
   - Sync `document.documentElement.lang` when `language` changes; increase `40px` chips/buttons (`FarmerManagementPage.tsx`, `AdvisorPage.tsx`) to `44px`; darken low-contrast `text-[#183B2B]/65` to `/75`+.
3. **Add Error Feedback Banners Across Farmer, Expert & Admin Forms**
   - Wrap mutations in `CropGuideManagementPage`, `AdvisoryContentReviewPage`, `FarmerManagementPage`, `QuestionManagementPage`, `SavedAdvicePage`, `ProfilePreferencesPage`, `ExpertProfilePage`, `MyQuestionsPage`, and `GuidesLibraryPage` with accessible `role="alert"` error banners.
4. **Offline & Mobile 320px Refinements**
   - Key `localStorage` offline guides by `${guide.id}:${languageCode}` (or keep language selector aware) so saving `lre` doesn't clobber `en`.
   - Allow client-side search/filter on already-downloaded guides when offline in `GuidesLibraryPage.tsx`.
   - Add `min-w-0` on `MyQuestionsPage.tsx:152` flex input so 320px phones don't overflow, and verify all 7 viewports (`320px`–`1440px`) + SW offline reload on a real browser/phone.
5. **Security Headers, `token_version` & Non-Existent ID Guards (`server.ts`, `server/routes/v1.ts`)**
   - Disable `X-Powered-By`, add `Content-Security-Policy` & `Permissions-Policy`, make `trust proxy` configurable, add `token_version` invalidation on password reset, and return `404` when admin `UPDATE` affects `0` rows.

---

## P2 — Can Wait Until After the Hackathon

1. **PHP 8.3 + MySQL 8 Backend Parity (`php-backend/`, `database/mysql/`)**
   - Port the remaining 20+ `/api/v1` endpoints, add `advisor_conversations`, `password_resets`, `platform_settings` to `database/mysql/001_initial_schema.sql`, implement PDO rate limiting, and install Composer dependencies.
2. **Expand Liberian English, Kpelle & Bassa Localization + Voice**
   - Translate remaining 6 sample guides and full UI dictionary (`i18n.ts`), and integrate community-recorded audio clips for low-literacy & local-language users where Web Speech API lacks Kpelle/Bassa support.
3. **Optimize Crop Image Payloads (`src/assets/images/`)**
   - Compress/resize the five ~1.2 MB JPEGs (`5.45 MB` total) to ~80–150 KB WebP/JPEG variants and include them in Workbox precache for faster 2G/3G loads.
4. **Database Pagination & Retention Cleanup**
   - Add `LIMIT`/`OFFSET` pagination on admin/farmer/expert lists and periodic pruning of expired `rate_limit_attempts` / `password_resets` rows.
5. **Expand Automated Test Coverage**
   - Add unit/integration tests for password reset, profile updates, guide creation/review, and Playwright E2E tests (mobile `320px`–`1440px` + SW offline reload).
