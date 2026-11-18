# Phase 1 Known Issues & Limitations

1. **External AI Provider Key Required for Live AI:** Without a valid server-side `GEMINI_API_KEY`, `/advisor` operates in transparent `unavailable_demo` mode returning structured static guide recommendations rather than simulated live AI.
2. **Browser Speech Recognition Scope:** Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) is browser-dependent (primarily Chromium/Edge/Safari) and does not natively recognize Liberian English, Kpelle, or Bassa. Standard text input remains fully available.
3. **Password Reset Delivery:** Automated SMS and email gateways are not configured in Phase 1. Reset requests log tokens only to non-production server console output and never display reset links in the browser.
4. **Sample Agricultural Content:** All included guides are clearly marked as sample demonstration content pending formal review by certified Liberian agricultural specialists.
5. **Local Language Coverage:** Kpelle (`kpe`) and Bassa (`bas`) are marked Coming Soon; Liberian English (`lre`) includes reviewed preview strings and falls back cleanly to English wherever translations are unreviewed.
6. **Dual Backend Environments:** The live AI Studio container runs the Node.js + Express + `node:sqlite` implementation on port 3000; the PHP 8.3 + MySQL 8 companion backend in `php-backend/` and `database/mysql/` is provided for local macOS/XAMPP execution.
