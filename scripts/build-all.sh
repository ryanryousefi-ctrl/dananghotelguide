#!/bin/sh
# Full regeneration in dependency order (all steps idempotent). Usage: NODE_PATH=~/dananghotelguide/node_modules sh scripts/build-all.sh
set -e
node scripts/revenue3/build-facts.js
node scripts/revenue/build-finder.js
node scripts/revenue3/build-compare.js
node scripts/revenue3/new-guides.js
node scripts/revenue4/new-pages.js
node scripts/revenue3/apply-rollout.js
node scripts/revenue3/apply-links.js
node scripts/revenue3/normalize-labels.js
node scripts/revenue4/apply-clusters.js
node scripts/revenue4/withdraw-unverified.js
node scripts/revenue4/nav-tools.js
node scripts/perf-fixes.js
node scripts/normalize-ws.js
node scripts/reset/apply-reset.js
node scripts/reset/apply-category.js
node scripts/reset/nav.js
