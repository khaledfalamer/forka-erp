# 09. Phase 1 feature specifications

Every feature follows the same headings: user stories, acceptance criteria, edge cases, permissions, error handling, audit, test scenarios.
All screens are in English and Arabic (RTL), and work on a phone. Required fields show red when they block saving.
Roles and data classes (D1 to D5) are defined in [03](03-roles-permissions.md).

Common to every feature (not repeated below):
- Every screen tested in English and Arabic at 360 px width and on desktop; Arabic layout mirrored; numbers and dates formatted per the user's choice.
- Every write is checked on the server for role, scope and data class; refused actions return a plain message ("You do not have access to this") and are logged.
- If two people edit the same record, the second save is refused with "This record was changed by [name] at [time]. Reload to see the change." (version check).
- Lost connection: forms keep their draft on the device and offer to resend.

---

## F1. Organisation structure

**User stories**
- As an HR Manager, I set up legal entities, brands, branches, departments, cost centres, job titles and pay groups, so every employee is placed correctly.
- As the CEO, I see the group structure at a glance by country, entity, brand and branch.

**Acceptance criteria**
1. Each item has English and Arabic names; entity has country and currency; branch has entity, brand, address, GPS point, geofence radius and timezone.
2. Items are never deleted once used; they can be closed with a closing date. Closed items cannot be chosen for new assignments.
3. A branch can only belong to one entity at a time; moving it requires an effective date and keeps history.
4. Org chart view shows reporting lines from assignments.

**Edge cases:** branch shared by two brands (create two branch records or allow a brand list: decide in Phase 0); entity in Oman with OMR; department existing in several entities (separate records per entity).
**Permissions:** create/edit: HR Manager, Sys Admin (structure only), CEO. View: all signed-in users (names only).
**Errors:** duplicate codes refused; closing a branch with active employees blocked with a list of who must move first.
**Audit:** every create, edit, close, with before and after.
**Tests:** create entity in each country; close branch with/without active staff; Arabic names display RTL; non-HR user cannot edit (API returns refused).

---

## F2. Employee record and employment history

**User stories**
- As an HR Officer, I create an employee (from the hiring hand-off or manually) with personal, employment, salary, bank and contact details.
- As an HR Officer, I record a transfer, promotion or salary change with an effective date, and the full history stays visible.
- As an employee, I view my profile and update my phone, address and emergency contacts.

**Acceptance criteria**
1. Required for activation: legal name (EN, AR), nationality, date of birth, mobile, entity, employee number (unique per entity, auto-suggested), start date, job title, branch, department, manager, contract type, probation end date.
2. History tab lists every assignment and salary line with dates, who made the change and the approval.
3. Future-dated changes show "Scheduled" and apply on their date (daily job at 00:05 local time of the entity).
4. Back-dated changes (before today) need HR Manager approval and create a payroll flag.
5. Inter-entity transfer closes the old employment (exit reason "Transfer") and opens a new one linked to the same person; documents linked to the person carry over; entity-specific documents (contract) do not.
6. Employee edits to contact data save as "Pending verification" until HR accepts; the old value stays active until then.
7. Bank detail changes always need HR verification and are flagged to Payroll.

**Edge cases:** rehire of a former employee (link to existing person); two active employments at once in different entities (allowed only if HR Manager confirms); manager leaves (their reports show "No manager" on HR dashboard until reassigned); employee is their own manager (blocked); salary change and transfer on the same date (one change request with both).
**Permissions:** D1 to D2 per [03]; D3: self, HR; D4: self (view), HR Manager, Payroll, CEO. Employees edit only contact fields.
**Errors:** missing required fields shown in red with the field name in the summary; duplicate person detected (same ID number or mobile + date of birth) prompts link or create.
**Audit:** every field change with before/after (sensitive values masked); every view of D3/D4 in access log.
**Tests:** create from hiring hand-off; back-dated salary change requires approval; future transfer applies on date; branch manager cannot see salary (UI and API); employee cannot change own bank account without verification; Arabic name search finds employee.

---

## F3. Documents and expiry reminders

