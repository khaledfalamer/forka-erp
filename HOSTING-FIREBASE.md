# erp.forka.com on Firebase Hosting (test address first)

Goal: serve the same site from Firebase Hosting in the Google Cloud project **forka-apps** (where the Forka Apps
server already runs), instead of GitHub Pages. Why: pages are always checked for a new version (no 10-minute old
copies), preview links per change, one-click rollback, and the code repositories can then be made private.

**Nothing live changes.** erp.forka.com keeps running on GitHub Pages until Khaled says "go live" and the DNS
record in NameSilo is changed.

## What is in the repo

- `tools/build_site.sh` builds the public site into `_site/` (the same files GitHub Pages publishes; GitHub Pages now uses this script too).
- `firebase.json` Firebase Hosting settings: site `forka-erp`, pages and settings always checked fresh (`no-cache`), logos kept for one day.
- `.firebaserc` the project: `forka-apps`.

## Put it on the test address (Khaled, about 10 minutes, once)

1. Open https://console.cloud.google.com, choose the project **forka-apps**, click **Activate Cloud Shell** (the `>_` button at the top right).
2. Get the branch:
   ```bash
   cd forka-erp && git fetch origin claude/serene-mayer-b0wusx && git checkout claude/serene-mayer-b0wusx && git pull
   ```
3. Create the hosting site (once) and publish:
   ```bash
   npx -y firebase-tools@latest hosting:sites:create forka-erp --project forka-apps
   ```
   ```bash
   npx -y firebase-tools@latest deploy --only hosting --project forka-apps
   ```
   If it asks you to sign in, run `npx -y firebase-tools@latest login --no-localhost`, follow the link, then run the deploy line again.
   If it says the name `forka-erp` is taken, tell Claude; the name in `firebase.json` changes.
4. Allow Google sign-in on the test address: Google Cloud console > **APIs & Services** > **Credentials** >
   OAuth client `443945615318-21aveveme3c8n41fepp4gmof3vnrs8if` > **Authorized JavaScript origins** > **Add URI**:
   `https://forka-erp.web.app`, and again `https://forka-erp.firebaseapp.com` > **Save**. Takes up to a few minutes.
5. Open **https://forka-erp.web.app**.

The test address uses the **live servers and real data** (it is the same app at a second address). Anything done
there is real.

## Update the test address later

In Cloud Shell: `cd forka-erp && git pull`, then the deploy line from step 3.

## Go live (only when Khaled says "go live")

1. Firebase console > Hosting > site forka-erp > **Add custom domain** > `erp.forka.com`. Firebase shows the DNS records.
2. In NameSilo, replace the `erp` CNAME record (now `khaledfalamer.github.io`) with the records Firebase shows.
3. Wait until Firebase shows the certificate as ready (minutes to a few hours). Keep GitHub Pages running until then.
4. Then the same for apply.forka.com and procurement.forka.com, then make the repositories private.

**Rollback:** in NameSilo, put the `erp` CNAME back to `khaledfalamer.github.io` (GitHub Pages still publishes on
every push to main). Or Firebase console > Hosting > release history > roll back to an earlier version.

## Automatic publishing of the new app (no Cloud Shell)

Workflow: `.github/workflows/app-test-site.yml`. On every push to a working branch (never main) it builds the new app
(`app/`), runs its checks, and, if they pass, publishes it to the **test address** https://forka-erp-next.web.app.
erp.forka.com and procurement.forka.com are not touched; going live still needs Khaled's "go live".

**Switch it on (Khaled, once, about 10 minutes):**
1. Cloud Shell, project **forka-apps**: `cd forka-erp && git pull && bash tools/firebase_deploy_setup.sh`
   (creates a Google account that may only publish web pages, and allows only this GitHub repository to use it;
   no password or key is created).
2. GitHub: **forka-erp > Settings > Secrets and variables > Actions > Variables > New repository variable**:
   name `FIREBASE_DEPLOY`, value `on`.

Until step 2, the workflow still builds and checks every change but publishes nothing.

**See what happened:** GitHub > forka-erp > **Actions** > "New Forka App - check and publish to the test address".

**Switch it off:** set the variable `FIREBASE_DEPLOY` to `off` (stops at once). To remove the Google side as well, in Cloud Shell:
`gcloud iam workload-identity-pools delete github --location global --project forka-apps` and
`gcloud iam service-accounts delete github-deploy@forka-apps.iam.gserviceaccount.com --project forka-apps`.
