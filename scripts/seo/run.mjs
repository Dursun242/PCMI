/**
 * Cycle complet hebdomadaire : analyse → article → balises.
 * Usage : npm run seo           (cycle complet)
 *         npm run seo:analyze   (rapport seulement)
 */
import { execSync } from "node:child_process";
const run = (cmd) => {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};
run("node scripts/seo/analyze.mjs");
run("node scripts/seo/generate.mjs");
run("node scripts/seo/optimize.mjs");