**User stories**
- As an HR Officer, I upload and verify contracts, passports, IDs, visas/work permits, health cards and certificates, with numbers and dates.
- As an employee, I see my approved documents and upload a renewed document.
- As a manager, I see my team's documents expiring in the next 60 days.
- As HR, I get reminders before documents expire.

**Acceptance criteria**
1. Document types are configurable: name EN/AR, country, expiry required, reminder days, who is notified, data class.
2. Upload accepts PDF, JPG, PNG, HEIC up to 15 MB; images compressed on the phone before upload; malware scan before the file can be opened.
3. Employee uploads are "Pending verification" until HR verifies; rejected uploads show the reason to the employee.
4. Daily at 07:00 entity time, reminders are sent at each configured window once (no duplicates), and on the expiry day; expired documents show red on dashboards.
5. Verifying a renewal marks the previous document "Replaced" and stops its reminders.
6. Downloads use links that expire in 5 minutes and are logged.

**Edge cases:** document without expiry (no reminders); expiry date before issue date (refused); employee on leave (reminders still go to HR and manager); employee exited (reminders stop; documents kept per retention); same document uploaded twice (same file hash warning).
**Permissions:** employee: own documents of classes D1 to D3; manager: type, status and expiry date only (not the file) unless the type allows; HR: all in scope; D5 types restricted to HR Manager.
**Errors:** upload failure keeps the form and offers retry; scan failure blocks the file and alerts HR.
**Audit:** upload, verify, reject, replace, download, view.
**Tests:** reminder sent once at 30 days; renewal stops reminders; manager cannot open passport file; expired document appears on HR dashboard; upload over 15 MB refused with message in both languages.

---

## F4. Roles, scopes and access

**User stories**
- As an HR Manager, I give a person a role for a scope (for example Branch Manager of Sharjah) with start and end dates.
- As the CEO, I have full access without setting anything for myself.
- As an employee, I see who viewed my personal and pay data.

**Acceptance criteria**
1. Grants have role, scope (entity / brand / branch / department / team), data classes, valid from/to.
2. Line Manager access is automatic from reporting lines; no grant needed.
3. Grants end automatically on the end date or when the person exits.
4. Active CEO has all roles and scopes automatically; the last active CEO cannot be removed.
5. Access review screen lists all grants for quarterly confirmation.

**Edge cases:** acting manager while manager is on leave (delegation in F6); person moves branch (team scope follows reporting lines; branch grants stay until changed, flagged for review).
**Permissions:** HR Manager assigns roles below HR Manager; CEO assigns any; Sys Admin cannot grant D3 to D5 access.
**Errors:** granting a role outside your own scope refused.
**Audit:** every grant, change and expiry.
**Tests (permission suite):** an automated test for every role × data class × screen/API in [03], run in CI; row-level security test that a query without entity context returns nothing.

---

## F5. Audit and access logs

**User stories**
- As an HR Manager, I see the full history of changes to any employee record in my scope.
- As an auditor, I export the audit trail for a date range.

**Acceptance criteria**
1. Every write produces an audit event in the same transaction (no write without its audit entry).
2. Events are append-only and hash-chained; a daily check verifies the chain and alerts on any break.
3. Filters: person, actor, action, date range, entity; export to CSV with the filters stated in the file header.

**Edge cases:** bulk import creates one event per row plus a batch event; system jobs logged as "System (job name)".
**Permissions:** HR Manager and CEO (entity scope); Sys Admin sees system events without personal values; employees see their own access log.
**Errors:** if the audit write fails, the business write is rolled back.
**Audit:** viewing and exporting the audit log is itself logged.
**Tests:** direct update/delete on audit table refused by the database; tampered row detected by chain check; export header shows filters.

---

## F6. Approval engine

**User stories**
- As an employee, I see who must approve my request now, and every step.
- As a manager, I approve or reject from a notification on my phone in two taps.
- As an HR Manager, I configure approval routes by request type, entity, branch and conditions (for example leave over 5 days adds HR).
- As a manager going on leave, I delegate my approvals to a colleague for set dates.

