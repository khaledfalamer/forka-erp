# Forka People (skeleton)

The group's own HR and people platform. This is the **first skeleton**: it runs with **made-up demo data only**
and is not deployed anywhere. Plan and specifications: `../docs/people/`.

It lives here temporarily, inside forka-erp on a working branch, until the group creates its own `forka-people`
repository; it will then move there with its history. Nothing in this folder is published on erp.forka.com
(the site build copies only its listed folders).

## What works

- Organisation: companies (UAE and Oman), brands, branches, departments, job levels (from the group's level framework), positions.
- Employee records with **job history by effective date** (nothing is overwritten); future changes show as "Scheduled".
- Change job (transfer, promotion, new manager) by HR, with checks: no dates before the current job, no second scheduled change,
  no move to another company through this screen, past dates need the HR Manager.
- **Who sees what** (docs/people/03): CEO everything; HR Manager / HR Officer by company; branch manager their branch only;
  line manager their team; employee only themself. Salary visible only to the person, HR Manager, Payroll and CEO.
- **Company separation in the database**: PostgreSQL row-level security. The app's database role sees no rows without a company context.
- **Audit log** of every change and every refused attempt, append-only and hash-chained (tampering is detected).
- **Access log** of every view of personal or pay data; employees can see who viewed theirs.
- Home: my job, my team count, documents expiring within 60 days.
- Phone-first screens, English and Arabic (right to left), Forka brand.

## Preview of every module (demo build only)

`npm run -w web build:demo` builds a version that runs in the browser with made-up data (published as a private review link).
It contains every module as pages: leave (balances, requests, team calendar), requests and approvals, my time and clock-in,
roster, attendance exceptions, payslips, documents (expiry, renewal upload, HR check), joiners and leavers (onboarding,
probation, exit checklists), payroll month-end steps and variance, performance reviews with role scorecards, learning,
HR desk (private cases), news and policy acknowledgements, reports, and settings. The tables for all of these are in
`server/migrations/002_modules.sql`; their server endpoints are built module by module, with tests, before real data.

## Not yet (by design)

- Real sign-in (Google for office staff, phone code + PIN for frontline). The skeleton has a **demo account picker that only exists outside production**.
- Field-level encryption of ID numbers, bank details and salaries; document file upload; leave; shifts and attendance; imports; notifications.
- Hosting: waiting for the decision on where employee data may be stored (docs/people/01, question 1).

## Run it locally

Needs Node 22 and PostgreSQL 16.

```bash
npm install
npm run db:reset        # creates roles and database, applies migrations, loads demo data
npm run dev:server      # API on http://localhost:8080
npm run dev:web         # screens on http://localhost:5173
```

Or build once and serve everything from the API server: `npm run build && npm start`, then open http://localhost:8080.

## Checks

```bash
npm run typecheck
npm test                # permission, audit and company-separation tests against a test database
```

## Layout

- `server/migrations/` database schema (SQL, applied in order; never edit a migration once it has run on a shared database).
- `server/src/access.ts` all permission rules in one place. `server/src/app.ts` API.
- `server/scripts/seed.ts` demo data (made-up people).
- `server/test/` tests. `web/src/` screens; `web/src/i18n.tsx` English and Arabic text.
