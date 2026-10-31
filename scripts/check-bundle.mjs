// First-load JavaScript budget (WEB-06): gzipped size of every JS and CSS file in dist/assets.
// Raise BUDGET_KB only on purpose, and say why in the PR.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const BUDGET_KB = 90;
const dir = "dist/assets";
let total = 0;
for (const f of readdirSync(dir).filter((n) => /\.(js|css)$/.test(n))) {
  const kb = gzipSync(readFileSync(join(dir, f))).length / 1024;
  total += kb;
  console.log(`${f}: ${kb.toFixed(1)} KB gzipped`);
}
console.log(`First load: ${total.toFixed(1)} KB gzipped (budget ${BUDGET_KB} KB)`);
if (total > BUDGET_KB) {
  console.error(`FAIL: first-load bundle is over budget by ${(total - BUDGET_KB).toFixed(1)} KB`);
  process.exit(1);
}
