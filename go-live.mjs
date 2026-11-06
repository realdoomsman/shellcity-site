// Launch day (shell-city LAUNCH.md "Launch day" step 6): node go-live.mjs <CA>
// Merges branch `live` (the launch wording, with __CA__ and __DATE__ placeholders) into main, fills in the
// contract address and today's date, refuses if any placeholder survives, then commits and pushes main.
// GitHub Pages serves main's docs/ at shellcity.fun.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ca = process.argv[2] ?? "";
if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(ca)) {
  console.error("usage: node go-live.mjs <CA>   (a base58 Solana address)");
  process.exit(1);
}
const git = (...args) => execFileSync("git", args, { stdio: "inherit" });
const who = ["-c", "user.name=Shell City (local)", "-c", "user.email=local@shell.invalid"];
const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

git("switch", "-q", "main");
git("pull", "-q", "--ff-only");
git(...who, "merge", "-q", "--no-edit", "live");
const docs = "docs";
let filled = 0;
for (const name of readdirSync(docs).filter((n) => n.endsWith(".html"))) {
  const path = join(docs, name);
  const before = readFileSync(path, "utf8");
  const after = before.replaceAll("__CA__", ca).replaceAll("__DATE__", date);
  if (after !== before) { writeFileSync(path, after); filled++; }
  if (/__CA__|__DATE__/.test(after)) throw new Error(`${path} still has a placeholder`);
}
if (filled === 0) throw new Error("no page had a placeholder: was `live` already merged?");
git("add", "docs");
git(...who, "commit", "-q", "-m", `Live: $SHELL ${ca} on pump.fun`);
git("push", "-q", "origin", "main");
console.log(`shellcity.fun: ${filled} pages now show ${ca} (${date}); Pages redeploys in about a minute.`);
