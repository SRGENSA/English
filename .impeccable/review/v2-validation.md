# V2 validation — 2026-10-26

- Production build passed. API/content suite: 10 passed, 0 failed. Browser suite: 7 passed, 0 failed. Local fixtures removed (zero remaining accounts).
- 12 screenshots cover home, lessons and speaking across Arabic/light desktop, English/dark desktop, Arabic/dark mobile and English/light mobile. No JS errors or horizontal page overflow. Independent reviewer confirmed all12lesson links reachable in both mobile languages and closed drawer inert; verdict: ship within reviewed MVP scope.
- Production server check exercised English rendering, MP4 byte-range response (206, 256 bytes), actual playback (currentTime advances), seek and ~32-second duration. Simulated Chromium microphone exercised capture, local blob playback controls, and navigation cleanup without JS errors. A separate browser test covers permission denial.
- New content:12original bilingual lessons,24lesson questions plus12existing mixed questions;6original silent text-based MP4 lessons with posters. User voice recordings stay local. No automatic pronunciation score is claimed.
- AI adapter policy tested with mocked provider: English/B1/focus settings, correction policy and prohibition on claiming pronunciation evaluation from transcripts. Live AI responses and real-device audio quality were not validated; configured provider key remains prerequisite. No claim of comprehensive STEP coverage, official affiliation or guaranteed scores.
- No design detector ran because the launcher is absent. DESIGN.md and sidecar capture dark/LTR and curriculum additions with review scope boundaries.
