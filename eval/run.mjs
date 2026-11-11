// Eval harness: `node eval/run.mjs [--split dev|test|all]`
// Writes results/<run-id>/per_item.csv and summary.json, prints a confusion matrix and the launch-bar check.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const { analyze, VERSION } = createRequire(import.meta.url)("../src/rules.js");
const bar = JSON.parse(readFileSync(join(here, "launch_bar.json"), "utf8"));

const arg = process.argv.indexOf("--split");
const split = arg > -1 ? process.argv[arg + 1] : "test";

// Fixed split by hashed id, so an item never moves between dev and test.
const splitOf = (id) => (createHash("sha1").update(id).digest()[0] % 2 === 0 ? "dev" : "test");

const items = readFileSync(join(here, "messages.jsonl"), "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l))
  .map((m) => ({ ...m, split: splitOf(m.id) }))
  .filter((m) => split === "all" || m.split === split);

const rows = items.map((m) => {
  const r = analyze(m.text);
  const warned = r.verdict === "likely_scam" || r.verdict === "suspicious";
  return { ...m, verdict: r.verdict, warned, rules: r.signals.map((s) => s.id).join("|"), ms: r.ms };
});

const scams = rows.filter((r) => r.label === "scam");
const genuine = rows.filter((r) => r.label === "genuine");
const bankish = genuine.filter((r) => /otp|alert|bank|kyc/.test(r.type));
const pct = (n, d) => (d ? Math.round((1000 * n) / d) / 10 : 0);

const missed = scams.filter((r) => !r.warned);
const falseAlarms = genuine.filter((r) => r.warned);
const summary = {
  run: new Date().toISOString(),
  rules_version: VERSION,
  split,
  n: rows.length,
  scams: scams.length,
  genuine: genuine.length,
  missed_scam_rate: pct(missed.length, scams.length),
  missed_scams_with_unsure: pct(missed.filter((r) => r.verdict === "unsure").length, scams.length),
  false_alarm_rate: pct(falseAlarms.length, genuine.length),
  false_alarm_rate_bank_otp: pct(bankish.filter((r) => r.warned).length, bankish.length),
  unsure_rate: pct(rows.filter((r) => r.verdict === "unsure").length, rows.length),
  by_lang: Object.fromEntries(
    [...new Set(rows.map((r) => r.lang))].map((l) => {
      const s = scams.filter((r) => r.lang === l), g = genuine.filter((r) => r.lang === l);
      return [l, { missed_scam_rate: pct(s.filter((r) => !r.warned).length, s.length), false_alarm_rate: pct(g.filter((r) => r.warned).length, g.length), n: s.length + g.length }];
    })
  ),
  median_ms: rows.map((r) => r.ms).sort((a, b) => a - b)[Math.floor(rows.length / 2)] ?? 0,
};
summary.launch_bar = {
  missed_scam_rate: { max: bar.max_missed_scam_rate, pass: summary.missed_scam_rate <= bar.max_missed_scam_rate },
  false_alarm_rate: { max: bar.max_false_alarm_rate, pass: summary.false_alarm_rate <= bar.max_false_alarm_rate },
};
summary.launch_bar.pass = Object.values(summary.launch_bar).every((v) => v.pass);

const runId = summary.run.replace(/[:.]/g, "-") + "-" + split;
const out = join(here, "..", "results", runId);
mkdirSync(out, { recursive: true });
const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
const cols = ["id", "split", "label", "type", "lang", "verdict", "warned", "rules", "source", "text"];
writeFileSync(join(out, "per_item.csv"), [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n"));
writeFileSync(join(out, "summary.json"), JSON.stringify(summary, null, 2));

const tp = scams.length - missed.length, fn = missed.length, fp = falseAlarms.length, tn = genuine.length - fp;
console.log(`\nScam Check eval · ${VERSION} · split=${split} · n=${rows.length}\n`);
console.log("                 warned   no warning");
console.log(`  scam           ${String(tp).padStart(6)}   ${String(fn).padStart(10)}`);
console.log(`  genuine        ${String(fp).padStart(6)}   ${String(tn).padStart(10)}\n`);
console.log(`  missed-scam rate   ${summary.missed_scam_rate}%  (bar ≤ ${bar.max_missed_scam_rate}%)  ${summary.launch_bar.missed_scam_rate.pass ? "PASS" : "FAIL"}`);
console.log(`  false-alarm rate   ${summary.false_alarm_rate}%  (bar ≤ ${bar.max_false_alarm_rate}%)  ${summary.launch_bar.false_alarm_rate.pass ? "PASS" : "FAIL"}`);
console.log(`  bank/OTP false-alarm rate ${summary.false_alarm_rate_bank_otp}%   unsure rate ${summary.unsure_rate}%`);
console.log(`  by language: ${JSON.stringify(summary.by_lang)}`);
if (split !== "test") {
  for (const r of missed) console.log(`  MISSED  ${r.id} [${r.verdict}] ${r.text.slice(0, 90)}`);
  for (const r of falseAlarms) console.log(`  FALSE+  ${r.id} [${r.rules}] ${r.text.slice(0, 90)}`);
}
console.log(`\n  Results: results/${runId}/`);
console.log(`  Launch bar: ${summary.launch_bar.pass ? "MET" : "NOT MET"}\n`);
