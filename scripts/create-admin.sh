#!/usr/bin/env bash
#
# Create (or re-invite) the one person allowed to manage photos.
#
# Cognito emails them a temporary password; the admin page asks for a new one
# on first sign-in. Re-running for an existing user resends the invitation.
#
# Usage: bash scripts/create-admin.sh <email> [stage]
#   stage defaults to dev. Reads the user pool id from the stage's deployed
#   state (`sst state export`), so it works for stages deployed from CI too.
set -euo pipefail

EMAIL="${1:?usage: create-admin.sh <email> [stage]}"
STAGE="${2:-dev}"
export AWS_PROFILE="${AWS_PROFILE:-marino-pavers}"
REGION="us-west-1"

# SST 4 has no `sst output`; the stack outputs live on the Stack resource in
# the exported Pulumi state.
POOL_ID="$(npx sst state export --stage "$STAGE" 2>/dev/null | python3 -c '
import json, sys
state = json.load(sys.stdin)
for r in state["latest"]["resources"]:
    if r["type"] == "pulumi:pulumi:Stack":
        print(r["outputs"]["userPoolId"])
' 2>/dev/null || true)"

if [ -z "$POOL_ID" ]; then
  echo "✗ Couldn't read userPoolId from the $STAGE stage state. Has it been deployed, and are you signed in (aws sso login --profile $AWS_PROFILE)?" >&2
  exit 1
fi

if aws cognito-idp admin-get-user --region "$REGION" --user-pool-id "$POOL_ID" --username "$EMAIL" >/dev/null 2>&1; then
  echo "User exists — resending the invitation with a fresh temporary password."
  aws cognito-idp admin-create-user --region "$REGION" --user-pool-id "$POOL_ID" \
    --username "$EMAIL" --message-action RESEND >/dev/null
else
  aws cognito-idp admin-create-user --region "$REGION" --user-pool-id "$POOL_ID" \
    --username "$EMAIL" \
    --user-attributes Name=email,Value="$EMAIL" Name=email_verified,Value=true \
    --desired-delivery-mediums EMAIL >/dev/null
  echo "Created $EMAIL in pool $POOL_ID."
fi
echo "They'll get an email with a temporary password. Send them to /admin on the $STAGE site."
