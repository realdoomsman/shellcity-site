// Launch day (shell-city LAUNCH.md "Launch day"): node go-live.mjs
// Run it once $SHELL's in-game launch has landed. Merges branch `raydium-live` (the launch wording, with a
// __DATE__ placeholder) into main, fills in today's date, refuses if any placeholder survives, then commits
// and pushes main. No page names the contract address. GitHub Pages serves main's docs/ at shellcity.fun.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

if (process.argv.length > 2) {
  console.error("usage: node go-live.mjs   (takes no arguments: the site never shows the contract address)");
  process.exit(1);
}
const git = (...args) => execFileSync("git", args, { stdio: "inherit" });
const who = ["-c", "user.name=Shell City (local)", "-c", "user.email=local@shell.invalid"];
const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

git("switch", "-q", "main");
git("pull", "-q", "--ff-only");
git(...who, "merge", "-q", "--no-edit", "raydium-live");
const docs = "docs";
let filled = 0;
for (const name of readdirSync(docs).filter((n) => n.endsWith(".html"))) {
  const path = join(docs, name);
  const before = readFileSync(path, "utf8");
  const after = before.replaceAll("__DATE__", date);
  if (after !== before) { writeFileSync(path, after); filled++; }
  if (/__[A-Z]+__/.test(after)) throw new Error(`${path} still has a placeholder`);
}
if (filled === 0) throw new Error("no page had a placeholder: was `raydium-live` already merged?");
git("add", "docs");
git(...who, "commit", "-q", "-m", `Live: $SHELL launched in game on pump.fun, ${date}`);
git("push", "-q", "origin", "main");
console.log(`shellcity.fun: ${filled} pages now say $SHELL launched on ${date}; Pages redeploys in about a minute.`);
