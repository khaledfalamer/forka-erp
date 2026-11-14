# Forka App in React + TypeScript (app/)

The Forka App pages are moving from hand-written HTML to **React + TypeScript** (the same language as the People app
skeleton), one piece at a time.

**Moved so far:**
- **Hub** (`/`, `src/`): sign-in, app tiles, CEO numbers, People and access, Activity, install the app and notifications.
  Same look, same accounts server. Fully typed React.
- **Board** (`/boards/`, `src/board/`): every screen. Same look, same Board server, same behaviour; passes all 249
  existing Board checks (`tests/boards_*.py`, run with `SITE_ROOT=app/dist`). How it is built, for now:
  - `core.ts` is the original page's logic (data, permissions, saving, every action), moved unchanged. It is not
    type-checked yet (`// @ts-nocheck`); types are added step by step.
  - `views/*.tsx`, `Shell.tsx`, `ui.tsx`: every screen in React (JSX), element for element as before.
  - Every change redraws the whole page (`render()` in core), as the original did. Next steps: give core proper types,
    then let screens redraw only what changed.

- **Hire** (`/hiring/`, `src/hire/`): every screen. Same look (30 of 30 test screenshots match the old page pixel for
  pixel, apart from a clock time), same Hiring server; passes all 183 existing Hire checks (`tests/hiring_test.py`,
  `hire_sidebar_test.py`, `hire_redesign_test.py`, run with `SITE_ROOT=app/dist`). Built like Board: `core.ts` is the
  original logic (with the Arabic text layer), not type-checked yet; `views/*.tsx` are the screens. Hire draws each area
  of the page on its own (`paint()` in `paint.tsx`, the React version of `area.innerHTML = ...`). The page skeleton
  (menu frame, header) is plain HTML in `hiring/index.html`. The two small question boxes (`ask`, `sure`) are still built
  as page text in core.

Not moved yet, copied in unchanged by `scripts/add_legacy.sh`: the careers copy
(`apply/`), the team guide (`help/`), privacy and about pages. Each one is removed from that list when its React
version replaces it.

**Not live.** erp.forka.com still runs the HTML hub. Test address: **https://forka-erp-next.web.app** (Firebase site
`forka-erp-next` in project `forka-apps`). Nothing changes on erp.forka.com until Khaled says "go live".

## Layout

- `src/App.tsx` sign-in flow, session, the screens and the CEO actions.
- `src/components/` Gate (sign-in), Home (top bar, greeting, CEO numbers, tiles, On this device), People (People and access, person form, Activity).
- `src/words.ts` every word in English and Arabic (copied from the live hub). `src/i18n.tsx` language switch.
- `src/api.ts` the accounts server (address from `/config.js`). `src/demoServer.ts` made-up people for demo mode and tests only.
- `src/styles/hub.css` the live hub's styles, unchanged.

## Commands (Node 22 or newer)

```bash
cd app && npm ci
npm run build      # type check, build to dist/, add the pages not moved yet
npm test           # 49 hub browser checks in demo mode (made-up people)
cd .. && SITE_ROOT=$PWD/app/dist python3 tests/boards_test.py   # Board checks against this build (also boards_redesign_test, board_sidebar_test, boards_live_test)
```

## Publish to the test address (Cloud Shell, project forka-apps)

```bash
cd forka-erp && git pull && cd app
npx -y firebase-tools@latest hosting:sites:create forka-erp-next --project forka-apps   # once
npx -y firebase-tools@latest deploy --only hosting --project forka-apps
```

Google sign-in on the test address: add `https://forka-erp-next.web.app` to the OAuth client's Authorized JavaScript origins (once).
