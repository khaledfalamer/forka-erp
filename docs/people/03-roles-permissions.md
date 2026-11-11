# 03. Roles and permissions

## 3.1 How access works

Access = **role** (what you can do) × **scope** (where you can do it) × **data class** (what kind of data).

- **Scope** is one or more of: group, legal entity, brand, branch, department, own team (direct and indirect reports), self.
- **Data classes:**

| Class | Examples | Default visibility |
|-------|----------|--------------------|
| D1 Directory | Name, photo, job title, branch, work phone | Everyone in the same entity |
| D2 Work | Shifts, attendance, leave dates (not reason), reporting line, probation date | Self, manager chain, HR in scope |
| D3 Personal | Date of birth, nationality, home address, emergency contacts, dependants, ID and passport numbers | Self, HR in scope |
| D4 Pay | Salary components, bank account, payslips, advances, settlement | Self, Payroll in scope, HR Manager, CEO |
| D5 Sensitive | Medical notes, disciplinary, grievance, investigations | Named case owners and HR Manager only, case by case |

- The CEO (active) has every role in every scope automatically, as in the other Forka Apps.
- A person can hold several roles with different scopes (for example, Branch Manager of Sharjah, and Employee everywhere).
- Every read of D3, D4 or D5 data is written to the access log (see [06](06-security.md)).

## 3.2 Roles

| Role | Typical person | Scope |
|------|----------------|-------|
| Employee | Everyone | Self |
| Line Manager | Supervisor, head chef | Own team |
| Branch Manager | Restaurant / café manager | Branch |
| Department Head | Head office department head | Department |
| HR Officer | HR staff | Assigned entities |
| HR Manager | Head of HR | Assigned entities, or group |
| Payroll Officer | Payroll / finance staff | Assigned pay groups |
| Finance Approver | Finance manager | Assigned entities |
| Group Viewer | Directors, owners | Group, aggregated figures only by default |
| System Administrator | IT / CTO | Settings and integrations; **no** access to D3 to D5 data by default |
| Auditor (read-only) | External or internal auditor | Time-limited, scope and data classes chosen when access is granted |
| CEO | Khaled | Everything, automatic |

## 3.3 Permission matrix (launch features)

V = view, C = create, E = edit, A = approve, X = export. "Scope" means within the role's scope only.

| Action | Employee | Line Mgr | Branch Mgr | Dept Head | HR Officer | HR Manager | Payroll | Finance | Group Viewer | Sys Admin | CEO |
|--------|---------|----------|-----------|-----------|-----------|-----------|---------|---------|-------------|-----------|-----|
| Org structure (entities, branches, departments) | V | V | V | V | V | C E | V | V | V | C E (no people data) | all |
| Directory (D1) | V | V | V | V | V | V | V | V | V | V | all |
| Own profile | V; E contact details and emergency contacts (HR verifies) | | | | | | | | | | all |
| Team work data (D2) | — | V | V | V | V E | V E | V | — | aggregate | — | all |
| Personal data (D3) | own | — | — | — | V E | V E | V (bank only) | — | — | — | all |
| Pay data (D4) | own payslips | — | — | — | — | V E | V E | V | aggregate | — | all |
| Sensitive cases (D5) | own cases (limited) | — | — | — | named cases | V E | — | — | — | — | all |
| Create employee (from hire or manual) | — | — | — | — | C | C | — | — | — | — | all |
| Transfer / promotion / salary change | — | propose | propose | propose | C | A | V | A (salary) | — | — | all |
| Termination | — | propose | propose | propose | C | A | V | V | — | — | all |
| Documents: upload | own | — | — | — | C E | C E | — | — | — | — | all |
| Documents: verify | — | — | — | — | A | A | — | — | — | — | all |
| Leave request | C | C for team (on behalf) | C for team | C for team | C | C | — | — | — | — | all |
| Leave approve | — | A (step 1) | A | A | A (HR step) | A | — | — | — | — | all |
| Roster create / publish | — | C (if given) | C E publish | — | V | V | V | — | — | — | all |
| Attendance correction | request | A | A | A | A | A | V | — | — | — | all |
| Approval policies | — | — | — | — | V | C E | — | — | — | — | all |
| Bulk import | — | — | — | — | C (validate) | C (commit) | — | — | — | — | all |
| Reports | own | team | branch | department | entity | entity / group | pay groups | entity | aggregate | — | all |
| Export personal data | own (data copy request) | — | — | — | — | X | X (pay) | — | — | — | all |
| Audit and access logs | own access log | — | — | — | — | V | — | — | — | V (system events only) | all |
| Roles and access | — | — | — | — | — | assign below HR Manager | — | — | — | technical setup | all |

Rules:
- **Separation of duties:** the person who prepares payroll inputs cannot give the final approval for them. An HR Officer cannot approve their own salary change.
- **Break-glass:** the System Administrator can request emergency access to data. It needs a reason, expires after 4 hours, and the CEO and HR Manager are notified immediately.
- **Delegation:** an approver can delegate approvals for set dates to someone with the same or higher role. The delegate's actions are logged as "on behalf of".
