# 06. Security model

## 1. Sign-in (authentication)

| Who | Method | Extra protection |
|-----|--------|------------------|
| Office staff with company Google account | Google sign-in (OpenID Connect), restricted to the forka.com domain | Google's 2-step verification required by Workspace policy |
| HR, Payroll, Finance, Sys Admin, CEO | Google sign-in **plus** a second factor in Forka People (authenticator app or security key) | Re-confirm before viewing pay data or exporting; sessions expire after 30 minutes idle |
| Frontline staff | Mobile number + one-time code on first sign-in on a device; then a personal 6-digit PIN on that phone (device bound) | PIN locked after 5 wrong tries; code needed again on a new device; HR can revoke a lost device |
| Branch tablet (kiosk) | Tablet registered by HR to one branch; staff clock in with their PIN (and photo capture if enabled) | Tablet can only clock in/out and show the person's next shift; no other data |

- PINs and one-time codes are stored only as slow salted hashes (Argon2id). One-time codes expire after 5 minutes.
- Sessions: secure, HTTP-only cookies; idle timeout 30 minutes for HR roles, 14 days for employee self-service on a bound personal phone (PIN required to reopen after 15 minutes idle); absolute limit 30 days.
- Today's Forka Apps sign-in keeps working for the other apps. Forka People becomes the source of truth for who is an employee; when someone exits, their Forka Apps access is suspended automatically ([07 §6](07-integrations.md#6-identity-forka-apps-and-google)).

## 2. Authorisation

- Role × scope × data class, as in [03](03-roles-permissions.md). Checked on the server for every request; the app only hides what the server already refuses.
- **Entity separation in the database:** PostgreSQL row-level security on every table with `entity_id`. Each request sets the user's allowed entities; a query cannot return rows outside them even if the application code has a bug. Group reports use a separate read role that only sees aggregated views unless the user has group-level personal data access.
- Field-level filtering for D3 to D5 data happens in one place in the server (a serializer per data class), with tests for every role.

## 3. Encryption

- In transit: TLS 1.2+ everywhere, HSTS, no plain HTTP.
- At rest: database storage, backups and files encrypted with keys in AWS KMS (group account).
- Field-level encryption for the most sensitive values (passport, Emirates ID / Oman ID numbers, IBAN, salary amounts, medical notes): encrypted by the application with a separate key, so they are unreadable in database exports or to database administrators. Searchable by exact value through a keyed hash where needed.
- Documents: each file encrypted; downloads through signed links that expire after 5 minutes and are logged.
- Keys rotated yearly; access to keys logged.

## 4. Audit and access logs

- **Audit log** (`audit_event`): every create, change, approval, rejection, export, import, sign-in, permission change and setting change, with who, when, on behalf of whom, from where, and the before and after values (sensitive values masked in the log but recorded as "changed").
- **Access log** (`access_log`): every view of D3, D4 or D5 data, with the fields shown and the screen. Employees can see who viewed their personal and pay data (names of HR roles, not system internals).
- Both logs are append-only (no update or delete permission for any application role), each entry holds a hash of the previous entry so tampering is detectable, and they are exported daily to write-once storage in the backup account.
- Retention: 7 years for audit and payroll-related logs (to confirm with advisers).

## 5. Application security

- Secure development: code review on every change, dependency scanning, secret scanning, static analysis in CI.
- Input validation on the server for every field; file uploads limited by type and size, scanned for malware before they can be opened.
- Protection against common web attacks (OWASP Top 10): parameterised queries, output encoding, CSRF protection, strict Content Security Policy, rate limiting on sign-in and code requests.
- Web application firewall in front of the load balancer.
- Penetration test by an independent firm before go-live, then yearly.
- Secrets in AWS Secrets Manager; never in the repository or in config files.

## 6. Privacy, retention and data subject requests

To be confirmed with legal advisers for the UAE PDPL and Oman PDPL and labour record rules.

| Workflow | How |
|----------|-----|
| Notice and consent | Privacy notice shown in Arabic and English at first sign-in; acknowledgement recorded |
| Access / copy | Employee requests a copy; HR Manager approves; system builds a ZIP of their data and documents within 30 days |
| Correction | Employee edits contact data directly (HR verifies); other fields by request with evidence |
| Deletion | Only after the retention period, through an HR Manager request with a second approver; the person is anonymised (names, identifiers and files removed), aggregate and payroll totals kept where the law requires |
| Retention | Configured per data type and country (for example: payroll records, contracts and end-of-service records kept for the legally required period after exit; unsuccessful onboarding records deleted after a short period). Daily job flags records that reached their retention date for HR review |
| Legal hold | HR Manager can place a hold on a person's records to stop any deletion during a dispute |
| Processor register | List of every outside service that receives personal data, what data, where it is hosted, and the contract |
| Incident response | Plan with named owner, 72-hour internal assessment and notification steps as required by law |

## 7. People and process controls

- Administrator access only with hardware security keys; no shared accounts.
- Quarterly access review: HR Manager confirms every role grant; unused grants expire.
- Leavers lose access on their exit date automatically.
- Production database access only through break-glass with logging and CEO notification.
