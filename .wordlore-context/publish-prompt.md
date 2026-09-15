# Wordlore publish routine

Book this week's episodes to the social platforms. Runs Monday morning, before
the first slot.

This exists because the render was automated and the publish was not. The
Saturday routine produced a week and then told a human to go press a button at
`/admin/publish`, which meant every week depended on someone noticing. Twice
they did not, and the week went out late.

## What to do

**1. Run the dry run.**

```
npx tsx scripts/schedule-week.ts
```

With no `--week` it targets the Monday of the current week, which is the week
you are inside on a Monday.

**2. Read what it printed. Do not skip this.**

- **Posting as** must list this channel's own accounts:
  `Andrew Froehlich (Wordlore)`, `wordlorehq` x3, `Drew Froehlich`.
  One Blotato workspace holds several brands. If YouTube shows
  `Andrew Froehlich (AetherWave Studio)`, **stop** - that is another channel's
  feed, and posting there is not recoverable by deleting afterwards.
- **Covers** should read `thumbnail` for youtube and instagram, `frame at 8.0s`
  for tiktok, and `platform default (no cover field)` for facebook and threads.
  The last two are correct, not a failure: those platforms accept no cover.
- **Slot count** should be 20 (four episodes x five platforms).

**3. If it says `0 to book, 20 already scheduled`, stop.** The week is done.
Report it and exit. Do not pass `--commit` to "make sure" - the script no-ops,
but the right response to an already-scheduled week is to leave it alone.

**4. Commit it.**

```
npx tsx scripts/schedule-week.ts --commit
```

The script dry-runs again internally before booking, so an account that stopped
resolving between step 1 and here still fails safe.

**5. Verify from the platform, not from the script's own output.**

```
GET https://aetherwavestudio.com/api/channel/publishes?channel=wordlore&week=<YYYY-MM-DD>
    with header X-AW-Key: $AETHERWAVE_API_KEY
```

Expect 20 rows. Note that `status` reads `scheduled` forever - nothing
reconciles it after the fact - so it confirms the booking, not the publishing.

**6. Report to `$DISCORD_WEBHOOK_URL`:**

```
{"content":"Wordlore week <YYYY-MM-DD> scheduled: <n> slots across youtube, tiktok, instagram, facebook, threads. First post <day> 9 AM MT."}
```

## Stop and report instead of improvising

- `AETHERWAVE_API_KEY` missing. The script says so and exits; do not try to
  work around it.
- **Not every episode is rendered.** This means the Saturday routine produced
  the week but could not upload the media - check
  `GET /api/channel/media?channel=wordlore` for this week's files. The fix is
  to re-run the render routine, not to schedule a partial week.
- **An account did not resolve.** Never guess a handle. The error names what it
  expected and what is connected; paste the right name into
  `channel.blotato.accounts` in `channel.config.json`.
- **Some slots failed.** The script reports each one and exits non-zero. Re-run
  it - booking is idempotent, so a retry books only what is missing.

## Never

- Schedule a week whose episodes are not all rendered.
- Guess which account a platform should post as.
- Report a week as published. This books slots; the platforms publish them
  later, and nothing here observes that.
