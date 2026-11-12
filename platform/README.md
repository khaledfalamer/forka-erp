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

## One-time setup (Khaled, about 30 minutes)

1. **Project.** Go to console.firebase.google.com with the company Google account (not a personal one) > Add project >
   name `forka-apps`. Turn on billing (Blaze plan). Keep Google Analytics off.
2. **Database.** console.cloud.google.com > same project > SQL > Create instance > PostgreSQL 16.
   Edition Enterprise, preset Sandbox to start (smallest machine, about USD 10 to 30 a month), region: any (for example europe-west1).
   Instance ID `forka-db`. Set a strong password for the `postgres` user and keep it in your password manager.
   Then Databases > Create database `forka`. Users > Add user `forka_app` with its own strong password.
3. **Storage.** Firebase console > Storage > Get started (production mode). Files are opened only through the server, never public.
4. **Secret.** Security > Secret Manager > Create secret `DATABASE_URL` with the value
   `postgres://forka_app:PASSWORD@/forka?host=/cloudsql/PROJECT_ID:REGION:forka-db`
   (PROJECT_ID and REGION are shown on the SQL instance page).
5. **Deploy** (Cloud Shell, the `>_` button at the top of console.cloud.google.com):
   ```
   git clone https://github.com/khaledfalamer/forka-erp && cd forka-erp/platform
   gcloud run deploy forka-apps --source . --region REGION --allow-unauthenticated \
     --add-cloudsql-instances PROJECT_ID:REGION:forka-db --set-secrets DATABASE_URL=DATABASE_URL:latest
   ```
   Cloud Run prints the server address, for example `https://forka-apps-xxxx.a.run.app`.
6. **Tables.** In Cloud Shell, still in `forka-erp/platform`:
   ```
   npm install
   gcloud sql connect forka-db --user=postgres   # then type:  \c forka   and   grant all on database forka to forka_app;   then \q
   ```
   Then run the migrations through the Cloud SQL proxy (`npm run migrate` with DATABASE_URL pointing at the proxy).
   Claude will give the exact commands when you are at this step.

Nothing secret goes into GitHub: passwords live in Secret Manager only.

## Go-live for Accounts (+ Boards), when Khaled says "go live"

1. Download the Accounts Sheet tabs People, Requests, Activity as CSV, and copy the Script property `SALT`.
2. `SALT=... node scripts/import-accounts.js People.csv Requests.csv Activity.csv` (refuses to run twice unless `--replace`).
3. Change `ACCOUNTS_URL` (and `BOARDS_URL`) in `config.js` to `https://forka-apps-xxxx.a.run.app/accounts` (`/boards`), push to main.
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
