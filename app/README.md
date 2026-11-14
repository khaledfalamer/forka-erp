# Forka App in React + TypeScript (app/)

The Forka App pages are moving from hand-written HTML to **React + TypeScript** (the same language as the People app
skeleton), one piece at a time. **Moved so far: the hub** (sign-in, app tiles, CEO numbers, People and access,
Activity, install the app and notifications). It looks the same as the live hub and talks to the same accounts server.

Not moved yet, copied in unchanged by `scripts/add_legacy.sh`: Hire (`hiring/`), Board (`boards/`), the careers copy
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
npm test           # 49 browser checks in demo mode (made-up people)
```

## Publish to the test address (Cloud Shell, project forka-apps)

```bash
cd forka-erp && git pull && cd app
npx -y firebase-tools@latest hosting:sites:create forka-erp-next --project forka-apps   # once
npx -y firebase-tools@latest deploy --only hosting --project forka-apps
```

Google sign-in on the test address: add `https://forka-erp-next.web.app` to the OAuth client's Authorized JavaScript origins (once).
