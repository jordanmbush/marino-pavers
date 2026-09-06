#!/usr/bin/env bash
#
# Expose the local Astro dev server to the client at https://dev.marinopavers.com
# through a named Cloudflare tunnel.
#
# Usage:
#   npm run tunnel            # tunnel only (run `npm run dev` separately)
#   npm run tunnel -- --dev   # also start the dev server, and stop it on exit
#
# One-time setup:
#   cloudflared tunnel create marino-dev
#   point dev.marinopavers.com at it: CNAME → <tunnel id>.cfargotunnel.com,
#     proxied. (`cloudflared tunnel route dns` only works when
#     ~/.cloudflared/cert.pem was issued for the marinopavers.com account; if
#     the cert belongs to another account, add the record via the dashboard
#     or API instead — routing with the wrong cert writes a junk record into
#     the other zone.)
#   write ~/.cloudflared/marino-dev.yml from the template printed below.
#
# The dev server listens on PORT — apps/web/astro.config.ts pins it, strict —
# and the tunnel's ingress must point at the same port. Not Astro's default
# 4321: other projects on this machine use it, and the tunnel must never
# route the client to one of those by mistake.
set -euo pipefail

TUNNEL="marino-dev"
HOST="dev.marinopavers.com"
PORT="4330"
CONFIG="${HOME}/.cloudflared/${TUNNEL}.yml"
WEB_DIR="$(cd "$(dirname "$0")/../apps/web" && pwd)"
START_DEV=false

for arg in "$@"; do
  case "$arg" in
    --dev) START_DEV=true ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "✗ cloudflared not found. Install it: brew install cloudflared" >&2
  exit 1
fi

# Look the tunnel up by name. Parsed from JSON rather than grepped from the
# table so a transient API failure is reported as one, not as "not found".
if ! TUNNELS="$(cloudflared tunnel list --output json 2>/dev/null)"; then
  echo "✗ 'cloudflared tunnel list' failed — not logged in? Run: cloudflared tunnel login" >&2
  exit 1
fi
ID="$(printf '%s' "$TUNNELS" | python3 -c "import json,sys; print(next((t['id'] for t in json.load(sys.stdin) if t['name']=='$TUNNEL'), ''))")"
if [ -z "$ID" ]; then
  echo "✗ Tunnel '$TUNNEL' not found. Create it:" >&2
  echo "    cloudflared tunnel create $TUNNEL" >&2
  echo "  then point $HOST at <tunnel id>.cfargotunnel.com (proxied CNAME)." >&2
  exit 1
fi

if [ ! -f "$CONFIG" ]; then
  echo "✗ Missing $CONFIG. Write it as:" >&2
  cat >&2 <<YAML
tunnel: ${ID}
credentials-file: ${HOME}/.cloudflared/${ID}.json
ingress:
  - hostname: ${HOST}
    service: http://localhost:${PORT}
  - service: http_status:404
YAML
  exit 1
fi

if ! grep -q "localhost:${PORT}\b" "$CONFIG"; then
  echo "✗ $CONFIG does not route to http://localhost:${PORT}, where the dev server listens." >&2
  exit 1
fi

# Refuse to start a second connector for the same named tunnel. Cloudflare
# load-balances across ALL connectors registered to a tunnel, so a duplicate
# sends a share of traffic to whichever one is dying — multi-second hangs
# until the stale registration ages out.
RUNNING_PID="$(pgrep -f "cloudflared.*tunnel run $TUNNEL" | head -1 || true)"
if [ -n "$RUNNING_PID" ]; then
  echo "✗ A '$TUNNEL' connector is already running (PID $RUNNING_PID)." >&2
  echo "  Reuse it, or stop it first: pkill -f 'cloudflared.*tunnel run $TUNNEL'" >&2
  exit 1
fi

if [ "$START_DEV" = true ]; then
  # Astro 7 can run its dev server detached; start it that way so this script
  # owns exactly one foreground process (the tunnel) and can stop the server
  # by name on exit — no PID bookkeeping, and Ctrl-C leaves nothing behind.
  echo "▶ Starting dev server (astro dev on :$PORT)…"
  (cd "$WEB_DIR" && npx astro dev --background)
  trap 'echo; echo "■ Stopping dev server…"; (cd "$WEB_DIR" && npx astro dev stop) || true' EXIT
elif ! lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "! Nothing is listening on :$PORT yet — run 'npm run dev', or rerun with --dev." >&2
fi

echo "▶ Starting Cloudflare tunnel → https://$HOST"
# Not exec'd: the EXIT trap above must still run when the tunnel stops.
cloudflared --config "$CONFIG" tunnel run "$TUNNEL"