**Acceptance criteria**
1. Route is built when the request is submitted, from the policy version in force on that date; later policy changes do not affect submitted requests.
2. Approvers resolved by rule: direct manager, branch manager, department head, HR in scope, named person.
3. Rejection needs a reason; the employee is notified with it.
4. Requests not acted on within the target time (default 48 h) are reminded, then escalated to the next level.
5. Nobody approves their own request; if the requester is the approver, the step moves up.
6. Delegation by date range to someone with the same or higher role; actions recorded "on behalf of".

**Edge cases:** approver exits while a request waits (moves to their manager, HR notified); no approver found (goes to HR Manager queue); request withdrawn by employee before final approval; approver approves from an old notification after it was already decided (shows "Already decided by [name]").
**Permissions:** policies: HR Manager, CEO. Act: only the current assigned approver or delegate, or HR Manager override with reason.
**Errors:** policy that leaves no approver is refused at save time.
**Audit:** every step, action, delegation, override and policy change.
**Tests:** 3-step route; escalation after 48 h (time simulated); self-approval blocked; delegate acts on behalf; policy change does not alter in-flight requests.

---

## F7. Employee self-service and requests

**User stories**
- As an employee, I open the app on my phone and see my next shift, leave balance, pending requests and announcements on one screen.
- As an employee, I request a letter, an attendance correction, a schedule change or a profile update, and track it.
- As an employee, I read policies and announcements in my language.

**Acceptance criteria**
1. Home screen loads in under 3 seconds on a slow 3G connection; shows next shift, today's clock status, leave balances, pending requests, unread announcements, expiring documents.
2. Request types in Phase 1: leave, attendance correction, schedule change, letter, profile/bank update, general HR question.
3. Each request shows status, current approver, step history and comments.
4. Announcements target entity / brand / branch / department; shown in the reader's language (fallback to the other language with a note).
5. Payslips section shows payslips when imported (Phase 2); shows "Not available yet" in Phase 1.

**Edge cases:** employee without a phone (manager submits on their behalf; logged as such); employee in notice period (can still request leave per policy); shared tablet (kiosk shows only clock-in).
**Permissions:** self only; manager on-behalf for leave, corrections and schedule changes.
**Errors:** offline: request saved as draft and sent when online, with a clear "Not sent yet" label.
**Audit:** submit, withdraw, on-behalf submissions.
**Tests:** home screen performance budget on throttled network; Arabic layout; on-behalf submission recorded; offline draft sync.

---

## F8. Leave

**User stories**
- As an employee, I request leave and see my balance before and after.
- As a manager, I see my team's leave calendar and who else is off when I approve.
- As HR, I configure leave types per country and entity and adjust balances with a reason.

**Acceptance criteria**
1. Leave types, eligibility, accrual and carry-over are configured per country/entity and linked to a rule in the country rules register [10]; no rule is active in production until its status is "Approved".
2. Days counted per the type's rule (calendar or working days), excluding rest days and public holidays where the rule says so; half days supported.
3. Balance = sum of ledger entries; the balance screen lists each entry.
4. Overlapping requests refused; requests over balance refused unless the type allows negative balance or converts to unpaid (shown before submitting).
5. Approved leave appears on the roster and blocks shift assignment for those dates (manager warned).
6. Cancelling started leave needs approval; ledger reversed with a reversal entry.
7. Opening balances loaded through import and signed off by HR per employee.

**Edge cases:** public holiday added after leave approved (recalculate and credit back, notify employee); leave across a month end (split for payroll inputs); leave across a year end (carry-over rules); employee transfers entity during leave (balance handling per policy, HR prompted); sick leave needing a certificate after N days (attachment required).
**Permissions:** request: self, manager on behalf; approve: per route; adjust balances: HR Officer (with reason), HR Manager.
**Errors:** clear messages for each refusal (overlap, balance, notice, blackout).
**Audit:** every request step and ledger entry; manual adjustments need a reason.
**Tests:** working-day calculation around a public holiday and rest day; carry-over at year end; cancel started leave; holiday added after approval credits back; Oman and UAE types separated.

