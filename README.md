# Wordlore

Short-form etymology. Every word has a story.

The site is [wordlorehq.com](https://wordlorehq.com); the admin dashboard is at
`/admin` behind basic auth. This repo is two things at once: the Wordlore
channel, and the machine that produces one. See
[docs/NEW-CHANNEL.md](docs/NEW-CHANNEL.md) for pointing the machine at a
different brand.

## How an episode is made

1. A word is drafted as JSON in `src/lib/wordlore-content/drafts/<week>/`,
   matching the `Episode` schema in `src/lib/wordlore-content/index.ts`.
2. `npm run render -- <word>` generates per-beat narration with OpenAI TTS,
   measures each beat's audio, and renders the seven-beat Remotion composition
   to `public/episodes/<word>-<YYYY-MM-DD>.mp4`.
3. The admin publish page generates per-platform captions. Uploading is manual.

Everything that makes this Wordlore rather than another channel - name,
wordmark, palette, typefaces, narrator voice, caption grammar, cadence - lives
in `channel.config.json` and nowhere else.

## The weekly routine

A scheduled cloud routine runs Saturdays at 14:00 UTC and produces the coming
week's four episodes. Its instructions live in
[`.wordlore-context/routine-prompt.md`](.wordlore-context/routine-prompt.md),
in the repo rather than in a text box, so they can be fixed in review.

**The routine cannot push to `master`.** Its session writes to an outcome
branch (`claude/intelligent-franklin*`), so
`.github/workflows/adopt-routine-output.yml` typechecks, lints, builds and then
merges that branch into `master` for it. Between 2026-07-06 and 2026-09-05 that
gap was open: every run started from a `master` that had never received the
previous run's work, read an empty word queue, hit its own stop condition, and
reported success in 82 seconds. Nine weeks produced nothing.

If a week goes missing again, check in this order:

| Check | Where |
|---|---|
| Did the routine run? | Routine history - a very short "success" means it stopped early |
| Did its branch land? | `git branch -r --list 'origin/claude/intelligent-franklin*'` vs `master` |
| Did the adopt workflow pass? | Actions tab - a red run means the branch failed validation and stayed put |
| Is the word queue fed? | `word-pipeline.json` `available` - below 8 entries needs a refill |
| Do the MP4s exist? | `/admin/render` - `missing` means flagged done with no file |

## Commands

```bash
npm run dev              # Next.js dev server
npm run build            # production build
npm run lint             # eslint
npx tsc --noEmit         # typecheck
npm run render -- <word> # narrate + render one episode
npm run render:trailer   # render the 30s channel trailer
```

`ffmpeg` and `ffprobe` must be on PATH for any render.

## Environment

| Variable | Used by |
|---|---|
| `OPENAI_API_KEY` | narration (TTS) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | `/admin` basic auth - unset returns 503, not an open dashboard |
| `DISCORD_WEBHOOK_URL` | the routine's weekly report |
| `WORDLORE_OUT_DIR` | optional: render output outside the repo tree |
