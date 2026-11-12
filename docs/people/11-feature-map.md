# 11. Feature map and build tracker

Last updated: 12 Nov 2026. Source: `feature-map.json` (edit it, then run `python3 docs/people/tools/build_feature_map.py`).

Levels: **Plan** (written in docs 02–10) · **Database** (tables exist) · **Server + tests** (real endpoints with permission tests) · **Screens** (in the preview link) · **Live** (in use with real data).
Marks: ✓ done · ◐ partly · · not started · ✕ blocked.

## Foundation

Everything else depends on these.

| Feature | Phase | Plan | Database | Server + tests | Screens | Live | Depends on | Blocked by | Next step |
|---|---|---|---|---|---|---|---|---|---|
| **Sign-in**<br><sub>Foundation</sub> | 1A | ✓ | ◐ | ◐ | ◐ | · | — | How frontline staff sign in (question 3) | Google sign-in for office staff; phone code + PIN for frontline |
| **Organisation structure**<br><sub>Foundation</sub> | 1A | ✓ | ✓ | ◐ | ✓ | · | — | — | Edit screens for HR; load real entities and branches |
| **Employee records**<br><sub>Foundation</sub> | 1A | ✓ | ✓ | ✓ | ✓ | · | Organisation structure | — | Personal, bank, emergency contacts, dependants editing |
| **Roles and access**<br><sub>Foundation</sub> | 1A | ✓ | ✓ | ✓ | ◐ | · | Employee records | — | Screen to give and end roles |
| **Audit and access logs**<br><sub>Foundation</sub> | 1A | ✓ | ✓ | ✓ | ✓ | · | Roles and access | — | Daily chain check and export |
| **Hosting and encryption**<br><sub>Foundation</sub> | 1A | ✓ | · | · | · | · | — | Where data may be stored (question 1) | Cloud account owned by the group; field encryption |

## Shared engines

Used by many modules.

| Feature | Phase | Plan | Database | Server + tests | Screens | Live | Depends on | Blocked by | Next step |
|---|---|---|---|---|---|---|---|---|---|
| **Approvals engine**<br><sub>Engines</sub> | 1A | ✓ | ✓ | · | ✓ | · | Roles and access | — | Server routes, delegation, escalation, tests |
| **Notifications**<br><sub>Engines</sub> | 1A | ✓ | ◐ | · | · | · | Approvals engine | — | Email first, then app push; SMS for sign-in codes |
| **Documents, reminders**<br><sub>Engines</sub> | 1A | ✓ | ✓ | ◐ | ✓ | · | Employee records | — | File upload, malware scan, daily reminder job |
| **Import and export**<br><sub>Engines</sub> | 1A | ✓ | · | · | · | · | Employee records, Documents, reminders | HR census clean-up (email sent) | Templates, check-then-commit import |
| **Hiring hand-off**<br><sub>Engines</sub> | 1A | ✓ | · | · | · | · | Employee records | — | Hired candidate creates a new employee |
| **Settings and rules**<br><sub>Engines</sub> | 1A | ✓ | ✓ | · | ◐ | · | Roles and access | Adviser approval for country rules | Edit screens; rule approval workflow |

## Modules

What staff, managers and HR use every day.

