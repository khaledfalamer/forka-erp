# Forka apps UI redesign: plan (before any code)

Brief: "Forka ERP — UI Redesign Brief (approved by Khaled, 12 Nov 2026)". This plan covers the launcher (erp.forka.com),
Forka Hire (erp.forka.com/hiring), Forka Boards (erp.forka.com/boards) and Forka Procurement (procurement.forka.com).
Forka People is out of scope (brief section 5). Nothing goes live until Khaled says "go live" for that phase.

**Khaled, 12 Nov 2026: do not touch the headers and logos.** Every app keeps its live header and logo exactly as they are
(the Forka brand family: light paper header with the app colour line, each app's own mark, App / Hire / Board / Procurement).
The shared suite header, app switcher and header menus from Phase 1 are therefore dropped; the redesign changes only what is
below the header (page content, tables, forms, dialogs, phone layout and Arabic of the content).

Visual reference: `forka_audit_visual.html` (the audit's Now / Proposed sketches, saved next to this plan). Three of its
panels are **not** built, by Khaled's decisions: the launcher "Workspaces" cards (2.2, cards stay as they are),
Suppliers & ABC, and the Operations PIN screen (section 5). Its emojis are placeholders and become line icons.

## What the survey found (facts that shape the plan)

| | Launcher | Hire | Boards | Procurement |
|---|---|---|---|---|
| Page | index.html, 66 KB | hiring/index.html, 173 KB | boards/index.html, 257 KB | index.html, 334 KB (other repo) |
| Views switched by | state `view` + `data-a` | state `V.page`, `go()` | state `V`, `render()`, `data-a` | state `side`/`tab`, `data-tab` |
| Header today | light, logo + name + Sign out + EN/ع | dark, logo, `#nav` (scrolls sideways), EN/عربي, role pill, "Forka Apps" link; no user name, no sign-out | dark, brand, search (board only), sync, EN/عربي, bell, avatar; no app switcher | dark two rows: logo, side pill, bell, EN/عربي, Exit; white tab row (scrolls sideways) |
| Tokens | `--fk-*`, bronze #9a6b3f | own names, bronze #A57C52 | own names, bronze #9a6b3f | own names, bronze #9a6b3f |
| Arabic | `T` table + `t()` | English source, translated after render by walking the page (`AR` table + MutationObserver) | `T` table + `t()` | `T` table + `t()` |
| Emojis | none | none | none | none (uses ✓ ✕ ← → ↗ ‹ › ✗ as glyphs) |
| Breakpoints | 720 | 860, 720, 560 | 760 | 1180, 900, 860, 700, 620, 600 |

Each app has its own automatic tests that use specific ids, classes and texts (listed per phase below). They are the
baseline: every phase keeps them passing, or updates a selector only where the brief changes that element, and says so.

### Two points where the brief and the code differ (need Khaled's decision, see "Questions")
1. **Procurement "personal PIN gate on Operations".** There is no Operations-only PIN today. Since 8 Nov, sign-in to
   Procurement goes only through erp.forka.com (`ERP_ONLY = true`); the per-side PIN form only appears in demo mode and
   the server refuses PIN sign-in. The plan keeps this exactly as it is (server unchanged).
2. **Hire talent pool privacy (2.5).** Phone and email are sent to the page for everyone who may open a candidate (HR,
   and heads for their own department). Masking only on screen would still send them; a real "Show" with an audit log
   needs a small server change (a `reveal` action that logs who, which candidate, when, and the list stops carrying
   the full numbers). Permissions stay the same.

## Component map (Phase 1: built once, used by all four apps)

One shared set: `suite/suite.css` + `suite/suite.js` + `suite/icons.js` in the forka-erp repo, and an identical copy in
the Procurement repo (a test fails if the two copies differ). No framework: the apps are plain HTML/JS, so the
components are CSS classes plus small JS helpers that each app's existing `render()` calls.

| Component | What it is | Used by |
|---|---|---|
| Tokens | CSS variables from brief 1.1: canvas #F7F4EE, surface #FFFFFF, ink #25211D, secondary #6E6861, bronze #98693F, border #E5DED4, success #397553, warning #A66C1E, danger #B34C3D; spacing 4/8/12/16/24/32; radius 8-12; light shadows; tabular numbers. Each app keeps one accent colour (Hire sea, Boards sage, Procurement saffron, launcher bronze). Old per-app variable names are mapped onto the new tokens so nothing breaks. | all |
| Type | Serif (EB Garamond) for page titles only; Inter Tight for everything else, IBM Plex Sans Arabic in Arabic; body 14-16, labels ≥13, helper 12-13 | all |
| Suite header `fkHeader()` | Forka mark + app switcher (menu of the apps the person may open, same rules as the launcher), current app name, optional search slot, EN/AR switch, alerts slot, user name + role, sign out / back to Forka Apps | Hire, Boards, Procurement; launcher gets the same bar but its app cards stay unchanged (2.2) |
| Module menu `fkMenu()` | The app's own sections. Never a hidden sideways scrollbar: items that do not fit move into a named "More" menu (measured on resize). | Hire nav, Procurement tabs, Boards side menu |
| Frame | ≥1024: side rail with labels; 640-1023: rail collapses to icons with accessible labels; <640: menu becomes a drawer + small bottom bar (Home, Approve, New, Me — per app). Page never scrolls sideways; only tables/boards inside their own box. | all |
| Icons `ic()` | One line-icon set (Lucide, MIT licence, inline SVG, only the ~40 icons used). Replaces glyph icons ✓ ✕ ← → ↗ ‹ › ✗ where they act as icons. | all |
| Badge / status chip | Text + colour (+ icon where useful). Priority fixed meanings: Urgent (today / blocks work, strong red with icon), High (this week), Normal, Low. Urgent never looks like a default tag. | all |
| Table | Sticky header, Comfortable (default) / Compact density switch (remembered), pinned first columns, row hover + chevron when clickable, sort headers, horizontal scroll inside the table box only | Hire requests/candidates/pool, Boards projects, Procurement inventory/queue |
| Filter bar + saved views | Search, a few chips, "More filters" drawer; saved views stored per person in the browser (no server change) | same |
| Dialog | Fits the viewport, header / scrollable body / fixed footer (Cancel, main action), Esc and focus trap, one column on phones | all |
| Toast | One style for saved / error / undo | all |
| States | Empty (message + button), loading (skeleton), error (retry), permission-denied ("Ask HR / your manager"), disabled | all |
| Focus and touch | Visible focus ring, 44x44 touch targets, WCAG AA contrast, `aria-label` on icon buttons, table headers with `scope` | all |
| RTL helpers | `dir="rtl"` mirrors everything (logical CSS properties), drawers from the right, numbers/dates/units wrapped in `<bdi>` | all |

## Screen-by-screen plan

Ground rules on every screen: same routes, same server calls, same rules and calculations, same approvals; every role
sees the same data and actions as today; no live data in tests (demo data and the existing fake servers only).

### Launcher (erp.forka.com) — header, tokens, phone layout, RTL only
| Screen | Change | Keep |
|---|---|---|
| Sign-in gate | Tokens, focus, Arabic check | Every step and message, Google and PIN sign-in |
| Home | Suite header | **App cards exactly as today** (Khaled's decision 2.2), CEO admin tiles, CEO box |
| People and access, Activity | Tokens, table component, dialog component, phone layout | All fields, rules, last-CEO protection |

### Procurement (Phase 2)
| Screen | Change | Keep |
|---|---|---|
| Entry (big side buttons) | Replaced by the suite header + a Procurement sub-menu: Requests · Orders · Inventory · Suppliers · Payments · Summary, with Operations and Oman reachable (same permissions, same `ERP_SIDES` rules). People with one side still go straight in. | Side permissions from Forka Apps; sign-in only through erp.forka.com |
| Inventory (4.2, highest risk) | Workspace layout: sticky title and actions; summary cards (budget used, stock value, items to reorder); filter row (search, supplier, category, stock status, payment terms) + saved views. Default columns: Item, Supplier, Stock now, Reorder point, To buy, Unit cost, Budget, Status, with Item and Stock now pinned; other columns can be added. Conversion, usage and reserve open in a side drawer per row. Editable cells look different from read-only ones; unsaved / auto-saved status. List virtualised (only visible rows drawn), no nested page scroll; card mode on phones. | Edit lock (Edit / Save (N) / Cancel with confirms), reorder point and To-buy formulas, conversion, import, payment and approval logic, role restrictions, the 400-row cap logic replaced only by virtualisation (all rows reachable) |
| Purchasing queue (4.1) | Compact status summary, prominent New request, a few filter chips + More filters, saved views | Same statuses and counts |
| Request detail (4.1) | Four blocks: Request summary · Owner & status · Clarification thread · Decision history. "Add note" and "Email requester" as separate buttons (already separate; clearer labels). Confirmation before consequential status changes (accept, send to CEO, approve, reject, park, withdraw) | Close-with-reason panel, CEO approve/send back/reject, the actions themselves |
| Suppliers & ABC, Operations PIN screen | **Not changed** (brief 5) beyond tokens and header | — |
Tests to keep: inventory_edit_test, requests_save_test, request_email_test, oman_issue_test, share_print_test, oman_import_test, speed_test (selectors such as `.inv [data-f]`, `[data-act=invedit|invsave|invcancel]`, `.cfm`, `[data-tab=…]`, `#top .tab`).

### Hire (Phase 3)
| Screen | Change | Keep |
|---|---|---|
| Header / menu | Suite header; "Team & access" always reachable (More menu), user name and role shown | Roles hr / head / ceo, CEO "View as" |
| Hiring request form (2.4) | 4 steps: 1 Role & location → 2 Compensation & timing → 3 Evaluation plan → 4 Review & submit; progress indicator, required markers, inline errors, examples, "Draft saved" (saved in the browser), Back / Next | Step 4 calls the same `saveReq()` → status "requested" → CEO approval, never bypassed; "Start from a previous request" |
| Requests (2.3) | Table with search, filters (role, status, department/branch, date), sortable columns, saved views | Request detail steps strip and actions |
| Candidates (2.3) | List is the default, Board optional; stage shown as a compact summary that always names the current stage (no hidden 10-stage strip); the "Post a role first" dead end becomes a button to the posting flow, only for people allowed to post | Bulk actions, 200-per-page paging, head visibility (shortlist onward) |
| Talent pool (2.5) | Phone/email masked (`+971 5• ••• ••21`), "Show" for authorised roles, each reveal logged; others see "HR only" | Same permission rules (see Question 2) |
| Dashboard (2.1) | Top row: open roles, candidates in process, overdue approvals, median days-to-hire, with date-range and role filters; compact "Next action" queue (owner, SLA, action) with a helpful empty message + button; pipeline as one clickable stepper with counts (opens the filtered list) | KPIs' meaning, SLA rules |
| CEO approvals (2.1) | Two compact queues (vacancies / final candidates) with SLA and clear empty messages | Approve actions and steps 2 and 14 |
| Careers editor (2.6, Phase 5) | Editor and live preview side by side, Desktop / Phone toggle; each section saves on its own with "Saved 10:42" / "Unsaved" | AI wording helper; public copy changes only when edited |
Arabic in Hire stays on its current method (translated after render); new labels are added to its `AR` table.
Tests to keep: hiring_test.py (`#nav` texts, `#who a[href=…]`, `go()`, `reqForm`, `saveReq`, `#f_*`, `main table tr.click`, `.kanban .cc`, "List view"/"Board view" texts…). The request-form test is updated for the 4 steps (same fields, same submit).

### Boards (Phase 4)
| Screen | Change | Keep |
|---|---|---|
| Company progress (3.1) | Date-range selector, "My department / All company" switch, KPI cards act as filters, compact summary above the fold | Who sees it (CEO), the numbers |
| Projects (3.1) | Pinned Project and Status columns, hover + chevron, sortable headers, filters and sort remembered between visits | Columns, click to open |
| Board (3.2) | Sideways scroll only inside the board canvas; card titles clamped to 2 lines with the full title as tooltip and for screen readers; priority and due date as separate elements; Urgent as one strong signal; compact filter bar (search, owner, priority, due this week); visible add control and count per column | Drag and drop, all card badges, permissions |
| Calendar / timeline (3.3) | Crowded days show the first tasks + "+N more"; clicking a day or task opens details; timeline keeps the pinned names column (already sticky) and gets clearer labels | Same data |
| New task (3.4) | Groups: Essentials (title, department, board, owner) · Schedule (dates, priority) · Details (labels, description, checklist; optional, folded). Selected "Department › Board" shown at the top; Cancel / Create fixed in the footer; inline checks for owner and due date; defaults only when they match the board and role; one column on phones | Same fields, templates, request-to-department flow, same save |
Tests to keep: boards_test.py (~160 checks; `.side [data-a=go]`, `.card .ct`, `#nt-*`, `.ntf .miss`, `.cchip`, `.tbar`, `.kpi`, `#projtbl tr.click`…), boards_live_test.py. Updated only where the brief changes the element (e.g. calendar "+N more").

## How each phase is checked
- All existing test suites pass (or changed selectors are listed with the reason).
- New automatic checks: no page-level sideways scroll at 390x844, 768x1024, 1024x768, 1366x900 in English and Arabic;
  no menu item hidden at 1366; dialogs inside the viewport; 200% zoom; keyboard-only path; focus visible; no emojis;
  launcher app cards unchanged (pixel comparison of the cards).
- Role baseline: for each role, the list of visible sections, actions and data fields is recorded before the change and
  compared after (CEO, HR, head, staff; Procurement: each side; Hire: hr/head/ceo).
- Screenshots with demo data only; delivered with a short change summary and the list of checks after each phase.

## Phases
| Phase | Work | Goes live |
|---|---|---|
| 1 | Tokens and components, suite header and app switcher, responsive frame, RTL helpers; applied to the launcher (header only) | When Khaled says so |
| 2 | Procurement inventory, then queue and request detail | When Khaled says so |
| 3 | Hire: request wizard, requests and candidates, talent pool privacy, dashboard | When Khaled says so |
| 4 | Boards: progress, board cards, calendar/timeline, task form | When Khaled says so |
| 5 | Hire careers editor; final polish of states across all apps | When Khaled says so |

## Questions for Khaled
1. **Operations PIN:** sign-in through Forka Apps only (PIN switched off since 8 Nov). Keep it that way? (Recommended: yes.)
2. **Talent pool privacy:** OK to add the small Hiring server change (masked numbers in the list, "Show" asks the server and logs it)?
   It goes into the Hiring Apps Script (you paste it), or comes with the move of Hiring to the new server.
