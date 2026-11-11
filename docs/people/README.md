# Forka People: planning package (draft for CTO review)

Status: **Draft v0.1, 11 Nov 2026. Not approved. No production code has been written.**
Owner: Khaled Alamer (CEO). Reviewer: CTO. Prepared by: Claude (HR technology product architect).

Forka People is the working name for the group's own HR and people-management platform. It covers each
person's employment from their approved hire onward. It does not cover recruiting: that stays in Forka Hiring
and on apply.forka.com.

The product, workflows, code, wording and visual identity are original and owned by Forka. It follows common
HR software patterns (employee master record, approval chains, leave ledger, time and attendance, payroll inputs)
but does not copy the code, screens, wording, branding or materials of any vendor, including ZenHR.

## Documents

| # | Document | What it answers |
|---|----------|-----------------|
| 01 | [Discovery and open questions](01-discovery.md) | What exists today, what we still need to collect, and the questions that change the design |
| 02 | [Process maps](02-process-map.md) | How each HR process flows: lifecycle, leave, attendance, month-end, documents |
| 03 | [Roles and permissions](03-roles-permissions.md) | Who can see and do what, by entity, branch, department and data type |
| 04 | [Data model](04-data-model.md) | The tables, how they link, and how history is kept |
| 05 | [Architecture](05-architecture.md) | Hosting, database, application, backups, monitoring, disaster recovery, data residency |
| 06 | [Security model](06-security.md) | Sign-in, encryption, audit, entity separation, privacy workflows |
| 07 | [Integration plan](07-integrations.md) | Hiring hand-off, biometrics, payroll/WPS, accounting, email, identity, and how failed syncs are handled |
| 08 | [Delivery plan](08-delivery-plan.md) | Phases, what is needed at launch and what comes later, estimates, risks |
| 09 | [Phase 1 feature specifications](09-phase1-specs.md) | User stories, acceptance criteria, edge cases, permissions, errors, audit and tests for each launch feature |
| 10 | [Country rules register](10-country-rules-register.md) | Every UAE and Oman rule we plan to configure, with its source, effective date, owner and approval status |

## Decisions needed before Phase 1 starts

1. Answers to the questions in [01-discovery.md](01-discovery.md#questions-that-change-the-design), in particular hosting location, who builds and runs the system, and how frontline staff sign in.
2. CTO approval of the architecture ([05](05-architecture.md)) and security model ([06](06-security.md)).
3. The group creates and owns the accounts listed in [05 §Ownership](05-architecture.md#ownership-what-the-group-must-hold): source code organisation, cloud account, domain, email sender.
4. Sign-off on the Phase 1 scope in [08](08-delivery-plan.md).

## Standing rules carried into this product

- Arabic and English on every screen, with correct right-to-left layout. Plain English, because many staff read English as a second language.
- Forka brand: charcoal #2B2B2B, paper/off-white, bronze #8C6A3F. EB Garamond headings, Inter Tight text, IBM Plex Sans Arabic. No emojis.
- Required fields show red when they block saving or the next step.
- An active CEO has full access automatically, without having to give himself access.
- No secrets in the repository. Nothing goes live without the CEO saying "go live" for that change.
- Country payroll and legal rules are never hard-coded. Each rule has a documented source, effective date, owner and approval status, and qualified local advisers validate it before it is used in production.
