# Forka Apps (erp.forka.com): notes for Claude

Owner: Khaled Alamer, CEO of Forka Collective (F&B group: UAE branches Sharjah, Fujairah, Umm Al Quwain, Mayar Cafe, Ajman Central Store, plus Oman). Read this before any change.

## Standing rules (Khaled)
- Never change the live site, and never push to main, unless Khaled says "add it" / "go live" for that change. Build and test on a branch first and show him.
- No emojis in any app. Use text labels and simple glyphs (← → ✓ ✕) or SVG line icons.
- Forka brand: charcoal #2B2B2B, paper/off-white, bronze #8C6A3F. Headings in EB Garamond, text in Inter Tight, Arabic in IBM Plex Sans Arabic.
- Every screen in English and Arabic (RTL). Plain English, because many staff read English as a second language.
- Procurement sides are called Purchasing and Operations, never "Planning".
- Required fields show red when they block saving or the next step.
- An active CEO opens every app and every section automatically (ceoAll_ in server/Accounts.gs). Never make the CEO tick access for himself.
- Never put secrets in the repo. config.js holds public settings only.

## What lives where
- erp.forka.com = this repo on GitHub Pages (CNAME). Every push to main runs .github/workflows/test-and-deploy.yml. The site publishes only if all checks pass. tools/build_site.sh builds the public files. Moving to Firebase Hosting (project forka-apps, site forka-erp, test address https://forka-erp.web.app): steps in HOSTING-FIREBASE.md; not live until Khaled says "go live".
- app/ = the Forka App in React + TypeScript, replacing the HTML pages one by one (hub and Board done; Hire, careers copy, help still HTML and copied in; Board's logic is app/src/board/core.ts, not type-checked yet). Test address https://forka-erp-next.web.app; steps in app/README.md. Not live until Khaled says "go live". New work goes into app/, not into the HTML pages.
- index.html: the hub (sign-in, app tiles, People and access, "On this device": install the app + turn on notifications). manifest.webmanifest + sw.js make erp.forka.com an installable app (PWA) for the whole site; sw.js never touches the servers or config.js. Notifications: the device address is sent to the server (action pushSubscribe) only once PUSH_PUBLIC_KEY is set in config.js; sending (Board mentions, CEO approvals, LPOs, new applications) is still to build on the platform server. hiring/: the Hiring app. apply/: a copy of the careers page (apply.forka.com is the forka-apply repo).
- server/Accounts.gs = Apps Script "Forka Apps - Accounts server" (its only file is Code.gs). Sheet "Forka Apps - Accounts" 1YkqcYwtKcm4mOz-wJGLvSPAeEYGzPxqLep_SzRGOCCA, tabs People / Requests / Activity. PINs are stored as salted hashes only.
- server/Hiring.gs = Apps Script bound to the Sheet "Forka Hiring" (1U_1G9okE9chorTYVollXyOSaKi5GocJWp5-VZUpUfNo). The web app address is HIRING_URL in config.js.
- server/Boards.gs = Apps Script "Forka Boards server", bound to the Sheet "Forka Boards" (tab Data: one row per board, list, card, message, goal...). Asks the accounts server who people are; reads the accounts Sheet for the list of people; files in a private Drive folder. Web app address = BOARDS_URL in config.js (empty = Boards stays the sample-data preview). Departments and heads are set by the CEO in Boards > People.
- Google sign-in client 443945615318-21aveveme3c8n41fepp4gmof3vnrs8if.apps.googleusercontent.com (Google Cloud project "Forka Apps", origin https://erp.forka.com).
- platform/ = the new Forka Apps server (Node + one PostgreSQL in the Firebase project "forka-apps", Cloud Run). It replaces the Apps Script servers one by one with the same requests and answers: Accounts built, then Boards (goes live with Accounts), Hiring, Procurement. Steps in platform/README.md. Not live until Khaled says "go live".
- Apps Script changes do NOT deploy from GitHub. Khaled pastes the file into the script project, then Deploy > Manage deployments > pencil > New version (keeping the same web address). Tell him exactly which project and which file. Never let him choose "New deployment".

## Checks (run before every push)
node tests/server_test.js · node tests/hiring_server_test.js · node tests/boards_server_test.js · python3 tests/ci_test.py · python3 tests/hiring_test.py · python3 tests/boards_test.py · python3 tests/boards_live_test.py · python3 tests/pwa_test.py · TEST_DATABASE_URL=... node tests/platform_accounts_test.mjs (skips without a database) · cd app && npm run build && npm test · SITE_ROOT=app/dist for the four Board test files (tests/live_test.py runs in CI)

## Rollback
Website: revert the commit on main. Apps Script: Manage deployments > pencil > choose the previous version.

## Open items (8 Nov 2026)
- Confirm the team in People and access (everyone except Khaled starts "To confirm").
- Give oman@forka.com (Mr. Tamer, Oman manager) Procurement with the Oman store section.
- Hiring: set the HR_EMAILS script property. Rename the Hiring script project from "Untitled project".
