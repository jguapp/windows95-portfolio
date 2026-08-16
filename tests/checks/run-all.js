/**
 * Runs every behaviour check against a server at localhost:3000.
 *
 * Each check is a standalone Playwright script printing PASS/FAIL lines;
 * this runner executes them in sequence and exits nonzero if any line
 * fails, which is what CI keys off.
 */
const { execFileSync } = require("child_process")
const { readdirSync } = require("fs")
const { join } = require("path")

const here = __dirname
const checks = readdirSync(here).filter((f) => f.endsWith(".js") && f !== "run-all.js")

let failed = 0
for (const file of checks) {
  console.log(`\n=== ${file} ===`)
  try {
    const out = execFileSync(process.execPath, [join(here, file)], { encoding: "utf-8", timeout: 600000 })
    process.stdout.write(out)
    if (out.includes("FAIL") || out.includes("SCRIPT ERROR")) failed++
  } catch (err) {
    process.stdout.write(String(err.stdout ?? err.message))
    failed++
  }
}

console.log(`\n${checks.length - failed}/${checks.length} check files clean`)
process.exit(failed === 0 ? 0 : 1)
