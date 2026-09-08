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
   seconds. This is now closed from the repo side: pushing a `claude/**` branch
   whose diff is confined to episode content triggers
   `.github/workflows/adopt-routine-output.yml`, which typechecks, lints,
   builds and then merges it into `master`. Step 8 still tries `master`
   directly, and the workflow is the backstop when it cannot.

   **A run that also changes code will not auto-merge** - that guard is
   deliberate. Land the content first, then raise the code change as a pull
   request rather than bundling it in.
2. **The pool ran dry and the routine treated that as an exit.** Refilling is
   now step 2, before selection.
3. **Weeks were marked rendered with no MP4 in the commit.** Twelve episodes
   were recorded `done` and do not exist. Step 6 now verifies the file before
   the flag.
4. **The week label drifted from the calendar.** Nine missed weeks left
   `currentWeek` reading `2026-08-17` well into September, and because the
   dashboard took its "current" badge from that field, a three-week-old batch
   presented as this week's work. Step 1 now derives the target from the
   calendar, and the dashboard labels every batch by its real age.

## Steps

**1. Compute the target week from the CALENDAR, not from `currentWeek`.**

A week key is the Monday of the week the batch publishes in. `currentWeek` only
means "the newest batch produced" - on 2026-09-07 it still read `2026-08-17`,
three weeks stale, and the dashboard badged that batch "current". Never treat
`currentWeek` as the date.

Let `thisMonday` be the Monday of the week you are running in (UTC), and
`nextMonday` be `thisMonday + 7`.

- If `thisMonday` has no entry in `state.json.weeks` **and** today is Monday,
  Tuesday or Wednesday, the target is `thisMonday` - most of the publish week
  is still ahead, so fill it.
- Otherwise the target is `nextMonday`.

If the target already has an entry, stop and post to Discord:
`Wordlore routine: week <target> already on disk, skipping.`

**Do not backfill a week older than `thisMonday`.** Those publish slots have
passed and cannot be recovered by relabelling. Weeks 2026-08-24 and 2026-08-31
have no batch and never will; that gap is history, not a task. The channel
restarts from the current week, not from the hole.

**2. Check the queue, and refill it rather than stopping.** If
`word-pipeline.json.available` holds fewer than 8 entries, add new candidates
to `.wordlore-context/word-candidates.md` and to `available` until it holds at
least 12. Vet each against the four selection criteria in that file, and check
every one against `used[]` before adding it. Post to Discord that you refilled
and with which words. Only stop if you cannot produce 4 usable words.

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

**6b. Then clear backlog, if the week itself came out clean.** Read
`state.json` for any word whose status is `missing` - recorded `done` with no
MP4 behind it, in `public/episodes/` or on the media host. Those episodes are already written; only the render
is absent. Once the target week's own four have rendered and been verified,
re-render up to **4** of the missing ones, oldest week first, using step 6's
procedure. Stop at 8 renders total for the run.

They are paid-for work: do not re-draft them, do not retire the words, do not
move them back to `available`, and do not change their week key. Only the
week's `renderDate` changes, to the date you rendered on, so the filenames and
the dashboard's evidence check agree.

If the target week fails to render, skip the backlog entirely and report - one
broken week is a bug to look at, not a reason to start a second batch.

**7. Upload the renders to the media host.** The MP4s do not go in the repo:

```
node scripts/sync-media.mjs --upload
```

This asks AetherWave for a presigned URL per file and uploads straight to R2,
then rewrites `src/lib/wordlore-content/media-manifest.json` from what the host
actually holds. It needs `AETHERWAVE_API_KEY` in the environment.

Episodes used to be committed here. 184 MB of MP4 accumulated in the repo,
shipped inside every deployment, and grew ~21 MB a week until the Vercel build
quota ran out. `.gitignore` and the adopt workflow both refuse video now, so a
run that skips this step will not land - and the manifest is the only evidence
the dashboard has that a render exists, so skipping it also marks the whole
week `missing`.

**Confirm the manifest lists this week's four MP4s AND their four `.jpg`
thumbnails before committing.** Both are uploaded; the manifest holds both.

> **First automated thumbnail run.** Episode thumbnails were added the week of
> 2026-09-07, after that week published with blank ones - the video's first
> frame is deliberately empty, so every platform left to choose picked the
> background. That week was fixed by hand. **The week of 2026-09-14 is the
> first one where the automation is actually exercised**, so do not assume it
> worked: after scheduling, confirm on the published posts that YouTube and
> Instagram show the word-and-definition card, and that TikTok's cover is the
> word reveal rather than a black frame. Report what you see either way.
> Facebook and Threads accept no cover at all and will still show their own
> first frame - that is expected, not a failure. Delete this note once a run
> has confirmed it end to end.

**7b. Commit** the content and the manifest:

```
git add -A
git commit -m "feat(wordlore): week <YYYY-MM-DD> - <word1>, <word2>, <word3>, <word4>"
```

**8. Push so that `master` actually receives it.** Try `git push origin
HEAD:master` first. If that is redirected or rejected because this session may
only write to its own outcome branch, push the branch instead - the
`Adopt routine output` workflow validates it and merges it into `master`
automatically, whatever your branch is called, as long as the diff is only
episode content.

Either way, **check where it landed before reporting**: after pushing, run
`git ls-remote origin master` and confirm master moved, or name the branch and
the workflow run in the Discord message. A week sitting unmerged on a branch is
not a finished week, and the nine-week stall was invisible precisely because
nobody said so.

**9. Post to `$DISCORD_WEBHOOK_URL`:**

```json
{"content":"Wordlore week <YYYY-MM-DD> ready: <word1>, <word2>, <word3>, <word4>. Landed on <branch/master>. <n> episodes still missing a render. Captions and links at https://wordlorehq.com/admin/publish - publish Mon/Tue/Thu/Fri 9 AM MT."}
```

`<n>` is the count of words whose status is `missing`, which is a fact the repo
can check. **Do not report a count of unpublished episodes.** Nothing records
publishing: `publishes` is empty for every week ever produced, and that is a
missing feature, not a missing upload. Everything up to and including week
2026-08-17 went out on schedule. Reading the empty field as "never posted" is
exactly the mistake the render-status reconciliation exists to prevent, made
one field over.

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
- Commit an MP4. Upload it (step 7); the repo takes the manifest only.
- Report a run as complete without checking where the commit landed.
- Discard, re-draft or retire an episode that is already written. Every word in
  `used[]` was paid for once.
