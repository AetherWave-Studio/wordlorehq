# Weekly routine prompt

The canonical prompt for the "Wordlore reels generation" routine (Saturdays,
14:00 UTC). Keep this file and the routine in sync: the routine's prompt should
be a pointer at this file, so the instructions can be fixed in a PR rather than
in a text box.

Suggested routine prompt, in full:

> Read `.wordlore-context/routine-prompt.md` in this repo and follow it exactly.

---

## What went wrong before, so it does not happen again

Three failures produced nine weeks of silence between 2026-07-06 and
2026-09-05. Every step below that looks pedantic is one of them.

1. **The work landed on a branch nobody merged.** Runs push to the routine's
   outcome branch, not `master`, so every run starts from a `master` that never
   received the last run's output - including the refilled word pool. The pool
   read empty, the stop condition fired, and the run reported success in 82
   seconds. This is now closed from the repo side: pushing a
   `claude/intelligent-franklin*` branch triggers
   `.github/workflows/adopt-routine-output.yml`, which typechecks, lints,
   builds and then merges it into `master`. Step 8 still tries `master`
   directly, and the workflow is the backstop when it cannot.
2. **The pool ran dry and the routine treated that as an exit.** Refilling is
   now step 2, before selection.
3. **Weeks were marked rendered with no MP4 in the commit.** Twelve episodes
   were recorded `done` and do not exist. Step 6 now verifies the file before
   the flag.

## Steps

**1. Compute the target week.** The Monday of the next upcoming week
(`YYYY-MM-DD`). If `state.json.currentWeek` is already at or past that label,
stop and post to Discord: `Wordlore routine: week <label> already on disk,
skipping.`

**2. Check the queue, and refill it rather than stopping.** If
`word-pipeline.json.available` holds fewer than 8 entries, add new candidates
to `.wordlore-context/word-candidates.md` and to `available` until it holds at
least 12. Vet each against the four selection criteria in that file, and check
every one against `used[]` before adding it. Post to Discord that you refilled
and with which words. Only stop if you cannot produce 4 usable words.

**2b. Clear the backlog before adding to it.** Read `state.json` for any word
whose render status is `missing` - recorded `done` with no MP4 in
`public/episodes/`. Those episodes are already written; only the render is
absent. Re-render up to 4 of them (step 6's procedure) and commit them before
drafting anything new. They are paid-for work: do not re-draft them, do not
retire the words, and do not move them back to `available`.

If more than 4 are missing, take the oldest week first and leave the rest for
next week's run. If clearing the backlog fills the week, skip steps 3-5 and go
straight to committing - a week of recovered episodes is a good week.

**3. Select 4 words** from `available`:

- No two from the same language family (vary Latin / Greek / Old English /
  Norse / French / Italian / Arabic / Sanskrit / Nahuatl / others).
- At least one Tier 1 word.
- None appearing in `used[]`.

**4. Write the episodes** to
`src/lib/wordlore-content/drafts/<week>/<word>.json`, matching the schema in
`drafts/2026-06-08/sinister.json` exactly - no added fields, no omitted fields.
Every entry in `available` is an object (`{word, tier, language, payoff}`), not
a bare string; keep that shape when you move words to `used[]`.

**ZERO em dashes or en dashes in any string field.** Use hyphens.

**5. Update the registries.** Move the 4 words from `available` to `used[]` in
`word-pipeline.json`. Add the week to `state.json` with `status: "ready"`,
`renders: {}`, and set `currentWeek` to the new label.

**6. Render, then verify, then flag.** For each word:

```
npx tsx scripts/render-video.ts <word>
```

The render script already passes `--ignore-certificate-errors` (the cloud
proxy MITMs TLS with a CA the headless Chromium does not trust) and writes to
`public/episodes/<word>-<YYYY-MM-DD>.mp4`. `ffmpeg` and `ffprobe` are not in
the base image - install them before the first render.

**Confirm the MP4 exists and is non-trivial in size before marking that word
`done` in `state.json`.** A flag with no file behind it is worse than a failed
render, because the dashboard then reports work that was never produced.

**7. Commit** everything, including the MP4s:

```
git add -A
git commit -m "feat(wordlore): week <YYYY-MM-DD> - <word1>, <word2>, <word3>, <word4>"
```

**8. Push so that `master` actually receives it.** Try `git push origin
HEAD:master` first. If that is redirected or rejected because this session may
only write to its own outcome branch, push the branch instead - the
`Adopt routine output` workflow validates it and merges it into `master`
automatically.

Either way, **check where it landed before reporting**: after pushing, run
`git ls-remote origin master` and confirm master moved, or name the branch and
the workflow run in the Discord message. A week sitting unmerged on a branch is
not a finished week, and the nine-week stall was invisible precisely because
nobody said so.

**9. Post to `$DISCORD_WEBHOOK_URL`:**

```json
{"content":"Wordlore week <YYYY-MM-DD> ready: <word1>, <word2>, <word3>, <word4>. Landed on <branch/master>. Backlog: <n> rendered episodes still unpublished. Review and publish at https://wordlorehq.com/admin/publish on Mon/Tue/Thu/Fri 9 AM MT."}
```

Count the backlog from `state.json`: every word with a render on disk and no
entry in its week's `publishes`. As of 2026-09-06 that is 20 episodes across
eight weeks, none of which has ever been posted. They are the publishing queue,
not dead stock - new weeks go behind them, not instead of them.

## Stop conditions

Post to Discord with the detail, then exit:

- A word fails to render three times.
- Fewer than 4 usable candidates after attempting the step 2 refill.
- Episode schema validation fails - dump the validator output, do not guess
  fields.
- The commit or both push attempts fail.

## Never

- Em dashes or en dashes in any string field.
- Add fields to the Episode schema.
- Force-push.
- Reuse a word from `used[]` under any circumstance.
- Mark a render `done` without confirming the file.
- Report a run as complete without checking where the commit landed.
- Discard, re-draft or retire an episode that is already written. Every word in
  `used[]` was paid for once.
