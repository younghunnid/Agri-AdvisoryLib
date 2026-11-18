# Phase 1 UI/UX Specification — Option C Design System

## Color & Typography Tokens

- **Primary Green:** `#16803C` (hover `#116630`)
- **Canvas Background:** `#F3F8F0`
- **Dark Ink Text:** `#183B2B`
- **Gold Accent:** `#F5B942`
- **Card Surface:** `#FFFFFF`
- **Soft Green Surface:** `#DDEFE0`
- **Typography:** `Plus Jakarta Sans` (display headings), `DM Sans` (body), `JetBrains Mono` (tabular numerals/codes)

## Inclusivity & WCAG 2.2 AA Targets

- Minimum `44px × 44px` interactive hitboxes across navigation buttons, filters, language controls, and form inputs.
- Visible `3px` `#16803C` focus rings (`*:focus-visible`) and a keyboard "Skip to main content" link.
- Respects `prefers-reduced-motion: reduce`.
- No flags used to represent languages; language selector displays explicit short code, name, and review status (`EN · English`, `LRE · Liberian English (Preview)`, `KPE · Kpelle (Soon)`).
- Online/offline status pairs icons (`Wifi` / `WifiOff`) with explicit text labels (`Online` / `Offline`).
- Mobile navigation places `Home`, `Ask`, `Guides`, and `More` in a thumb-reachable fixed bottom bar (`md:hidden`).