---

## F9. Shifts and rosters

**User stories**
- As a branch manager, I build next week's roster from shift templates, see coverage per hour, and publish it.
- As an employee, I see my published shifts and get notified when they change.
- As an employee, I request a shift swap or schedule change.

**Acceptance criteria**
1. Shift templates per branch, with breaks; split shifts (two segments in one day) and overnight shifts supported.
2. Roster checks with warnings: overlapping shifts, minimum rest between shifts, weekly hours over the configured maximum, assigned on leave or rest day, coverage below the minimum set per hour and role. Hard blocks: overlapping shifts for the same person; shifts for an exited employee.
3. Copy last week; drag to reassign on desktop; simple list editing on phone.
4. Publishing notifies affected staff; changes after publishing notify again and are versioned.
5. Employees may work at another branch (shift belongs to that branch; cost centre for hours follows configured rule).
6. Ramadan hours supported as a configured period with different templates and limits.

**Edge cases:** shift crossing midnight on the last day of the month; public holiday shift (flag for holiday pay rule); daylight saving does not apply in UAE/Oman but timestamps stored with timezone anyway; manager edits a published past shift (needs reason, flagged for payroll).
**Permissions:** create/publish: branch manager (own branch), line manager if granted; view: branch staff see own shifts; HR and Payroll view.
**Errors:** publish blocked while hard conflicts exist, with the list of conflicts.
**Audit:** create, edit, publish, version changes.
**Tests:** split and overnight shifts; rest-between-shifts warning; coverage warning; publish notifications; leave blocks assignment.

---

## F10. Clock-in, attendance exceptions and corrections

**User stories**
- As an employee, I clock in and out on my phone at the branch, or on the branch tablet.
- As a manager, I review today's exceptions (late, missed punch, absent, overtime, wrong branch) and approve corrections.
- As payroll, I receive only approved attendance.

**Acceptance criteria**
1. Mobile clock-in records time (server time when online; device time and sync time when offline), location and accuracy; inside/outside geofence decided by branch radius and accuracy threshold.
2. Clock-in rules configured per entity and role: allowed methods, geofence required or not, photo required or not, early clock-in window, grace period.
3. Punches matched to shifts; attendance day calculated: worked minutes, late, early leave, overtime, missed punch, absent, unscheduled work.
4. Exceptions list for managers each day, with one-tap actions: accept, request explanation, correct.
5. Corrections are separate records with reason and approval; raw punches never change.
6. At cut-off, unresolved exceptions block the period lock for that branch until cleared or marked "Accept as is" by HR.

**Edge cases:** punch outside geofence (allowed but flagged, if the rule permits); punch with very poor GPS accuracy; no shift but punched (unscheduled work); two punches within a minute (deduplicate); forgot to clock out after overnight shift; offline punch synced days later (flagged "late sync"); phone clock wrong (server time used when online; large difference flagged).
**Permissions:** clock: self, on own bound phone or registered kiosk; corrections: request by employee or manager; approve per route; HR can accept-as-is.
**Errors:** clock-in without location permission shows how to enable it, and offers tablet clock-in instead.
**Audit:** every punch (source, device, location), correction, approval.
**Tests:** geofence inside/outside; offline punch sync; overnight shift attribution to start day; missed punch exception; correction approval updates attendance day but not the raw punch; kiosk cannot show any personal data.

---

## F11. Bulk import and export

**User stories**
- As an HR Manager, I load all current employees, assignments, salary lines, documents metadata and opening leave balances from controlled templates.
- As HR, I export lists in the same template format.

**Acceptance criteria**
1. Templates downloadable from the app, versioned, with Arabic and English headers and a guide sheet.
2. Validate step lists every error by row and column; nothing saved.
3. Commit step (HR Manager) saves all rows or none.
4. Re-importing the same file updates matching records by employee number and entity, with an effective date for changes.
5. Exports respect the user's scope and data classes, state filters and date in the file, and are logged.

