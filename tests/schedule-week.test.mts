/**
 * The Monday publish run, end to end against a fake platform.
 * Run with: npx tsx tests/schedule-week.test.mts
 *
 * The fake implements the platform's unique index on
 * (week, episode, platform): a slot already booked comes back `skipped`, never
 * twice. It can fail chosen slots once, to prove a re-run after a partial
 * books only what is missing. A fake Discord webhook records every line, to
 * prove no ending is silent.
 *
 * Uses the real week 2026-10-05 from state.json (4 rendered words). readState
 * reconciles renders against the media host, so this needs network.
 */
import http from "node:http";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AddressInfo } from "node:net";
import { previewProblems } from "../src/lib/publish-checks";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const WEEK = "2026-10-05";
const ON_MONDAY = "2026-10-05T12:30:00Z";
const ACCOUNTS: Record<string, string> = {
  youtube: "Andrew Froehlich (Wordlore)",
  tiktok: "wordlorehq",
  instagram: "wordlorehq",
  threads: "wordlorehq",
  facebook: "Drew Froehlich",
};

let pass = 0, fail = 0;
function check(name: string, ok: boolean, detail = "") {
  if (ok) pass++;
  else { fail++; console.log(`FAIL ${name}${detail ? " - " + detail : ""}`); }
}

/* ---------------- fake platform + webhook ---------------- */
const store = new Set<string>();          // the unique index
let inserts = 0;                           // rows actually written
let failOnce = new Set<string>();          // slots that fail on their first commit
let postingAs: Record<string, { name: string }> = {};
const posted: string[] = [];               // webhook lines

const server = http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    const body = raw ? JSON.parse(raw) : {};
    if (req.url === "/webhook") {
      posted.push(body.content);
      res.writeHead(204).end();
      return;
    }
    if (req.url === "/api/channel/schedule-week" && req.method === "POST") {
      const results: any[] = [];
      for (const ep of body.episodes ?? []) {
        for (const platform of body.platforms ?? []) {
          const key = `${body.week}|${ep.episode}|${platform}`;
          if (store.has(key)) { results.push({ episode: ep.episode, platform, status: "skipped", cover: "thumbnail" }); continue; }
          if (body.dryRun) { results.push({ episode: ep.episode, platform, status: "dry-run", cover: "thumbnail" }); continue; }
          if (failOnce.has(key)) { failOnce.delete(key); results.push({ episode: ep.episode, platform, status: "failed", error: "blotato 500" }); continue; }
          store.add(key); inserts++;
          results.push({ episode: ep.episode, platform, status: "scheduled", cover: "thumbnail" });
        }
      }
      res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ postingAs, results, counts: { n: results.length } }));
      return;
    }
    res.writeHead(404).end();
  });
});

function run(args: string[], env: Record<string, string | undefined>): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [path.join(ROOT, "node_modules/tsx/dist/cli.mjs"), "scripts/schedule-week.ts", ...args], {
      cwd: ROOT, env: { ...process.env, ...env },
    });
    let out = "";
    p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (out += d));
    p.on("close", (code) => resolve({ code: code ?? -1, out }));
  });
}

function reset(opts: { youtube?: string } = {}) {
  store.clear(); inserts = 0; failOnce = new Set(); posted.length = 0;
  postingAs = Object.fromEntries(Object.entries(ACCOUNTS).map(([p, n]) => [p, { name: n }]));
  if (opts.youtube) postingAs.youtube = { name: opts.youtube };
}

await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
const ENV = { AETHERWAVE_API_BASE: base, AETHERWAVE_API_KEY: "test-key", DISCORD_WEBHOOK_URL: `${base}/webhook`, WORDLORE_NOW: ON_MONDAY };

