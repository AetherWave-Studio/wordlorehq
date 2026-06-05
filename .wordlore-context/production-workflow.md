# Wordlore Production Workflow

## Per-episode time budget

- Content writing: ~30-60 min (varies with research depth)
- Audio + render (automated via Opus pipeline): ~5 min
- Review + final tweaks: ~10 min
- **Total per episode: ~1 hour of active work**

One week of episodes (4) = ~3-4 hours total. Easily a single Sunday afternoon's work to stay 1 week ahead.

## Production buffer rule

By each Sunday evening, the next 4 episodes (M/T/Th/F of the coming week) should be:
1. Written (input JSON files)
2. Rendered (MP4s in the `out/` folder)
3. Reviewed

Two-week buffer is even better — covers vacation, illness, or surprise weeks of low output.

## Episode content structure (the input JSON)

Each new word needs an input JSON with this shape:

```json
{
  "word": "EXAMPLE",
  "pronunciation": "/ɪɡˈzæm.pəl/",
  "partOfSpeech": "noun",
  "definition": "a thing characteristic of its kind or illustrating a general rule",
  "hook": "You think you know what an example is. You don't.",
  "modernAnchor": "We use it every day to mean a sample or specimen.",
  "origin": {
    "language": "Latin",
    "era": "1400s",
    "originalWord": "exemplum",
    "originalMeaning": "a sample, a thing taken out"
  },
  "journey": [
    "Chunk 1 — 12-17 words, sets up the historical context.",
    "Chunk 2 — 12-17 words, develops the story.",
    "Chunk 3 — 12-17 words, builds toward the payoff.",
    "Chunk 4 — 12-17 words, lands the surprise."
  ],
  "payoff": {
    "setupWord": "EXAMPLE",
    "connector": "is, literally,",
    "revelation": "A THING TAKEN OUT"
  },
  "outro": {
    "type": "tease",
    "nextWord": "NEXTWORD"
  },
  "musicVariant": "dark"
}
```

### Journey chunking rules

- 3-4 chunks per journey
- 12-17 words each (at 150 wpm narration, that's 5-7 seconds of spoken audio per chunk)
- Total journey runs ~22-25 seconds, fitting Beat 5's target duration
- Each chunk should land one beat of the story — not just be a sentence break

## Render pipeline (run by Opus)

1. Write input JSON: `wordlore/examples/{word}.json`
2. Run orchestrator:
   ```bash
   OPENAI_API_KEY=... npx tsx scripts/render-video.ts examples/{word}.json
   ```
3. Orchestrator generates per-beat TTS narration (OpenAI TTS HD, voice `fable`), concatenates to `assets/audio/voiceover.mp3`
4. Orchestrator probes disk for audio assets (voiceover, music bed, sound logo, page-turn, chime) and passes per-asset boolean flags to the Remotion composition
5. Remotion renders to MP4 at 1080×1920
6. ffmpeg loudnorm pass (`I=-14:TP=-1.5:LRA=11`) brings final audio to social-media standard
7. Output: `out/{word}-YYYY-MM-DD.mp4` + matching metadata.txt

## Word selection criteria

A good Wordlore word has:

1. **Strong modern recognition** — viewers know the word from everyday speech
2. **Surprising hidden meaning** — payoff delivers a genuine "wait, what?" moment
3. **Concrete imagery** — the origin can be visualized (demon, prayer, star, slave, ball of yarn, mouse, fate)
4. **One-line payoff** — fits the "X literally means Y" format cleanly
5. **A single dramatic shift** — modern meaning → original meaning, not a meandering history

### Avoid

- Words too obscure to recognize (most readers won't know what "petrichor" means; payoff lands flat)
- Boring or technical etymologies that feel mechanical ("telephone" = "far + sound" — fine but doesn't surprise)
- Anything requiring more than ~30 seconds of historical context to set up
- Words where the origin meaning is itself unclear or contested in scholarship

## Production rhythm (weekly)

- **Sundays 6pm:** Production check (calendar reminder). Review next week's content, finalize any unwritten episodes, confirm Opus has rendered them.
- **Daily 9am Mon/Tue/Thu/Fri:** Post the day's episode across all platforms in order: YouTube → TikTok → Instagram → Facebook → X.
- **Wednesdays & weekends:** Open production time for writing new episodes, reviewing analytics, refining the format.
