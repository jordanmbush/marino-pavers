#!/usr/bin/env bash
# What a correct build looks like on disk. CI runs this right after
# `npm run build`; run it locally the same way (`npm run verify:build`).
# Each check is something a deploy would otherwise ship silently: an SSR
# adapter, a page missing in one language, a wrong canonical, admin in the
# sitemap, a copy dictionary in the browser bundle.
set -euo pipefail

dist="apps/web/dist"
site="https://marinopavers.com"

fail() {
  echo "::error::$1"
  exit 1
}

[ -d "$dist" ] || fail "no $dist — run npm run build first"

# ── Static output ────────────────────────────────────────────────────────────
[ -f "$dist/index.html" ] || fail "no index.html — did the build change output mode?"
[ -f "$dist/404.html" ] || fail "no 404.html"
[ -f "$dist/sitemap-index.xml" ] || fail "no sitemap"
if ls "$dist/_worker.js" "$dist/entry.mjs" >/dev/null 2>&1; then
  fail "an SSR adapter crept in"
fi

# ── Every public page, in every language ─────────────────────────────────────
for page in "" services gallery; do
  dir="${page:+$page/}"
  [ -f "$dist/${dir}index.html" ] || fail "missing English page /$page"
  [ -f "$dist/es/${dir}index.html" ] || fail "missing Spanish page /es/$page"
done
[ ! -e "$dist/es/admin" ] || fail "/es/admin was built; the admin page is English only"

# ── The language contract in the head ────────────────────────────────────────
en="$dist/services/index.html"
es="$dist/es/services/index.html"
grep -q '<html lang="en"' "$en" || fail "/services is not lang=en"
grep -q '<html lang="es"' "$es" || fail "/es/services is not lang=es"
grep -q "rel=\"canonical\" href=\"$site/services/\"" "$en" || fail "English canonical is wrong"
grep -q "rel=\"canonical\" href=\"$site/es/services/\"" "$es" || fail "Spanish canonical is wrong"
for file in "$en" "$es"; do
  grep -q "hreflang=\"en\" href=\"$site/services/\"" "$file" || fail "$file lacks the English hreflang"
  grep -q "hreflang=\"es\" href=\"$site/es/services/\"" "$file" || fail "$file lacks the Spanish hreflang"
  grep -q "hreflang=\"x-default\" href=\"$site/services/\"" "$file" || fail "$file lacks x-default"
done
grep -q 'property="og:locale" content="es_US"' "$es" || fail "Spanish og:locale is wrong"
grep -q 'name="robots" content="noindex' "$dist/admin/index.html" || fail "/admin is indexable"
grep -q 'name="robots" content="noindex' "$dist/404.html" || fail "404 is indexable"

# ── Sitemap ──────────────────────────────────────────────────────────────────
sitemap="$dist/sitemap-0.xml"
grep -q "$site/es/services/" "$sitemap" || fail "Spanish pages missing from the sitemap"
grep -q 'hreflang="es"' "$sitemap" || fail "sitemap lacks hreflang alternates"
if grep -q "/admin" "$sitemap"; then fail "/admin leaked into the sitemap"; fi
if grep -q "/404" "$sitemap"; then fail "/404 leaked into the sitemap"; fi
grep -q "Sitemap: $site/sitemap-index.xml" "$dist/robots.txt" || fail "robots.txt lacks the sitemap"

# ── Nothing in the browser bundle that belongs on the server ─────────────────
# The skip link is in every dictionary and nowhere else; if it is in a script,
# an island imported the dictionaries instead of taking its slice as a prop.
if grep -rl "Saltar al contenido" "$dist/_astro" --include='*.js' >/dev/null 2>&1; then
  fail "a copy dictionary shipped to the browser"
fi

echo "build verified: static, both languages, indexed correctly"
