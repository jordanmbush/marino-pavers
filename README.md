# Marino Pavers

The marketing site for [marinopavers.com](https://marinopavers.com): a static
Astro build on S3 + CloudFront, with a hidden admin page where the client
manages project photos. Conventions and architecture live in
[CLAUDE.md](./CLAUDE.md).

## Requirements

- Node 24 (`.nvmrc`), npm
- AWS CLI with the `marino-pavers` SSO profile (`aws sso login --profile marino-pavers`)
- `cloudflared` for the dev tunnel (`brew install cloudflared`)

## Develop

```bash
npm install
npm run dev              # http://localhost:4321 — gallery empty until pointed at a stage
npm run tunnel -- --dev  # also expose it at https://dev.marinopavers.com
```

To see real photos locally, deploy the dev stage once and copy its outputs
into `apps/web/.env` (see `apps/web/.env.example`).

## Verify

```bash
npm run type-check && npm run lint && npm run test && npm run build
```

## Deploy

```bash
npm run deploy:dev                      # CloudFront URL, no domain
bash scripts/create-admin.sh you@example.com dev   # invite the photo admin
```

Production deploys from `main` through GitHub Actions. One-time setup:
`bash scripts/setup-github-oidc.sh`, then add the `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ZONE_ID` secrets and the `CLOUDFLARE_ACCOUNT_ID` variable to the
repo. A manual production deploy works too, with the same three exported.

## Layout

```
apps/web/            Astro site (pages, layouts, components, content, services)
packages/domain/     photo-library model shared by the site and the Lambdas
packages/functions/  process-image + admin-api Lambdas
sst.config.ts        infrastructure
scripts/             tunnel, admin invite, OIDC setup
```
