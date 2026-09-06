#!/usr/bin/env bash
#
# Expose the local Astro dev server to the client at https://dev.marinopavers.com
# through a named Cloudflare tunnel.
#
# Usage:
#   npm run tunnel            # tunnel only (run `npm run dev` separately)
#   npm run tunnel -- --dev   # also start `astro dev` and stop it on exit
#
# One-time setup (needs `cloudflared tunnel login` against the account that
# owns marinopavers.com):
#   cloudflared tunnel create marino-dev
#   cloudflared tunnel route dns marino-dev dev.marinopavers.com
# then write ~/.cloudflared/marino-dev.yml from the template printed below.
set -euo pipefail

TUNNEL="marino-dev"
HOST="dev.marinopavers.com"
PORT="4321"
CONFIG="${HOME}/.cloudflared/${TUNNEL}.yml"
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

if ! cloudflared tunnel list 2>/dev/null | grep -q "$TUNNEL"; then
  echo "✗ Tunnel '$TUNNEL' not found. Create it:" >&2
  echo "    cloudflared tunnel create $TUNNEL" >&2
  echo "    cloudflared tunnel route dns $TUNNEL $HOST" >&2
  exit 1
fi

if [ ! -f "$CONFIG" ]; then
  ID="$(cloudflared tunnel list --output json 2>/dev/null | python3 -c "import json,sys; print(next(t['id'] for t in json.load(sys.stdin) if t['name']=='$TUNNEL'))" 2>/dev/null || true)"
  echo "✗ Missing $CONFIG. Write it as:" >&2
  cat >&2 <<YAML
tunnel: ${ID:-<tunnel id>}
credentials-file: ${HOME}/.cloudflared/${ID:-<tunnel id>}.json
ingress:
  - hostname: ${HOST}
    service: http://localhost:${PORT}
  - service: http_status:404
YAML
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
  echo "▶ Starting dev server (astro dev on :$PORT)…"
  npm run dev &
  DEV_PID=$!
  trap 'echo; echo "■ Stopping dev server…"; kill "$DEV_PID" 2>/dev/null || true' EXIT
fi

echo "▶ Starting Cloudflare tunnel → https://$HOST"
exec cloudflared --config "$CONFIG" tunnel run "$TUNNEL"
