# Wordlore publish routine

Book this week's episodes to the social platforms. Runs Monday morning, before
the first slot.

## What to do

Run exactly this, once, from the repo root:

```
npx tsx scripts/schedule-week.ts
```

Then relay its last line (it starts `Wordlore week`) as your final answer. That
is the whole job.

The script does everything that used to be a checklist here, in code
(`src/lib/publish-checks.ts`): it previews the week, checks that every platform
posts as this channel's own account (YouTube = `Andrew Froehlich (Wordlore)`,
never an AetherWave account), that the week is the current one, that all four
episodes are rendered, and that there are 20 slots. If every check passes it
books the week; if not, it refuses with a one-line reason. Either way it posts
that line to `$DISCORD_WEBHOOK_URL` itself, so you do not need to.

## Rules

- **Do not pass flags.** No `--commit` (booking is the default now), no
  `--week`, no `--dry-run`. The defaults are the Monday run.
- **Do not judge, fix or retry anything yourself.** If the script refuses or
  fails, relay its line and stop. A human reads it in Discord.
- **Do not post to any platform, Blotato, or Discord by any other means.**
- If the repo is not checked out (no `scripts/schedule-week.ts`), say exactly
  that and stop: the routine needs `AetherWave-Studio/wordlorehq` attached as a
  source. Do not reconstruct the procedure from memory.

## Why it is this short (2026-10-05)

The previous version of this file asked the routine to run a dry run, read a
checklist, judge it and then pass `--commit`. On 2026-09-28 and 2026-10-05 the
run stopped somewhere between the dry run and the commit and reported nothing;
both weeks were booked by hand. A decision that lives in prose depends on its
reader. It now lives in code that either books or names what is wrong, and
reports both. Booking is idempotent (the platform's unique index on
week/episode/platform), so a re-run after a partial books only what is missing.
