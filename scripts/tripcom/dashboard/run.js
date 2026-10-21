#!/usr/bin/env node
// node scripts/tripcom/dashboard/run.js [--limit N]   queues a generation run in the attached driver session.
const fs = require('fs'), path = require('path');
const n = process.argv.includes('--limit') ? +process.argv[process.argv.indexOf('--limit') + 1] : 1000;
const f = `/tmp/tc-driver/cmd-gen-${Date.now()}.js`;
fs.writeFileSync(f, `module.exports = (ctx) => require(${JSON.stringify(path.join(__dirname, 'generate.js'))})({ ...ctx, limit: ${n} });\n`);
console.log('queued', f);
