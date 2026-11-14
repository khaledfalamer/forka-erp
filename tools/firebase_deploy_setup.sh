#!/usr/bin/env bash
# One-time Google setup so GitHub can publish the new Forka App to the TEST address by itself.
# Run once in Cloud Shell (project forka-apps):  bash tools/firebase_deploy_setup.sh
# What it creates:
#   - a Google account "github-deploy" that may only publish Firebase Hosting (web pages) in forka-apps;
#     it cannot read or change any data, Sheets, Drive, the database or the servers;
#   - a trust rule: only GitHub Actions runs from the repository khaledfalamer/forka-erp may use it.
# No password or key file is created. To undo everything, see "Switch it off" in HOSTING-FIREBASE.md.
set -euo pipefail
P=forka-apps
PN=$(gcloud projects describe $P --format='value(projectNumber)')
SA=github-deploy@$P.iam.gserviceaccount.com
REPO=khaledfalamer/forka-erp
gcloud config set project $P >/dev/null
gcloud services enable iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com firebasehosting.googleapis.com --project $P
gcloud iam service-accounts describe $SA --project $P >/dev/null 2>&1 || \
  gcloud iam service-accounts create github-deploy --project $P --display-name "GitHub: publish web pages (Firebase Hosting only)"
gcloud projects add-iam-policy-binding $P --member "serviceAccount:$SA" --role roles/firebasehosting.admin --condition=None >/dev/null
gcloud projects add-iam-policy-binding $P --member "serviceAccount:$SA" --role roles/serviceusage.serviceUsageConsumer --condition=None >/dev/null
gcloud iam workload-identity-pools describe github --location global --project $P >/dev/null 2>&1 || \
  gcloud iam workload-identity-pools create github --location global --project $P --display-name "GitHub Actions"
gcloud iam workload-identity-pools providers describe forka-erp --location global --workload-identity-pool github --project $P >/dev/null 2>&1 || \
  gcloud iam workload-identity-pools providers create-oidc forka-erp --location global --workload-identity-pool github --project $P \
    --display-name "khaledfalamer/forka-erp" --issuer-uri "https://token.actions.githubusercontent.com" \
    --attribute-mapping "google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
    --attribute-condition "assertion.repository=='$REPO'"
gcloud iam service-accounts add-iam-policy-binding $SA --project $P --role roles/iam.workloadIdentityUser \
  --member "principalSet://iam.googleapis.com/projects/$PN/locations/global/workloadIdentityPools/github/attribute.repository/$REPO" >/dev/null
echo
echo "Done. Project number: $PN (the workflow expects 443945615318)."
echo "Last step, in GitHub: forka-erp > Settings > Secrets and variables > Actions > Variables > New repository variable:"
echo "  Name: FIREBASE_DEPLOY   Value: on"
