#!/usr/bin/env bash
# GitHub→AWS OIDC deploy credentials.
#
# Lets GitHub Actions assume an AWS role via OIDC — short-lived STS credentials
# per workflow run, no long-lived AWS keys in GitHub secrets. Idempotent.
#
# Provisions:
#   1. The GitHub OIDC identity provider (account-wide singleton).
#   2. The deploy role, trust-scoped to THIS repo's main ref. The repo is
#      PUBLIC, so this scoping is the whole security model: a fork or a PR
#      presents a different subject and is refused.
#   3. A deploy policy covering what sst.config.ts creates.
#   4. The `AWS_DEPLOY_ROLE_ARN` repo variable that deploy.yml reads.
#
# GitHub issues IMMUTABLE OIDC subjects (`repo:owner@<id>/name@<id>:ref:…`);
# both the immutable and the plain form are trusted so the role keeps working
# whichever one GitHub presents. `sub` is matched exactly, never by wildcard.
#
# Requires admin credentials for the Marino Pavers account.
# Usage: bash scripts/setup-github-oidc.sh
set -euo pipefail

export AWS_PROFILE="${AWS_PROFILE:-marino-pavers}"

REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
REPO_ID="$(gh api "repos/${REPO}" --jq .id)"
OWNER_ID="$(gh api "repos/${REPO}" --jq .owner.id)"
for pair in "REPO_ID=${REPO_ID}" "OWNER_ID=${OWNER_ID}"; do
  case "${pair#*=}" in
    "" | *[!0-9]*)
      echo "Refusing to write a trust policy: ${pair%%=*} is not numeric (\"${pair#*=}\")." >&2
      exit 1
      ;;
  esac
done
REPO_IMMUTABLE="${REPO%%/*}@${OWNER_ID}/${REPO##*/}@${REPO_ID}"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
ROLE_NAME="github-actions-marino-pavers-deploy"
POLICY_NAME="github-actions-marino-pavers-deploy"
PROVIDER_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

echo "Setting up GitHub→AWS OIDC for ${REPO} in account ${ACCOUNT_ID}…"

if gh secret list --json name --jq '.[].name' 2>/dev/null |
  grep -qE '^AWS_(ACCESS_KEY_ID|SECRET_ACCESS_KEY|SESSION_TOKEN)$'; then
  echo "✗ Long-lived AWS credentials found in GitHub secrets — delete them; OIDC replaces them." >&2
  exit 1
fi

# ── 1. GitHub OIDC identity provider ─────────────────────────────────────────
if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$PROVIDER_ARN" >/dev/null 2>&1; then
  echo "OIDC provider already exists."
else
  aws iam create-open-id-connect-provider \
    --url "https://token.actions.githubusercontent.com" \
    --client-id-list "sts.amazonaws.com" \
    --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" "1c58a3a8518e8759bf075b76b750d4f2df264fcd" >/dev/null
  echo "Created OIDC provider."
fi

# ── 2. Deploy role, trusted for main only ───────────────────────────────────
TRUST_POLICY="$(
  cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Federated": "${PROVIDER_ARN}" },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": [
            "repo:${REPO_IMMUTABLE}:ref:refs/heads/main",
            "repo:${REPO}:ref:refs/heads/main"
          ]
        }
      }
    }
  ]
}
JSON
)"

if aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  aws iam update-assume-role-policy --role-name "$ROLE_NAME" --policy-document "$TRUST_POLICY"
  echo "Updated role trust policy."
else
  aws iam create-role --role-name "$ROLE_NAME" \
    --description "GitHub Actions OIDC deploy role for ${REPO} (sst deploy; main only)" \
    --max-session-duration 3600 \
    --assume-role-policy-document "$TRUST_POLICY" >/dev/null
  echo "Created role: ${ROLE_ARN}"
fi

# ── 3. Deploy policy ─────────────────────────────────────────────────────────
# sst.config.ts creates: S3 (site + media), CloudFront + its KV store and
# functions (the Router), ACM, two Lambdas with roles and log groups, an S3
# notification, a Cognito user pool, and SSM parameters for SST state.
# ⚠️ A component that reaches a NEW service means adding it here and
# re-running: the local profile is Admin, so the gap only shows in CI.
DEPLOY_POLICY="$(
  cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DeployServices",
      "Effect": "Allow",
      "Action": [
        "acm:*",
        "cloudfront:*",
        "cloudfront-keyvaluestore:*",
        "cognito-idp:*",
        "lambda:*",
        "logs:*",
        "s3:*",
        "ssm:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SstRoleManagement",
      "Effect": "Allow",
      "Action": [
        "iam:AttachRolePolicy", "iam:CreateRole", "iam:DeleteRole", "iam:DeleteRolePolicy",
        "iam:DetachRolePolicy", "iam:GetRole", "iam:GetRolePolicy", "iam:ListAttachedRolePolicies",
        "iam:ListRolePolicies", "iam:ListRoleTags", "iam:PutRolePolicy", "iam:TagRole",
        "iam:UntagRole", "iam:UpdateAssumeRolePolicy", "iam:UpdateRole", "iam:UpdateRoleDescription"
      ],
      "Resource": [
        "arn:aws:iam::${ACCOUNT_ID}:role/marino-pavers-*",
        "arn:aws:iam::${ACCOUNT_ID}:role/produ-*",
        "arn:aws:iam::${ACCOUNT_ID}:role/dev-*",
        "arn:aws:iam::${ACCOUNT_ID}:role/Router*",
        "arn:aws:iam::${ACCOUNT_ID}:role/Media*",
        "arn:aws:iam::${ACCOUNT_ID}:role/AdminApi*",
        "arn:aws:iam::${ACCOUNT_ID}:role/ProcessImage*",
        "arn:aws:iam::${ACCOUNT_ID}:role/Site*"
      ]
    },
    {
      "Sid": "SstPassRole",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::${ACCOUNT_ID}:role/*",
      "Condition": {
        "StringEquals": { "iam:PassedToService": ["lambda.amazonaws.com", "edgelambda.amazonaws.com"] }
      }
    },
    {
      "Sid": "ServiceLinkedRoles",
      "Effect": "Allow",
      "Action": ["iam:CreateServiceLinkedRole", "iam:GetRole"],
      "Resource": "arn:aws:iam::*:role/aws-service-role/*"
    }
  ]
}
JSON
)"

if aws iam get-policy --policy-arn "$POLICY_ARN" >/dev/null 2>&1; then
  while [ "$(aws iam list-policy-versions --policy-arn "$POLICY_ARN" --query 'length(Versions)' --output text)" -ge 5 ]; do
    OLDEST="$(aws iam list-policy-versions --policy-arn "$POLICY_ARN" \
      --query 'sort_by(Versions[?!IsDefaultVersion], &CreateDate)[0].VersionId' --output text)"
    aws iam delete-policy-version --policy-arn "$POLICY_ARN" --version-id "$OLDEST"
  done
  aws iam create-policy-version --policy-arn "$POLICY_ARN" --policy-document "$DEPLOY_POLICY" --set-as-default >/dev/null
  echo "Published new default version of the deploy policy."
else
  aws iam create-policy --policy-name "$POLICY_NAME" \
    --description "sst deploy permissions for the GitHub Actions OIDC role" \
    --policy-document "$DEPLOY_POLICY" >/dev/null
  echo "Created policy."
fi

aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "$POLICY_ARN"

# ── 4. Publish the role ARN for deploy.yml ───────────────────────────────────
gh variable set AWS_DEPLOY_ROLE_ARN --body "$ROLE_ARN"
echo "Done. GitHub Actions can assume: ${ROLE_ARN}"
