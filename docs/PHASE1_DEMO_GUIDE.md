# Phase 1 Hackathon Demonstration Guide — Team 8

## Synthetic Demonstration Accounts

Seeded automatically on startup for hackathon testing (no admin credentials are hardcoded; bootstrap admin via `npm run db:bootstrap-admin`):

- **Demo Farmer:** Phone `+231770000101` / Password `FarmerDemo!2026` (Martha Kollie, Bong County)
- **Demo Approved Expert:** Phone `+231770000201` / Password `ExpertDemo!2026` (Samuel Tarnue, Bong County)
- **Administrator:** Bootstrap your own secure admin account via:
  ```bash
  npm run db:bootstrap-admin -- --phone +231770000900 --name "Team 8 Admin" --password "<StrongPass123>"
  ```

## 12-Step Repeatable Demonstration Flow

1. **Mobile Homepage:** Open `/` on mobile or desktop, inspect the Option C hero (`What farming help do you need?`) and 4 learning cards (`Crops`, `Pests`, `Guides`, `Offline`).
2. **Browse Cassava Guide:** Tap `Guides` -> filter by `Cassava` -> open `Cassava Yellow Leaves & Mosaic Awareness (Sample Guide)`.
3. **Download Guide Offline:** Tap `Download for Offline Use`, then open `/offline` to see it listed with version & storage size.
4. **Read Offline:** Toggle Offline mode in Browser DevTools (`Network -> Offline`) and open the guide from `/offline`—confirm the text and cached asset still load cleanly while the Offline banner clearly notes live AI/expert messaging require internet.
5. **Reconnect:** Switch DevTools back to `Online`.
6. **Ask Agricultural Question:** Open `/advisor`, select `Cassava`, and ask: `"My cassava leaves are turning yellow. What should I do?"` (via text or browser voice preview + Confirm).
7. **Review Qualified AI Guidance:** Inspect the structured response (`Possible Causes`, `Clarifying Checks`, `Practical Low-Risk Steps`, `When to Seek Expert Help`, `Uncertainty Note`). If `GEMINI_API_KEY` is configured, live Gemini guidance appears; otherwise, the honest Demo/Unavailable notice displays matching static guides.
8. **Farmer Login or Registration:** Sign in as `+231770000101` or register a new farmer selecting any of Liberia's 15 counties.
9. **Submit Expert Question:** Visit `/experts` or `/farmer/expert-requests` and submit a crop problem.
10. **Admin Assign & Expert Response:** Sign in as Admin (`/admin/questions`) to assign the question to `Samuel Tarnue`, then sign in as Expert (`/expert/questions`) and publish an answer.
11. **Farmer Reads Response:** Sign back in as Farmer and open `/farmer/questions` to read the official expert reply.
12. **Admin Audit Review:** Open `/admin/reports` to inspect the timestamped audit trail and community feedback.
