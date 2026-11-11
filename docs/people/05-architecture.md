# 05. Architecture proposal

**Recommendation in one line:** a single TypeScript web application (server and installable mobile web app) with
PostgreSQL, hosted on AWS in the UAE region (me-central-1), using managed services so one engineer can run it, and
everything held in group-owned accounts.

This is a proposal for CTO review. The main choices are written as decision records (section 9) so they can be challenged one by one.

## 1. Shape of the system

```mermaid
flowchart TB
  subgraph Users
    E[Employees: phone]
    M[Managers: phone / laptop]
    HR[HR, Payroll, Finance: laptop]
    K[Branch tablet: clock-in kiosk]
  end
  subgraph AWS me-central-1 UAE, group account
    WAF[Web firewall + TLS] --> LB[Load balancer]
    LB --> API[App server<br/>2+ containers]
    API --> DB[(PostgreSQL<br/>Multi-AZ, encrypted)]
    API --> S3[(File storage<br/>private, encrypted, versioned)]
    W[Background worker<br/>reminders, imports, integrations] --> DB
    W --> S3
    KMS[Key management] -.-> DB & S3 & API
    LOG[Logs, metrics, alarms]
  end
  CDN[Static app files<br/>people.forka.com] --> Users
  Users --> WAF
  W --> MAIL[Email service]
  W --> PUSH[Web push]
  W --> EXT[Payroll provider / bank WPS / accounting]
  BIO[Biometric devices or device cloud] --> API
  HIRE[Forka Hiring] --> API
  GOOG[Google sign-in] --> API
```

- **Modular monolith.** One codebase, one deployable server, with clear internal modules: `org`, `people`, `documents`, `lifecycle`, `workflow`, `leave`, `time`, `payroll-inputs`, `notifications`, `integrations`, `audit`, `access`, `reporting`. Each module owns its tables. This is simpler to build, test and run than microservices at 120 to 400 employees, and modules can be split out later if ever needed.
- **Background worker.** The same codebase, run as a separate process: daily expiry checks, reminders, accruals, imports, integration sync, report exports. The job queue lives in PostgreSQL (no extra queue service to run).
- **Domain:** `people.forka.com`, with a tile in the Forka Apps hub.

## 2. Technology

| Layer | Choice | Why |
|-------|--------|-----|
| Language | TypeScript everywhere | One language for server and app; strong typing for a data-heavy system; easy to hire for in the region |
| Server | Node.js LTS, NestJS (modules match the domains above), Kysely for SQL | Clear module boundaries; SQL stays explicit, which matters for row-level security and reporting |
| Database | PostgreSQL 16, managed (Amazon RDS), Multi-AZ | Transactions, enforced relationships, row-level security for entity separation, mature backups |
| Files | Amazon S3, private bucket, KMS encryption, versioning, signed short-lived links | Documents never public; old versions kept |
| Mobile and web app | Installable web app (PWA): React, Vite, offline store for clock-in and drafts | One app for phones, tablets and laptops; no app store needed; works on low bandwidth; installs to the home screen on Android and iPhone |
| Arabic / English | ICU message files per language; CSS logical properties so the layout mirrors for Arabic; Arabic and Latin digits by user choice; dates shown Gregorian (Hijri shown alongside where useful) | Correct right-to-left without a second set of screens |
| Infrastructure | Terraform (or OpenTofu) for all cloud resources; GitHub Actions for build, test, deploy | Everything rebuildable from the repository; nothing set up by hand |
| Native app (later, only if needed) | Wrap the same web app with Capacitor | Only if we need features the web cannot do well (for example some biometric or background-location needs) |

Budget for the app: under 250 KB of code on first load, server-rendered lists with paging, images resized on upload,
and the app usable on a slow 3G connection. Clock-in works offline and syncs later.

## 3. Hosting and data residency

- **Default:** AWS Middle East (UAE) region, me-central-1, three availability zones. All production data, backups and logs stay in this region.
- **Alternative:** Microsoft Azure UAE North, if the group already has Microsoft agreements. The design does not depend on AWS-only features except managed services that have direct Azure equivalents.
- **Oman data:** stored in the same database, separated by legal entity with row-level security. **If legal advice (Q1) says Oman employee data must stay in Oman**, we run a second deployment with an Oman-based provider for Oman entities, and group reports read aggregated figures from both. This roughly doubles hosting cost and adds about 3 weeks.
- No production personal data in development or test. Staging uses generated or anonymised data.
- Third-party tools that would receive personal data (error tracking, email) are either hosted in-region or configured to strip personal data before sending. Each one is listed in the processor register in [06](06-security.md).

