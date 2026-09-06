# Forking this repo into another faceless channel

This repo is two things: a *channel* (Wordlore) and a *machine* that produces
one. The machine is generic. This is what it takes to point it at a second
brand, and - just as important - what it does not yet cover.

A working second config lives at `examples/channels/mythwright.channel.json`.
Copy it over `channel.config.json` and render any frame to see the whole system
reskin without a code change.

---

## 1. What is channel-specific

| Thing | Where | Effort |
|---|---|---|
| Name, wordmark, tagline, domain, email, socials, palette, typefaces, narrator voice, caption grammar, cadence, trailer script | `channel.config.json` | Edit one file |
| Brand voice, beat formulas, selection rules, the candidate bank the routine draws from | `.wordlore-context/*.md` | Rewrite for the subject |
| Music beds, sound logo, chime | `remotion/assets/audio/` | Replace 4 files |
| Site fonts | `src/app/layout.tsx` - three `next/font/google` calls | 3 lines, must match the config |
| Episode content | `src/lib/wordlore-content/` | Produced weekly by the routine |
| Favicon | `src/app/favicon.ico` | Replace |

Everything else - the seven beats, the timing model, the TTS pipeline, the
render script, the admin dashboard, the weekly routine - is the machine and
should not be forked per channel. If you find yourself editing a beat to make a
channel work, that belongs in the config instead.

## 2. Fork checklist

1. `gh repo create <channel>hq --template wordlorehq` (or fork and reset).
2. Replace `channel.config.json`. Every field is required; there are no
   defaults to fall back on, deliberately - a half-configured channel should
   fail loudly rather than ship with somebody else's tagline.
3. Update the three `next/font/google` calls in `src/app/layout.tsx` to the
   families named in the config. This is the one place `next/font`'s
   requirement for literal calls beats the config; if they disagree the site
   renders in a different face than the videos.
4. If a font is not in `FONT_LOADERS` in `remotion/index.ts`, add one import
   and one entry. Every Google family ships with `@remotion/google-fonts`, so
   nothing needs installing.
5. Rewrite `.wordlore-context/brand-spec.md`, `production-workflow.md`,
   `metadata-template.md` and `word-candidates.md` for the new subject. The
   candidate bank is the fuel supply - see the queue rule below.
6. Replace the audio assets.
7. Rename `src/lib/wordlore-content/` and `.wordlore-context/` to the new
   channel's name if you want (nothing outside the routine prompt and five
   imports refers to them), or leave them - see the honest edges below.
8. Deploy: new Vercel project, domain, and `ADMIN_USERNAME` / `ADMIN_PASSWORD`
   (the admin is behind basic auth in `middleware.ts` and returns 503, not an
   open dashboard, when they are unset).
9. Create the weekly routine from `.wordlore-context/routine-prompt.md`, with
   `OPENAI_API_KEY` and `DISCORD_WEBHOOK_URL` in its environment.

Budget an afternoon for the config, the assets and the deploy. Budget
considerably longer for step 5, which is the only genuinely creative part.

## 3. The honest edges

Things a second channel will hit that the config does not solve:

- **The seven beats are etymology-shaped.** Beat 4 is "origin setup", Beat 6 is
  "your X is, literally, Y". A channel about myths, ships, or forgotten
  disasters can reuse the *rhythm* - hook, reveal, anchor, setup, journey,
  payoff, outro - but the beat semantics and the JSON episode schema need
  rewriting. That is the real per-vertical work, and it is a fork of
  `remotion/beats/` plus `Episode` in `src/lib/wordlore-content/index.ts`.
- **`next/font` cannot read the config** (step 3 above).
- **Directory names still say `wordlore`.** `src/lib/wordlore-content/` and
  `.wordlore-context/` were deliberately left alone: the live routine reads
  them by path, and renaming them in the same change that fixes the routine
  would have broken it a second way. Rename them in a fork, where it is free.
- **Publishing is manual.** Nothing uploads to YouTube, TikTok or Instagram;
  the admin publish page generates captions and links out to each studio. Per
  channel that is roughly 20 minutes a week of hand-uploading, and it is the
  single biggest candidate for automation before a second channel exists.
- **`publishes` in `state.json` is never written.** There is no
  mark-as-published control yet, so the dashboard cannot tell you what actually
  shipped.

## 4. The queue rule, which is what stalled Wordlore

The routine selects words from `word-pipeline.json.available`. When that list
falls below one week's worth, the routine's stop condition fires and the week
produces nothing. Wordlore's pool ran dry after seven weeks and the channel
produced nothing for nine.

Two consequences for a new channel:

- Seed `available` with at least **eight weeks** of candidates, not four.
- Treat "queue low" as a *task*, not an error. The routine now refills from
  `word-candidates.md` before it stops - see the prompt - but a human still has
  to keep the candidate bank ahead of it.

## 5. Before pricing this for anyone else

Measure the fully loaded cost of one four-episode week: OpenAI TTS characters,
Remotion render minutes, and the routine's own token spend. Nothing in this
repo records it yet, and every licence question downstream depends on it.
