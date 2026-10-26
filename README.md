# طلاقة — English learning and STEP practice

Arabic RTL learning MVP with a daily dashboard, text tutor adapter, browser-assisted speech, STEP practice, vocabulary and persistent learner accounts. The repository was empty at onboarding; this is the first implementation, not a finished commercial launch.

## Development

Requires **Node.js 24.19+** (built-in SQLite and proxy-aware fetch) and npm 11.

```sh
cd /workspace/English
npm ci --cache /workspace/.npm-cache --no-audit --no-fund
npm run dev
```

Vite runs on port 5173 and proxies `/api` to the Node server on 3001. `npm run dev` starts both. Do not create worktrees: each cloud task is already isolated; use the existing checkout.

```sh
npm run build
npm test
npm run test:browser
```

Browser tests require the Chromium executable at `/usr/bin/chromium` in this cloud environment. For another machine, adapt `playwright.config.js` to its installed verified browser. Font files are bundled from npm and require no external font CDN. There are no Docker or auxiliary database services.

## AI and voice

Create `.env` from `.env.example` for local use, or supply **LEARNING_AI_KEY** securely through environment settings, with HTTPS access to **api.openai.com**. Never put credentials in chat or frontend code. Node's `--use-env-proxy` preserves managed proxy authentication and CA verification. Optional `LEARNING_AI_MODEL` defaults to `gpt-4.1-mini`.

`GET /api/health` reports service readiness and whether a key is present (not whether provider authorization succeeds). Without it, the UI explicitly reports that the tutor is disabled and offers a **fixed educational example**. With it, signed-in learners can POST bounded history to `/api/chat`; the provider receives a tutoring policy and user messages. A per-IP limit is present. Live provider behavior cannot be validated until a usable key and destination access exist. Provider outages and malformed requests return explicit errors.

Voice mode now uses a **direct WebRTC Realtime audio session**. The browser obtains microphone permission, exchanges SDP through authenticated `/api/realtime`, and receives the tutor's audio track. Text chat is a separate mode with its own composer. The server keeps the provider key private, limits session starts and sends the level/topic teaching policy. Configure `LEARNING_AI_KEY` with Realtime access and billing; optional `LEARNING_REALTIME_MODEL` defaults to `gpt-realtime`. The same api.openai.com destination is used. Sessions have an in-app ten-minute timeout and close microphone tracks on hangup or navigation. Live provider negotiation/audio remains unverified without credentials. A mocked SDP exchange does not prove a live call works.

Pronunciation examples and the separate self-recording workshop still use browser playback/local recording. Those recordings are not sent to the voice API. During a live Realtime call, microphone audio is sent to the provider as disclosed beside the start control.

## Accounts and persistence

SQLite is created at `data/talaqa.sqlite` (ignored by Git), overridable with `TALAQA_DB_PATH`. Accounts use unique email addresses, scrypt password hashes with independent random salts, random sessions stored as hashes, HttpOnly/SameSite cookies, cross-origin write rejection and rate limits. Progress sync excludes chat transcripts. Local guests can practice without accounts; logging into an existing account loads its saved progress. A new account imports local practice.

`data/` must be on a persistent volume in deployment and included in backups. Do not publish a cloud snapshot containing real learner data. Set `NODE_ENV=production` behind HTTPS so cookies become Secure. Keep frontend and API on the same origin. There is no password reset or email verification yet; this is a pilot account system.

## Production start

```sh
npm run build
npm start
```

The Node server serves `dist` and the API on port 3001 (or `PORT`). Frontend routes use hashes and survive refresh/browser navigation. In a deployed environment terminate TLS in front of the app, retain the database, configure actual AI credentials and provider spending limits, and add email verification/recovery, operational monitoring and an appropriate privacy policy before a public commercial launch.

## Scope and validation

- 36 original questions (12 mixed questions plus 24 lesson questions) across grammar, reading, vocabulary and browser-read listening, with explanations. Not an official exam bank or a full mock STEP exam. Scores describe only the attempted set.
- 6 vocabulary cards, actual local/account history, target editing and useful empty/error states.
- Proposed free and SAR 49/month plans are **illustrative**. No payment is collected. Checkout, subscription enforcement and payment webhooks are not implemented.
- Automated API tests cover validation, missing credentials, a mocked provider adapter, accounts, persistence, session invalidation and origin checks. Browser tests exercise workflows and mobile layout. Mocked AI success does not establish real provider readiness.

See `BUSINESS.md` for launch priorities. Environment configuration is saved as a draft for review; saving is not publication or a production deployment.

## Render pilot deployment

`render.yaml` configures a free Node web service with the pinned Node version,
build command, startup and health check. Once this code is in the connected
GitHub repository, use Render's **New → Blueprint** with that repository and
review the free service before deploying. Render assigns the actual public URL;
no URL is reserved or guaranteed by this file.

**The free blueprint is a temporary pilot:** its SQLite file is under `/tmp` and
is lost on instance replacement or restart. The application shows this limitation.
Browser-local practice remains available. Durable real accounts require a
persistent database/storage configuration before a public launch. This blueprint
does not enable AI, payment, or email recovery. Add the AI key only through
Render's secure environment settings when ready. Creating a Render account alone
does not authorize this agent to create a service in it.

## Expanded learning release

The interface and explanations support Arabic/English with persistent language and light/dark choices. Arabic uses RTL, English LTR. Translation is implemented in an automatic React JSX-runtime adapter (`src/i18n`) rather than DOM mutation; user messages and names opt out of translation.

`src/courses.js` holds 12 original bilingual modules: present simple, present continuous, past simple, present perfect, future forms, articles, prepositions, countability, comparisons, passive, conditionals and speaking practice. Each has a rule, examples, a corrected mistake and two explained questions. Lesson completion marks are browser-local; quiz results use existing account sync.

Twelve original silent MP4 lessons and posters ship under `public/lessons/`. These are text-based visual lessons, not narrated teacher recordings. Reproduce with `node scripts/generate-lesson-videos.mjs` after installing dependencies; this authoring step also needs system Chromium and ffmpeg. Generated MP4 files are committed, so Render does not need those tools. The server serves byte ranges for seeking.

Speaking practice uses local MediaRecorder recording/playback and browser speech examples. Recordings are not uploaded or automatically graded. It requires browser microphone permission and HTTPS. Tutor settings include CEFR level and session focus; the server adapts its teaching policy and prioritizes useful corrections, examples and a follow-up question. Real model quality remains unvalidated without a service key.

## Supplemental generated bank

`src/questionBank.js` defines **100,000 distinct compositional grammar drill prompts**, not 100,000 independently authored or pedagogically reviewed exam questions. The catalog combines 100 verb phrases, 16 subjects, 8 grammar families and time contexts, with easy/medium/hard pattern labels. Difficulty is not officially calibrated. Drills are generated on demand; the UI samples ten matching the selected filters and records the result. The existing 36 authored mixed/lesson questions remain separate.

`node scripts/export-question-bank.mjs /tmp/talaqa-generated-bank.ndjson` materializes the complete catalog. The committed gzip NDJSON download is `public/generated-bank.ndjson.gz`. Tests verify all 100,000 stems are distinct and have four distinct options, but this is a structural audit, not an independent semantic review. Twelve foundation lessons with twelve short silent visual clips do not constitute a complete English/STEP curriculum. That larger editorial curriculum and an independently reviewed varied 100k exam bank remain outstanding.
