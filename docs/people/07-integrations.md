# 07. Integration plan

## 0. Pattern used for every integration

- **Outbox and inbox.** Outgoing messages are written to an `integration_message` table in the same transaction as the business change, then sent by the worker. Incoming messages are stored first, then processed. Nothing is lost if a partner is down.
- **Idempotent.** Each message has a unique key; sending or receiving it twice has no extra effect.
- **Retry with backoff** (1 min, 5 min, 30 min, 2 h, then every 6 h for 3 days), then marked **Failed** and shown on the Integrations screen with an alert to HR and the Sys Admin.
- **Visible and auditable.** Every run and message shows status, attempts, last error, the payload (sensitive values masked), and who retried or cancelled it. A failed message can be retried, edited (by an HR Manager, logged) or cancelled with a reason.
- **Documented API.** Forka People's own API is described in OpenAPI and published in the repository. Partner credentials live in Secrets Manager.

## 1. Forka Hiring to Forka People (new hire hand-off)

- Trigger: a candidate reaches `hired` in Forka Hiring and HR confirms the start date and offer details.
- Data: name, contact, nationality, job title, department, branch, entity, start date, offer reference, CV and offer letter files (only those HR selects).
- Result: a `person` and `employment` with status Pending start, and an onboarding checklist chosen by role, brand and country.
- Duplicates: if the same person already exists (same ID number, or same mobile and date of birth), HR is asked to link or create new.
- Method: Forka Hiring (Apps Script) calls a signed Forka People endpoint. If that fails, HR can import the hire from a file. Phase 1.

## 2. Biometric and clock-in devices

| Option | When | How |
|--------|------|-----|
| Mobile clock-in with geofence | Phase 1 | Built in. Location checked against the branch radius; accuracy recorded; optional selfie |
| Branch tablet kiosk | Phase 1 | Built in. Registered tablet, PIN, optional photo |
| Biometric devices with a cloud service | Phase 2 | Pull punches from the vendor's cloud API every 5 minutes |
| Biometric devices on the local network only | Phase 2 | Small connector on a branch PC or mini-PC pulls punches and sends them over HTTPS; buffers if offline |

Devices are mapped to branches and employees are mapped by employee number. Unknown employee numbers go to an exceptions list, not dropped.

## 3. Payroll provider and WPS (Phase 2 and 3)

- Release 1 exports approved **payroll inputs** per pay group (CSV/XLSX in the provider's layout).
- WPS salary files (UAE SIF format via the group's WPS agent; Oman WPS file via the group's bank) are produced only after the format is confirmed with the agent/bank and tested with a parallel run.
- Payslips: imported from the provider (PDF per employee) and released in the app, until we calculate payroll ourselves.
- Every export file is stored, hashed, and linked to the approved payroll period. Re-exporting creates a new version; the old one is kept.

## 4. Accounting

Payroll journal per entity and cost centre in the format of the accounting system in use (to collect in discovery; the group mentioned Foodics or Odoo as the long-term direction). File export first; API later if the accounting system offers one.

## 5. Email, push and messages

- Email through Amazon SES or the Google Workspace relay, from `people@forka.com`, with SPF, DKIM and DMARC.
- Web push to the installed app for approvals, shift changes and reminders.
- SMS for one-time sign-in codes (provider with UAE and Oman sender registration).
- WhatsApp alerts later, through the Meta WhatsApp Cloud API, if the group sets up an account.
- Every notification is logged with delivery status; failures retry and fall back to another channel.

## 6. Identity: Forka Apps and Google

- Google sign-in for office staff (existing Google Cloud project, or a new client for people.forka.com).
- Forka People notifies the Forka Apps accounts server when a person joins (pre-fill name, email, job title, status "To confirm") and when they exit (suspend access). The CEO still confirms app access in People and access.
- Later: Forka Apps and Boards read departments and heads from Forka People instead of keeping their own lists.

## 7. Integration register

| Integration | Direction | Phase | Owner | Method | Status |
|-------------|-----------|-------|-------|--------|--------|
| Forka Hiring | In | 1 | HR Manager | Signed API call; file fallback | To build |
| Forka Apps accounts | Out | 1 | CEO | Signed API call | To build |
| Email / push / SMS | Out | 1 | Sys Admin | Provider APIs | To build |
| Google sign-in | In | 1 | Sys Admin | OpenID Connect | To configure |
| Biometric devices | In | 2 | HR Manager | Vendor cloud API or branch connector | Waiting for device models (Q4) |
| Payroll provider | Out / In | 2 | Payroll | File export; payslip import | Waiting for provider details (Q5) |
| WPS (UAE agent, Oman bank) | Out | 3 | Payroll + Finance | File | Waiting for formats |
| Accounting | Out | 3 | Finance | File, then API | Waiting for system details |
