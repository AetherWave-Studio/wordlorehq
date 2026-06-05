# Wordlore Brand Specification

## Identity

- **Channel name:** Wordlore (one word, never "Word Lore" or "WordLore")
- **Tagline:** "Every word has a story."
- **Voice:** Conspiratorial-knowing storyteller. Mid-pace narration (~150 wpm). Lets the audience in on a secret. Anti-academic, pro-story. Restrained — no emojis, no clickbait phrasing, no exclamation points.
- **TTS voice (for narration):** OpenAI TTS HD, voice `fable` (British male, storyteller-leaning)

## Color palette (locked)

| Role | Color name | Hex |
|---|---|---|
| Background | Midnight ink | `#0F1A2E` |
| Hero word, brand mark, ornaments | Gold | `#C9A961` |
| Cream text, parchment surfaces, tagline | Parchment | `#F4E8D0` |
| Origin labels, scholarly accents | Sage | `#7A8B6F` |
| Payoff revelation (SCARCE) | Oxblood | `#8B2635` |

**Scarcity rule:** Oxblood appears ONLY in Beat 6 (the payoff revelation) and in the small payoff text within the channel trailer. Never elsewhere. This is what gives the payoff its visual weight.

## Typography

| Role | Font | Used in |
|---|---|---|
| Display serif (hero words, wordmark) | Playfair Display | Beat 2 hero word, Beat 6 payoff, Beat 7 wordmark, channel trailer |
| Italic serif (origin words, taglines, hooks) | Cormorant Garamond | Beat 1 hook, Beat 4 origin word, Beat 6 connector, tagline |
| Sans (definitions, body, captions) | Inter | Beat 2 definition, Beat 3 anchor, Beat 4 origin meaning, Beat 5 journey, Beat 7 cadence text |

All loaded via `@remotion/google-fonts` in the render pipeline.

## 7-beat episode structure (~80s total)

1. **Hook** (3-4s) — italic Cormorant, parchment, curiosity-gap line. Brand mark at top.
2. **Word Reveal** (4-5s) — gold Playfair hero word + IPA pronunciation + part of speech + definition. Sound logo plays at this beat. Bottom ornament appears.
3. **Modern Anchor** (6-8s) — relatable modern usage. Small gold "TODAY" label above the line.
4. **Origin Setup** (12-16s) — parchment card filling most of the frame. Sage "OLD ENGLISH · BEFORE 1300" (or equivalent) label inside card. Large italic Cormorant origin word (e.g., "mære"). Gold diamond ornament with flanking line accents. Sans-serif origin meaning below.
5. **Journey** (20-28s) — progressive reveal: 3-4 chunked sentences crossfade in/out as narration proceeds. Each chunk on screen ~5-7 seconds.
6. **Payoff** (12-16s) — small parchment "your" → gold setup word → italic parchment "is, literally," → oxblood revelation. This is the only beat that uses oxblood. Chime SFX plays on the oxblood reveal.
7. **Outro** (8-10s) — WORDLORE wordmark larger and more prominent than other beats. Italic Cormorant tagline "Every word has a story." Gold diamond ornament. Small italic "tomorrow" label + gold next word (echoing Beat 2's gold treatment, creating a series loop).

## Visual continuity elements

- **Brand mark** at top of every beat (small, parchment-colored, "WORDLORE" in tracked-out serif caps with a thin gold line below)
- **Bottom ornament** (dot + thin line accents) on most beats
- **Gold diamond ornament** with horizontal line accents (used in Beat 4 and Beat 7, plus the channel banner)
- **Series loop:** each video's outro teases the next word, creating a chain (nightmare → goodbye → disaster → robot → clue → ...)

## Brand mark / logo

- **Primary logo (avatar):** A gold capital "W" in Playfair-style serif with a thin gold line and small gold diamond ornament below it. Used as profile picture across all five platforms.
- **Secondary logo (wordmark):** "WORDLORE" in tracked-out gold Playfair caps. Used in the YouTube banner, channel trailer, and inside the videos as the brand mark.

## What NOT to do

- Don't use emojis in any official channel copy (titles, bios, descriptions)
- Don't add gradients, drop shadows, or 3D effects to the visual identity
- Don't use exclamation points in the narration or descriptions
- Don't mix in colors outside the locked palette
- Don't break the oxblood scarcity rule
- Don't shorten or stylize the brand name ("WL," "Wordlore." with period, "wOrDlOrE")
- Don't use clickbait phrasing in titles ("You won't believe...", "WAIT TIL YOU SEE")
