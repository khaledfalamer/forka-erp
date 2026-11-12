# Forka Apps server on Google Cloud (Firebase project)

This replaces the Apps Script servers, one app at a time, with one Node server and **one PostgreSQL database**
for all Forka apps (later also Forka People). Files (CVs, board attachments, documents) go to **Cloud Storage** in the same project.

| App | Today (Apps Script + Sheet) | New address | Status |
|---|---|---|---|
| Accounts (sign-in, People and access) | Forka Apps - Accounts server | `/accounts` | Built and tested (45 checks) |
| Boards | Forka Boards server | `/boards` | Next. Goes live **together with Accounts**, because Boards reads and adds people in the accounts list |
| Hiring (and apply.forka.com) | Hiring script | `/hiring` | After Boards |
| Procurement | Procurment script | `/procurement` | Last |

The new server answers exactly like the Apps Script one (same requests, same answers), so at go-live each website only
changes its server address in `config.js`. The Apps Script projects stay untouched as the way back.

## One-time setup (done 12 Nov 2026 unless marked)

Project **forka-apps** (organisation forka.com, the same project as the Google sign-in client).

- Database: Cloud SQL **forka-db**, PostgreSQL 18, Enterprise, shared core 1 vCPU / 1.7 GB, me-central1 (Doha), single zone.
  Automated backups 7 days + point-in-time recovery on. Database **Forka**, app user **forka_app**.
  Connection name `forka-apps:me-central1:forka-db`.
- Files: Cloud Storage bucket **forka-apps-files** (me-central1, public access blocked).
- Secret Manager: **PGPASSWORD** = the forka_app password. Nothing secret is in GitHub.

### Put the server online (Cloud Shell, the `>_` button at the top of console.cloud.google.com)

```
gcloud config set project forka-apps
PN=$(gcloud projects describe forka-apps --format='value(projectNumber)')
SA=$PN-compute@developer.gserviceaccount.com
gcloud projects add-iam-policy-binding forka-apps --member=serviceAccount:$SA --role=roles/cloudsql.client
gcloud projects add-iam-policy-binding forka-apps --member=serviceAccount:$SA --role=roles/secretmanager.secretAccessor
gcloud projects add-iam-policy-binding forka-apps --member=serviceAccount:$SA --role=roles/run.builder
git clone -b claude/zealous-clarke-ax4jbr https://github.com/khaledfalamer/forka-erp && cd forka-erp/platform
gcloud run deploy forka-apps --source . --region me-central1 --allow-unauthenticated \
  --add-cloudsql-instances forka-apps:me-central1:forka-db \
  --set-env-vars PGHOST=/cloudsql/forka-apps:me-central1:forka-db,PGUSER=forka_app,PGDATABASE=Forka \
  --set-secrets PGPASSWORD=PGPASSWORD:latest
```
Answer **Y** when it asks to enable services (Cloud Build, Artifact Registry, Cloud Run).
forka.com's organisation policy does not allow "allUsers", so open the server with
`gcloud run services update forka-apps --region=me-central1 --no-invoker-iam-check` (done 12 Nov 2026).
The server checks every sign-in itself, like the Apps Script web apps set to "Anyone".

**Online since 12 Nov 2026:** https://forka-apps-443945615318.me-central1.run.app (database connected, no people copied yet).
On start the server creates its tables itself. It prints an address like `https://forka-apps-xxxx.me-central1.run.app`;
opening `.../accounts` must show `{"ok":true,"service":"forka-apps-accounts"}`.
The live site does not use this server until go-live.

**Update later:** in Cloud Shell, `cd forka-erp && git pull && cd platform` and run the same `gcloud run deploy` line again.

## Go-live for Accounts (+ Boards), when Khaled says "go live"

1. Download the Accounts Sheet tabs People, Requests, Activity as CSV, and copy the Script property `SALT`.
2. In Cloud Shell, with the Cloud SQL Auth Proxy running (`cloud-sql-proxy forka-apps:me-central1:forka-db &`):
   `PGHOST=127.0.0.1 PGUSER=forka_app PGDATABASE=Forka PGPASSWORD=... SALT=... node scripts/import-accounts.js People.csv Requests.csv Activity.csv`
   (refuses to run twice unless `--replace`).
3. Change `ACCOUNTS_URL` (and `BOARDS_URL`) in `config.js` to `https://forka-apps-xxxx.me-central1.run.app/accounts` (`/boards`), push to main.
4. Paste the new `ACCOUNTS_URL` constant into the Hiring and Procurement scripts (they ask the accounts server "who").
5. Everyone signs in once more (old sessions do not carry over). PINs keep working because the salt was copied.

**Way back:** put the old Apps Script address back in `config.js` and the two scripts. The Sheet still has the data as it was at
the switch; changes made after the switch would need copying back by hand.

## Checks

`TEST_DATABASE_URL=postgres://... node tests/platform_accounts_test.mjs` runs the same 41 checks as the Apps Script accounts
server (tests/server_test.js) over HTTP against a throwaway database, plus 4 new ones (session tokens stored only as hashes,
parallel saves cannot hand out the same PIN twice, broken requests, open to every page). Without TEST_DATABASE_URL it skips.

## Running cost (estimate, check the Google Cloud pricing calculator)

Cloud SQL smallest machine about USD 10 to 30, Cloud Run free tier at this size to about USD 5, Storage and backups a few dollars.
About **USD 20 to 40 a month** to start; about USD 80 to 150 with a standby database copy once Forka People holds HR data.
