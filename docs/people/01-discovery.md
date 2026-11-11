# 01. Discovery: current state, information to collect, open questions

## 1. What exists today (reviewed in the repositories)

| System | Where | What it does | Relevance to Forka People |
|--------|-------|--------------|---------------------------|
| Forka Apps hub | erp.forka.com (forka-erp repo, `index.html`) | Sign-in (company Google account, or PIN for staff without email), app tiles, People and access (CEO only), activity log | Today's identity and access list. Forka People must work with it at first and later take over as the source of truth for who is an employee. |
| Accounts server | `server/Accounts.gs`, Google Sheet "Forka Apps - Accounts" | People list (email, name, job title, clearance level, status, per-app access), salted PIN hashes, sessions, activity log | Holds a partial staff list keyed by email. No entity, branch, contract or document data. |
| Forka Hiring | erp.forka.com/hiring, `server/Hiring.gs`, Sheet "Forka Hiring" | Hiring requests, scorecards, candidates through to the `hired` stage | **This is where Forka People starts.** A candidate marked `hired` is the trigger for a new employee record (see [07](07-integrations.md#1-forka-hiring-to-forka-people-new-hire-hand-off)). |
| Careers page | apply.forka.com (forka-apply repo) | Public job ads and applications | Out of scope. Not touched. |
| Forka Boards | erp.forka.com/boards, `server/Boards.gs` | Team boards; the CEO sets departments and department heads | Holds a department list and heads. The org structure in Forka People should become the source of truth, and Boards should read it. |
| Procurement | procurement.forka.com (Forka-Procurment repo) | Purchasing, operations, payments, Oman store (OMR) | Confirms the group runs UAE and Oman operations with separate currencies. Uses Forka Apps sign-in. No HR data. |

**What we did not find in the repositories:** employee master data, contracts, documents, leave records,
attendance, shift rosters, payroll, policies or approval authorities. These are presumably in spreadsheets,
email, a payroll provider, or on paper. They are the main input still needed (section 2).

### Why the current setup cannot hold HR data

The existing apps are static pages on GitHub Pages that talk to Google Apps Script servers backed by Google Sheets.
That works well for the current apps, but for HR records it fails these requirements:

- **Field-level and row-level permissions.** Anyone with edit access to a Sheet sees every row and column. Salary, bank, medical and disciplinary data must be restricted by role, entity and branch.
- **Logging who viewed a record.** Sheets does not log who viewed a row through the app.
- **Encryption and key control.** We cannot hold our own encryption keys, and there is no field-level encryption for passport or bank numbers.
- **Integrity at payroll scale.** No transactions, no enforced relationships, limits on writes at the same time, and a cell can be overwritten silently.
- **Deployment.** Apps Script is deployed by hand (paste the file, then a new version), with no automated rollback of data changes.

So Forka People needs a proper application server and database (see [05](05-architecture.md)). It keeps the Forka look,
appears as a tile in the Forka Apps hub, and lets Forka Apps users sign in once.

## 2. Information to collect (Phase 0 checklist)

Please share these, or tell us who holds them. Spreadsheets or photos are fine.

**Structure**
- [ ] List of legal entities: legal name (EN/AR), country, emirate/governorate, trade licence number, labour establishment / MOHRE or Oman Ministry of Labour number, currency.
- [ ] Brands, and which entity operates each.
- [ ] Branches and locations (Sharjah, Fujairah, Umm Al Quwain, Mayar Cafe, Ajman Central Store, Oman, head office), with address, entity, brand, opening hours and GPS location.
- [ ] Departments, cost centres (and their codes in the accounting system), job titles and grades.
- [ ] Current reporting lines (who reports to whom).

**People data**
- [ ] The current employee master spreadsheet(s): every column, with personal data removed or a sample of 5 rows.
- [ ] Salary structure: the components in use (basic, housing, transport, food, other allowances), deductions, advances.
- [ ] The document types held per employee, and where the files live today.

**Policies and approvals**
- [ ] Leave policy per country and entity: leave types, accrual, carry-over, notice periods, who approves.
- [ ] Attendance and overtime rules in practice: grace period, rounding, split shifts, overnight shifts, rest days.
- [ ] Approval authority matrix: who approves leave, overtime, attendance corrections, salary changes, transfers, terminations and letters, and who covers when they are away.
- [ ] Employee handbook / policies that staff must acknowledge.
- [ ] Letter templates in use (salary certificate, experience letter, NOC, embassy letter).

**Time and payroll**
- [ ] Current rosters (one example week per branch type).
- [ ] Current clock-in method per branch, and the make and model of any biometric devices.
- [ ] How payroll is run today, month by month, and who does each step.
- [ ] WPS agent or bank used in the UAE and in Oman, and the file format they accept.
- [ ] Accounting system and the payroll journal format it expects.
- [ ] One recent anonymised payroll register per country (to test that our inputs reconcile).

## 3. Questions that change the design

Only questions whose answers change the architecture, compliance, data structure or scope are listed.
Each has a default we will use if there is no answer, so work is not blocked.

| # | Question | Why it matters | Default if unanswered |
|---|----------|----------------|-----------------------|
| Q1 | **Where may employee data be hosted?** Is UAE hosting required? May Oman employees' data be hosted in the UAE, or must it stay in Oman? | Decides the cloud region and whether Oman needs a separate database. Oman's Personal Data Protection Law (Royal Decree 6/2022) and the UAE PDPL (Federal Decree-Law 45/2021) both have cross-border transfer conditions; a lawyer must confirm what applies to us. | One deployment in a UAE cloud region for both countries, with Oman data in its own logical partition, **subject to legal confirmation for Oman.** |
| Q2 | **Who will build and run the system after launch?** In-house developer, an agency, or the CTO's team? Who is on call if it breaks on payroll day? | A real server and database need someone to own patches, backups and incidents. This decides how much we lean on managed services. | Managed services everywhere possible (managed database, managed file storage, managed hosting), so one engineer can run it. |
| Q3 | **How do frontline staff sign in?** Do they have company email, personal email, or only a phone number? Do they share phones or branch tablets? | Decides the identity design (Google sign-in, phone code, PIN, device binding) and the self-service experience. | Office staff: company Google account. Frontline: mobile number with a one-time code on first sign-in, then a personal PIN on their own phone. Branch tablet in kiosk mode for those without a phone. |
| Q4 | **Which biometric devices are in place, and do they have a network API or cloud service?** | Decides whether we pull punches from a device cloud, run a small connector at each branch, or replace devices with tablet clock-in. | Phase 1 uses mobile and branch-tablet clock-in. Biometric integration comes in Phase 2 once the models are known. |
| Q5 | **Who runs payroll today, and should Forka People calculate payroll or prepare checked inputs for an existing provider?** | Calculating payroll is a much larger, higher-risk scope (WPS files, end-of-service, social insurance). | Release 1 prepares approved payroll inputs and exports. Calculation per country comes later, only after local advisers validate the rules. |
| Q6 | **Approximate number of employees per entity and per country,** and expected growth in 2 to 3 years? | Sizing, licensing of any managed identity service, and whether entities need separate payroll groups. | About 120 total, up to 400 in 3 years. |
| Q7 | **Does the CEO (or anyone at group level) need to see salary and personal data across all entities**, or should group reports be anonymised or aggregated by default? | Decides the default for group reporting and the entity separation rules. | CEO and Group HR Director see everything. Other group roles see aggregated figures only. |
| Q8 | **Monthly budget for hosting and services.** | Decides the managed-service choices in [05](05-architecture.md). | Up to about USD 450 per month for production, staging and backups at this size (see the estimate in 05). |

## 4. Assumptions (until confirmed)

- About 120 employees across UAE and Oman, several legal entities, mostly frontline restaurant and café staff.
- Company domain forka.com with Google Workspace for office staff.
- Pay is monthly. UAE pay goes through WPS. Oman pay goes through the Oman WPS via a bank.
- Forka Hiring stays the recruiting system. Forka People starts at "hired".
- The CTO named in the brief is the technical reviewer. Khaled approves scope and go-live.
