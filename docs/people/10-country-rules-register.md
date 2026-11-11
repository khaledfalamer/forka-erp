# 10. Country rules register (UAE and Oman)

**No rule in this register may be used in production until its status is "Approved" by a qualified local payroll or legal adviser.**
Values are deliberately left blank: they are filled in and signed off by the advisers, not by the development team.
The legal sources named are where we expect each rule to come from; advisers confirm the exact article, any later amendment, and how it applies to each entity.

Each rule becomes a configuration record in the system with the same fields, and the system refuses to activate a rule whose status is not "Approved".

## Fields

| Field | Meaning |
|-------|---------|
| Rule ID | Stable code, for example `AE-LEAVE-ANNUAL` |
| Country / entity | Where it applies |
| Description | What the rule controls, in plain words |
| Parameters | The values the system needs (filled in by the adviser) |
| Source | Law, decree, ministerial resolution, contract or company policy, with article |
| Effective from / to | Dates the rule applies |
| Owner | Person responsible at Forka (HR Manager, Payroll) |
| Adviser | Firm / person who validated it |
| Status | Draft, Under review, Approved, Superseded |
| Approved by / on | Name and date |

## UAE (expected main sources: Federal Decree-Law No. 33 of 2021 on the Regulation of Labour Relations and its Executive Regulations, Cabinet Resolution No. 1 of 2022; WPS rules of the Ministry of Human Resources and Emiratisation; GPSSA for UAE nationals; company policy and contracts)

| Rule ID | Description | Parameters | Status |
|---------|-------------|------------|--------|
| AE-WEEK | Standard working hours, rest days, Ramadan hours | Hours/day, hours/week, Ramadan reduction | Draft |
| AE-OT | Overtime eligibility and rates (normal day, night, rest day, public holiday) | Rates, caps, exempt roles | Draft |
| AE-LEAVE-ANNUAL | Annual leave entitlement, accrual during first year, carry-over, encashment | Days, accrual method | Draft |
| AE-LEAVE-SICK | Sick leave days and pay bands, certificate rules | Bands, documents | Draft |
| AE-LEAVE-OTHER | Maternity, parental, bereavement, study, Hajj, unpaid | Days, pay | Draft |
| AE-HOLIDAYS | Public holiday list per year (official announcements) and holiday-work compensation | Dates, compensation | Draft |
| AE-PROBATION | Maximum probation, notice during probation | Months, notice | Draft |
| AE-NOTICE | Notice periods on resignation and termination | Days | Draft |
| AE-EOSB | End-of-service gratuity basis and calculation (or alternative savings scheme if used) | Basis components, formula | Draft |
| AE-PENSION | Pension contributions for UAE and GCC nationals | Rates, salary basis | Draft |
| AE-WPS | WPS salary file (SIF) format and deadlines with the group's agent | File spec, deadlines | Draft |
| AE-DEDUCT | Lawful deductions and limits | Limits | Draft |
| AE-RETENTION | Retention periods for employee and payroll records | Years per record type | Draft |
| AE-PDPL | Personal data handling and cross-border transfer (Federal Decree-Law No. 45 of 2021, as applicable to the entity) | Conditions | Draft |

## Oman (expected main sources: Labour Law issued by Royal Decree No. 53 of 2023 and its ministerial decisions; Social Protection Law issued by Royal Decree No. 52 of 2023 and Social Protection Fund rules; Oman WPS rules; Personal Data Protection Law issued by Royal Decree No. 6 of 2022; company policy and contracts)

| Rule ID | Description | Parameters | Status |
|---------|-------------|------------|--------|
| OM-WEEK | Working hours, rest days, Ramadan hours | Hours, reduction | Draft |
| OM-OT | Overtime eligibility and rates | Rates, caps | Draft |
| OM-LEAVE-ANNUAL | Annual leave entitlement and carry-over | Days | Draft |
| OM-LEAVE-SICK | Sick leave days and pay bands | Bands | Draft |
| OM-LEAVE-OTHER | Maternity, paternity, bereavement, Hajj, marriage, unpaid, other | Days, pay | Draft |
| OM-HOLIDAYS | Public holiday list per year and holiday-work compensation | Dates | Draft |
| OM-PROBATION | Probation length and notice | Months | Draft |
| OM-NOTICE | Notice periods | Days | Draft |
| OM-EOSB | End-of-service benefits for non-Omani employees (and transition rules under the Social Protection Law) | Basis, formula | Draft |
| OM-SPF | Social protection contributions for Omani and other covered employees | Rates, basis | Draft |
| OM-OMANISATION | Omanisation targets relevant to reporting | Targets | Draft |
| OM-WPS | Oman WPS salary file format with the group's bank | File spec | Draft |
| OM-RETENTION | Record retention periods | Years | Draft |
| OM-PDPL | Personal data handling, consent and cross-border transfer | Conditions | Draft |

## Company policy rules (apply across countries unless stated)

| Rule ID | Description | Owner | Status |
|---------|-------------|-------|--------|
| CO-GRACE | Late-arrival grace period and rounding | HR Manager | Draft |
| CO-GEOFENCE | Default geofence radius and accuracy threshold | HR Manager | Draft |
| CO-ADVANCE | Salary advance limits and repayment | Finance | Draft |
| CO-APPROVALS | Approval authority matrix | CEO | Draft |
| CO-REMINDERS | Document reminder windows per document type | HR Manager | Draft |