try {
  // 1. Monday, no flags: checks pass, books by default, says so.
  reset();
  let r = await run([], ENV);
  check("1 default run exits 0", r.code === 0, r.out.slice(-400));
  check("1 books all 20", inserts === 20 && store.size === 20, `inserts ${inserts}`);
  check("1 posts the booked line", posted.length === 1 && posted[0] === `Wordlore week ${WEEK} booked 20/20.`, JSON.stringify(posted));

  // 2. Re-run: nothing new, no duplicates, still reported.
  posted.length = 0;
  r = await run([], ENV);
  check("2 re-run exits 0", r.code === 0, r.out.slice(-300));
  check("2 re-run books nothing (unique index)", inserts === 20 && store.size === 20, `inserts ${inserts}`);
  check("2 re-run reports already booked", posted[0] === `Wordlore week ${WEEK} already booked 20/20 - nothing to do.`, JSON.stringify(posted));

  // 3. Partial: 3 slots fail; the re-run books ONLY those 3.
  reset();
  failOnce = new Set([`${WEEK}|bonfire|tiktok`, `${WEEK}|alcohol|instagram`, `${WEEK}|vaccine|threads`]);
  r = await run([], ENV);
  check("3 partial exits non-zero", r.code === 1, r.out.slice(-300));
  check("3 partial wrote 17", inserts === 17, `inserts ${inserts}`);
  check("3 partial reports 17/20 + the failures", /booked 17\/20; 3 FAILED \(.*bonfire\/tiktok.*\)/.test(posted[0] ?? ""), JSON.stringify(posted));
  posted.length = 0;
  r = await run([], ENV);
  check("3 retry exits 0", r.code === 0, r.out.slice(-300));
  check("3 retry books only the 3 missing", inserts === 20 && store.size === 20, `inserts ${inserts}`);
  check("3 retry reports 20/20", posted[0] === `Wordlore week ${WEEK} booked 20/20.`, JSON.stringify(posted));

  // 4. YouTube resolves to AetherWave: refuse, book nothing, say why.
  reset({ youtube: "Andrew Froehlich (AetherWave Studio)" });
  r = await run([], ENV);
  check("4 wrong account exits non-zero", r.code === 1);
  check("4 wrong account books nothing", inserts === 0);
  check("4 wrong account reason posted", /NOT booked: .*youtube: posting as "Andrew Froehlich \(AetherWave Studio\)"/.test(posted[0] ?? ""), JSON.stringify(posted));

  // 5. Explicit other week without --any-week: refuse.
  reset();
  r = await run(["--week", WEEK], { ...ENV, WORDLORE_NOW: "2026-10-12T12:30:00Z" });
  check("5 other week refused", r.code === 1 && inserts === 0 && /not the current week \(2026-10-12\)/.test(posted[0] ?? ""), JSON.stringify(posted));
  // ...and allowed on purpose with --any-week.
  reset();
  r = await run(["--week", WEEK, "--any-week"], { ...ENV, WORDLORE_NOW: "2026-10-12T12:30:00Z" });
  check("5 --any-week books", r.code === 0 && inserts === 20, r.out.slice(-300));

  // 6. No API key: refused, and the refusal is posted (not silent).
  reset();
  r = await run([], { ...ENV, AETHERWAVE_API_KEY: "" });
  check("6 no key refused + posted", r.code === 1 && inserts === 0 && /NOT booked: AETHERWAVE_API_KEY is not set/.test(posted[0] ?? ""), JSON.stringify(posted));

  // 7. Dry run: checks run, nothing booked, nothing posted.
  reset();
  r = await run(["--dry-run"], ENV);
  check("7 dry run exits 0, books nothing, posts nothing", r.code === 0 && inserts === 0 && posted.length === 0, r.out.slice(-300));
  check("7 dry run printed the checks", /All checks passed\./.test(r.out));

  // 8. --commit still accepted (old invocations).
  reset();
  r = await run(["--commit"], ENV);
  check("8 legacy --commit books", r.code === 0 && inserts === 20);

  // 9. Pure checks: slot count + episodes.
  const ctx = { week: WEEK, currentWeek: WEEK, allowOtherWeek: false, expectedAccounts: ACCOUNTS, words: ["a", "b", "c", "d"], platforms: Object.keys(ACCOUNTS), episodesPerWeek: 4, catchUp: false };
  const pa = Object.fromEntries(Object.entries(ACCOUNTS).map(([p, n]) => [p, { name: n }]));
  check("9 19 slots refused", previewProblems({ postingAs: pa, results: Array(19).fill({ episode: "a", platform: "youtube", status: "dry-run" }) }, ctx).some((p) => /19 slot\(s\), expected 20/.test(p)));
  check("9 3 episodes refused", previewProblems({ postingAs: pa, results: Array(15).fill({ episode: "a", platform: "youtube", status: "dry-run" }) }, { ...ctx, words: ["a", "b", "c"] }).some((p) => /3 episode\(s\), expected 4/.test(p)));
  check("9 clean preview passes", previewProblems({ postingAs: pa, results: Array(20).fill({ episode: "a", platform: "youtube", status: "dry-run" }) }, ctx).length === 0);
} finally {
  server.close();
}

console.log(`schedule-week: ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