| Feature | Phase | Plan | Database | Server + tests | Screens | Live | Depends on | Blocked by | Next step |
|---|---|---|---|---|---|---|---|---|---|
| **Leave**<br><sub>Self-service</sub> | 1B | ✓ | ✓ | · | ✓ | · | Approvals engine, Employee records | — | Ledger, accrual, carry-over on the server |
| **Requests and letters**<br><sub>Self-service</sub> | 1A | ✓ | ✓ | · | ✓ | · | Approvals engine | — | Letter PDFs from approved templates |
| **Request forms by HR**<br><sub>Self-service</sub> | 1B | ✓ | ✓ | · | ✓ | · | Approvals engine, Notifications | — | Write spec; server and automatic actions |
| **Payslips**<br><sub>Self-service</sub> | 2 | ✓ | ✓ | · | ✓ | · | Payroll month-end | — | Import payslips from the payroll provider |
| **Roster and shifts**<br><sub>Time</sub> | 1B | ✓ | ✓ | · | ✓ | · | Employee records | — | Server, checks, publish notifications |
| **Clock-in (phone, tablet)**<br><sub>Time</sub> | 1B | ✓ | ✓ | · | ◐ | · | Roster and shifts, Sign-in | — | Real location check, offline punches |
| **Attendance and corrections**<br><sub>Time</sub> | 1B | ✓ | ✓ | · | ✓ | · | Clock-in (phone, tablet), Approvals engine | — | Match punches to shifts on the server |
| **Biometric devices**<br><sub>Time</sub> | 2 | ✓ | ◐ | · | · | · | Attendance and corrections | Device make and model (question 4) | Device cloud API or branch connector |
| **Onboarding and exits**<br><sub>Lifecycle</sub> | 1A | ✓ | ✓ | · | ✓ | · | Employee records, Documents, reminders | — | Checklist templates by role and country |
| **New joiner portal**<br><sub>Lifecycle</sub> | 1A | ✓ | ✓ | · | ✓ | · | Onboarding and exits, Documents, reminders, News and policy sign-off, Learning and renewals | — | Write spec; server |
| **Probation, promotions, exits**<br><sub>Lifecycle</sub> | 2 | ✓ | ✓ | ◐ | ◐ | · | Employee records, Approvals engine | — | Full change workflows with approval |
| **Performance reviews**<br><sub>Talent</sub> | 4 | ✓ | ✓ | · | ✓ | · | Employee records | — | Scorecards per role from department scorecards |
| **Goals and recognition**<br><sub>Talent</sub> | 4 | · | ◐ | · | · | · | Performance reviews | — | Suggested: branch goals and monthly recognition |
| **Learning and renewals**<br><sub>Talent</sub> | 4 | ✓ | ✓ | · | ✓ | · | Employee records | — | Required courses by role, certificates |
| **Pay bands**<br><sub>Talent</sub> | 3 | · | · | · | · | · | Employee records | — | Suggested: salary ranges per level |
| **Team feed**<br><sub>Communication</sub> | 2 | ✓ | ✓ | · | ✓ | · | Roles and access | — | Write spec; moderation by HR |
| **News and policy sign-off**<br><sub>Communication</sub> | 1A | ✓ | ✓ | · | ✓ | · | Employee records | — | Policy versions and acknowledgements |
| **HR desk and private cases**<br><sub>Communication</sub> | 5 | ✓ | ✓ | · | ✓ | · | Roles and access | — | Response targets, private case access |
| **Pulse surveys (eNPS)**<br><sub>Communication</sub> | 5 | · | · | · | · | · | Roles and access | — | Suggested: one question a month, anonymous |

## Outputs

Results that leave the system or go to leadership.

| Feature | Phase | Plan | Database | Server + tests | Screens | Live | Depends on | Blocked by | Next step |
|---|---|---|---|---|---|---|---|---|---|
| **Payroll month-end**<br><sub>Outputs</sub> | 2 | ✓ | ✓ | · | ✓ | · | Attendance and corrections, Leave, Request forms by HR | — | Period lock, variance, approvals on the server |
| **Country payroll and WPS**<br><sub>Outputs</sub> | 3 | ✓ | ◐ | · | · | · | Payroll month-end, Settings and rules | Adviser sign-off; WPS file formats | UAE then Oman modules after approval |
| **Reports and dashboards**<br><sub>Outputs</sub> | 5 | ✓ | · | · | ✓ | · | Employee records, Attendance and corrections, Leave | — | Server reports with export to Excel |
| **CEO dashboard**<br><sub>Outputs</sub> | 5 | · | · | · | · | · | Reports and dashboards | — | Suggested: key numbers on the home screen |
| **Accounting export**<br><sub>Outputs</sub> | 3 | ✓ | · | · | · | · | Payroll month-end | Accounting system details | Payroll journal per entity and cost centre |

## How to use this map

1. Before building a feature, read its plan section (doc 09 for Phase 1, docs 02–08 for the rest) and check its "Depends on" column is real first.
2. When a level is finished, change its mark in `feature-map.json` and rebuild this file and the diagram.
3. "Live" is set only after the CEO says "go live" for that feature.
