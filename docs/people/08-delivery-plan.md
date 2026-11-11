# 08. Delivery plan

## Team assumption

Estimates assume **2 full-time engineers** (one senior full-stack lead, one full-stack), a **part-time designer** for Phases 0 and 1,
part-time QA, an **HR product owner** (about 1 day a week) who answers questions and tests, and the CTO reviewing each phase.
With one engineer, multiply durations by about 1.7. Durations are calendar weeks and include testing and fixes, not legal review time.

## Phases

| Phase | Scope | Weeks | Gate to finish |
|-------|-------|-------|----------------|
| **0. Discovery and design** | Collect the data in [01](01-discovery.md); answer Q1 to Q8; screen designs (EN/AR) for Phase 1; set up group-owned accounts, repository, CI, staging; ADRs approved | 3 | CTO approves this package; CEO approves Phase 1 scope |
| **1A. Foundations** | Org structure; employee records with history; documents and expiry reminders; roles, scopes and data classes; audit and access logs; approval engine; employee self-service (profile, documents, requests, status); bulk import/export; Forka Hiring hand-off; onboarding checklists; standard letters; Arabic/English | 9 | Data migration rehearsal passes; access tests pass for every role; HR signs off in staging |
| **1B. Leave, shifts and attendance** | Leave types, ledger, requests, team calendar; shift templates, rosters, publish; mobile and tablet clock-in with geofence; exceptions; corrections; attendance approval; payroll input export (attendance, overtime, unpaid leave) | 7 | One-month parallel run in 2 pilot branches (one UAE, one Oman) matches current records |
| **Pilot and launch** | Pilot 2 branches for 4 weeks, fix, then roll out branch by branch; train managers (30-minute session per branch, short videos in Arabic and English); penetration test | 6 | CEO says "go live"; pen-test findings of high severity fixed |
| **2. Payroll inputs and integrations** | Pay periods and month-end workflow; variance reports; payslip import and release; probation, confirmations, transfers, promotions, salary changes as full workflows; final-settlement inputs and exit checklist; biometric integration; payroll provider export | 7 | Two months of payroll inputs reconcile with the provider's payroll |
| **3. Country payroll modules** | UAE and Oman calculation modules (only rules approved in [10](10-country-rules-register.md)); WPS files; accounting journal | 8 | Local payroll adviser signs off; three-month parallel run with no unexplained differences |
| **4. Performance and learning** | Probation and periodic reviews, role scorecards, goals, competencies, self-assessment, development plans; training records and renewals | 6 | One review cycle completed in pilot |
| **5. HR desk and analytics** | Request desk with categories, owners, response targets, sensitive cases; policy acknowledgements; dashboards and exportable reports | 6 | HR reports replace current spreadsheets |

**First usable release (Phases 0 to Pilot): about 25 weeks.** Full scope: about 52 weeks.

## Launch requirements vs later enhancements

**Required at launch (Phase 1A + 1B):**
- One record per person, with entity, brand, branch, department, job, manager, cost centre history
- Salary components and bank details stored securely (used for exports, not calculated)
- Documents with expiry reminders to employee, manager and HR
- Onboarding checklists; standard letters from approved templates
- Self-service: profile, documents, schedule, leave balance, attendance, requests and their status, policies and announcements
- Manager views: team, approvals, schedules, attendance exceptions, leave calendar, probation dates, expiring documents
- Leave with ledger and approvals
- Shifts and rosters (rotating, split, overnight, rest days, public holidays); mobile and tablet clock-in; exceptions and corrections
- Approval engine with delegation; audit and access logs; roles and data classes; entity separation
- Bulk import/export with templates; full data export
- Arabic and English with right-to-left; works on phones and slow connections
- Basic reports: headcount, document expiry, leave, attendance exceptions, scheduled vs actual hours

**Later enhancements:**
- Payroll month-end workflow and payslips (Phase 2); payroll calculation and WPS (Phase 3)
- Full lifecycle workflows for promotion, salary change, termination and final settlement (Phase 2; in Phase 1 these are recorded by HR as history changes with approval)
- Biometric device integration (Phase 2)
- Performance, scorecards, training (Phase 4)
- HR request desk and case management, policy acknowledgements (Phase 5; basic letter and correction requests are in Phase 1)
- Analytics dashboards beyond basic reports (Phase 5)
- WhatsApp notifications; native app wrapper; face match at clock-in; Hijri calendar views; employee surveys

## Main risks

| Risk | Effect | Mitigation |
|------|--------|------------|
| Source data in spreadsheets is incomplete or inconsistent | Delays launch; wrong balances | Import validation reports early (Phase 0); HR cleans data with a tracker; opening leave balances signed off per employee |
| Legal advice on Oman data residency changes hosting | +3 weeks and higher cost | Ask Q1 first; design keeps entity data separable |
| Frontline adoption (phones, literacy, language) | Low usage; HR still does it by hand | Very simple screens, icons with text, Arabic first where preferred; tablet kiosk; manager can submit on behalf |
| Geofence inaccuracy indoors / malls | False exceptions | Configurable radius and accuracy threshold per branch; Wi-Fi or tablet fallback; manager review |
| Payroll rules wrong | Pay errors, legal exposure | No calculation until adviser sign-off; rules register; parallel runs |
| Single engineer leaves | Knowledge loss | Two engineers; documentation and runbooks in the repository; group owns all accounts |
| Scope creep into recruiting | Delay | ATS stays in Forka Hiring; hand-off only |

## How each phase is reviewed

1. Specifications for the phase (in the format of [09](09-phase1-specs.md)) approved by the HR product owner and the CTO.
2. Built and tested in staging; screenshots in English and Arabic shown to the CEO.
3. Test results, open issues and the updated administrator guide attached.
4. Go-live only on the CEO's "go live".