**Edge cases:** Arabic text encoding (UTF-8; Excel files read natively); dates in different formats (template forces ISO or Excel dates); duplicate rows in the file; employee number belonging to another entity.
**Permissions:** validate: HR Officer; commit: HR Manager; export per scope.
**Errors:** file over 5,000 rows or 10 MB refused with message; wrong template version refused.
**Audit:** batch and each row change.
**Tests:** valid file commits; one bad row blocks commit; re-import updates with history; export excludes salary for roles without D4.

---

## F12. Hiring hand-off and onboarding checklists

**User stories**
- As HR, when a candidate is hired in Forka Hiring, I get a pre-filled new employee record to complete.
- As HR, I define onboarding checklists by role, brand and country (documents to collect, uniform, training, system access, medical, visa steps).
- As a new employee, I see my first-week tasks and upload the documents requested.

**Acceptance criteria**
1. Hand-off creates a Pending start employee with the data and files HR selected; duplicate check runs.
2. The checklist template is chosen automatically by conditions; HR can add items.
3. Items have owner (HR, manager, employee, IT), due date relative to start date, and required flag; overdue items show on dashboards.
4. Employee cannot be activated until required pre-start items are done (or HR Manager overrides with reason).

**Edge cases:** start date changes (due dates move); hire cancelled before start (record closed, reason kept, files deleted per retention); hand-off fails (visible in Integrations; file import fallback).
**Permissions:** templates: HR Manager; items: owners; view: HR, manager, the employee (own items).
**Errors:** hand-off with missing required fields creates the record as a draft listing what is missing.
**Audit:** hand-off receipt, checklist creation, item completion, overrides.
**Tests:** hired candidate appears in Forka People; duplicate detection; activation blocked until required items done; failed hand-off retried.

---

## F13. Standard letters and certificates

**User stories**
- As an employee, I request a salary certificate or experience letter in English or Arabic and download it when issued.
- As HR, I issue letters from approved templates without retyping data.

**Acceptance criteria**
1. Templates have EN and AR versions, placeholders (name, job, start date, salary if allowed, entity details, signatory), version and approver.
2. Generated as PDF with the entity letterhead and a unique reference number and QR code for verification.
3. Letters that show salary need HR Manager approval.
4. Verification page confirms a letter's reference, date and holder name only (no salary).

**Edge cases:** template edited after a letter was issued (old letter keeps its version); employee exited (experience letter still available on request).
**Permissions:** request: self; issue: HR; template approval: HR Manager.
**Errors:** missing data needed by a placeholder blocks issue and names the field.
**Audit:** request, issue, download, verification lookups.
**Tests:** Arabic PDF renders correctly (shaping, RTL, digits); salary letter needs approval; verification shows no salary.

---

## F14. Payroll input export (Phase 1B)

**User stories**
- As Payroll, I export approved attendance, overtime, unpaid leave, joiners, leavers and changes for a period and pay group.

**Acceptance criteria**
1. Export only after HR locks the period; contains only approved data.
2. File layout configurable per payroll provider; totals row and control counts included.
3. Each export stored with hash, period, pay group and who exported it.
4. Late changes after lock go to the next period as adjustments referencing the original period.

**Edge cases:** employee transfers mid-period between pay groups (split lines); overtime rule not yet approved in the rules register (overtime exported as hours only, not amounts).
**Permissions:** lock: HR Manager; export: Payroll; view: Finance.
**Errors:** export blocked with a list of unresolved exceptions.
**Audit:** lock, reopen (with reason and two approvals), export.
**Tests:** export matches approved attendance; reopen requires two approvals; late change appears in next period.

---

## Non-functional acceptance (Phase 1)

- Accessibility: WCAG 2.2 AA for contrast, labels, focus and touch targets (at least 44 px).
- Performance: 95% of pages under 2 seconds on 4G; home screen under 3 seconds on slow 3G.
- Availability target: 99.5% monthly, excluding announced maintenance outside restaurant peak hours.
- Security: independent penetration test with no open high-severity findings at go-live.
- Documentation: administrator guide sections for every Phase 1 setting; runbooks for restore, device revocation, period reopen.