## 4. Environments

| Environment | Data | Who | Deploys |
|-------------|------|-----|---------|
| Development | Generated | Engineers | Every commit, locally |
| Staging | Generated or anonymised | Engineers, HR testers, CTO | Every merge to main, automatically after tests pass |
| Production | Real | Users | Only after the CEO says "go live" for the release, from a tagged version |

Database changes are versioned migrations, run automatically during deploy, and written to be backward compatible
for one release so a rollback of the app does not break the data.

## 5. Backups and disaster recovery

| Item | Approach | Target |
|------|----------|--------|
| Database | Continuous backup with point-in-time restore (35 days); daily snapshot kept 35 days; monthly snapshot kept 12 months | Lose at most 5 minutes of data (RPO) |
| Off-account copy | Daily encrypted database export and file copy to a **separate group-owned AWS backup account** in the same region, write-once (Object Lock) | Protects against account compromise or accidental deletion |
| Files | S3 versioning, 30-day recovery of deleted files; replicated to the backup account | |
| Restore drill | Full restore to a scratch environment every quarter, timed and recorded | Service back within 4 hours (RTO) |
| Infrastructure | Rebuild from Terraform in the repository | |
| Region-wide outage | Accept for Release 1 (multi-AZ covers data centre failures). Revisit if the business needs more; cross-region copies must respect residency rules | |

## 6. Monitoring and operations

- Health checks every minute; alerts by email and phone to the on-call person.
- Alarms for: errors, slow responses, database CPU / storage / connections, failed jobs, failed integration syncs, failed sign-ins spike, backup failure, certificate expiry.
- Error tracking with personal data stripped.
- A status page for HR showing integration health and the last successful sync per integration.
- Monthly patching of dependencies; security updates within 7 days (critical within 48 hours).
- Runbooks for: restore, rotate keys, revoke a lost device, reopen a payroll period, failed WPS export.

## 7. Rough running cost (to confirm with a pricing calculator)

At this size, production plus staging plus backup account: **about USD 300 to 450 per month**
(database Multi-AZ is the largest item, then containers, load balancer, firewall, network). Email and storage are small.
Development tools (GitHub, error tracking) add about USD 50 to 100 per month. Figures to be confirmed for me-central-1 pricing before approval.

## 8. Ownership: what the group must hold

The group (not a person, not an agency) must be the owner of:
- GitHub organisation and the `forka-people` repository (source code, issues, documentation, CI).
- AWS organisation: production, staging and backup accounts, with root credentials in the group's vault and hardware security keys for administrators.
- Domain `forka.com` DNS, and the `people.forka.com` certificate.
- Email sending domain and settings (SPF, DKIM, DMARC).
- Google Cloud project for sign-in.
- Contracts and API credentials for payroll, bank WPS, biometric and accounting integrations.
- Encryption keys (in AWS KMS in the group's account).
- All documentation and the administrator guide (in the repository).

Data export: an HR Manager or the CEO can export all company data at any time as CSV (one file per table) plus all documents with an index file,
and the database can be exported as a standard PostgreSQL dump. Nothing is held in a proprietary format.

## 9. Decision records (for CTO review)

| ADR | Decision | Alternatives considered | Reason |
|-----|----------|-------------------------|--------|
| 001 | New system, not an extension of the Apps Script + Sheets apps | Extend Forka Apps on Sheets | Sheets cannot meet field-level access, view logging, encryption-key control, or transactional integrity ([01](01-discovery.md#why-the-current-setup-cannot-hold-hr-data)) |
| 002 | Build our own rather than buy an HR product | Licensed HR SaaS | The brief requires group ownership of code, data and design. Buying remains an option for payroll calculation alone. |
| 003 | Modular monolith | Microservices | Team size and scale; fewer things to run |
| 004 | PostgreSQL with row-level security per legal entity | One database per entity | Group reporting stays simple; separation enforced in the database, not only in code |
| 005 | Installable web app (PWA) first | Native iOS/Android apps | One codebase, no store releases, works on low bandwidth; native wrapper possible later |
| 006 | AWS me-central-1 | Azure UAE North; local UAE providers | UAE residency, mature managed PostgreSQL and KMS; Azure is a close second |
| 007 | Payroll: inputs and exports first, calculation later | Calculate payroll from day one | Calculation needs validated country rules and is the highest-risk area |
| 008 | Job queue in PostgreSQL | Separate queue service | One less service to run; volumes are small |
