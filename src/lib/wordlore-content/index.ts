import { promises as fs } from "fs";
import path from "path";
import {
  applyPattern,
  channel,
  hashtags,
  type CaptionPlatform,
} from "../channel";

export type { CaptionPlatform };

export type Episode = {
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  definition: string;
  hook: string;
  modernAnchor: string;
  origin: {
    language: string;
    era: string;
    originalWord: string;
    originalMeaning: string;
  };
  journey: string[];
  payoff: {
    setupWord: string;
    connector: string;
    revelation: string;
  };
  outro: {
    type: "tease";
    nextWord: string;
  };
  musicVariant: "dark" | "warm";
};

export type WeekStatus =
  | "drafting"
  | "review"
  | "rendering"
  | "ready"
  | "publishing"
  | "published";

/**
 * "missing" is not written by the pipeline. It is derived at read time when a
 * word is recorded `done` but its MP4 is not on disk - see `readState`.
 */
export type RenderStatus =
  | "queued"
  | "rendering"
  | "done"
  | "failed"
  | "missing";

export type WeekState = {
  status: WeekStatus;
  renderDate: string | null;
  words: string[];
  renders: Record<string, RenderStatus>;
  publishes: Record<string, Record<string, string | null>>;
};

export type State = {
  currentWeek: string;
  weeks: Record<string, WeekState>;
};

export type PipelineWord = {
  word: string;
  tier: 1 | 2 | 3 | 4;
  language: string;
  payoff: string;
};

export type UsedWord = {
  word: string;
  week: string;
  drafted: string;
};

export type Pipeline = {
  available: PipelineWord[];
  used: UsedWord[];
};

const CONTENT_ROOT = path.join(process.cwd(), "src", "lib", "wordlore-content");
const EPISODE_DIR = path.join(process.cwd(), "public", "episodes");

/** The MP4 filename a rendered episode is expected to have. */
export function episodeVideoFile(
  word: string,
  renderDate: string | null,
): string | null {
  return renderDate ? `${word.toLowerCase()}-${renderDate}.mp4` : null;
}

/**
 * Reconcile recorded render status against what is actually on disk.
 *
 * Weeks 2026-06-22, 06-29 and 07-06 were all committed with every word flagged
 * `done` and no MP4 in the commit, so the dashboard reported twelve finished
 * episodes that do not exist. Recorded status is a claim; the file is the
 * evidence. Where the two disagree the file wins.
 *
 * If the episode directory cannot be listed (a deploy target that serves
 * `public/` off a CDN rather than the app filesystem) we have no evidence
 * either way, so the recorded status is left untouched rather than replaced
 * with a different lie.
 */
async function reconcileRenders(state: State): Promise<State> {
  let onDisk: Set<string>;
  try {
    onDisk = new Set(await fs.readdir(EPISODE_DIR));
  } catch {
    return state;
  }

  for (const week of Object.values(state.weeks)) {
    for (const [word, status] of Object.entries(week.renders)) {
      if (status !== "done") continue;
      const file = episodeVideoFile(word, week.renderDate);
      if (!file || !onDisk.has(file)) week.renders[word] = "missing";
    }
  }
  return state;
}

export async function readState(): Promise<State> {
  const raw = await fs.readFile(path.join(CONTENT_ROOT, "state.json"), "utf-8");
  return reconcileRenders(JSON.parse(raw) as State);
}

export async function readPipeline(): Promise<Pipeline> {
  const raw = await fs.readFile(
    path.join(CONTENT_ROOT, "word-pipeline.json"),
    "utf-8",
  );
  return JSON.parse(raw) as Pipeline;
}

export async function readDraft(week: string, word: string): Promise<Episode> {
  const raw = await fs.readFile(
    path.join(CONTENT_ROOT, "drafts", week, `${word.toLowerCase()}.json`),
    "utf-8",
  );
  return JSON.parse(raw) as Episode;
}

export async function readWeekDrafts(week: string): Promise<Episode[]> {
  const state = await readState();
  const weekState = state.weeks[week];
  if (!weekState) return [];
  return Promise.all(weekState.words.map((w) => readDraft(week, w)));
}

export function platformCaption(
  episode: Episode,
  platform: CaptionPlatform,
): string {
  const tags = hashtags(platform, episode.word, episode.origin.language);
  const hookLine = episode.modernAnchor;

  switch (platform) {
    case "youtube":
    case "facebook":
      return `${hookLine}\n\n${channel.captions.signature}\n\n${tags}`;
    case "tiktok":
      return `${hookLine}\n\n${tags}`;
    case "instagram":
      return `${hookLine} ${episode.journey[0]}\n\n${tags}`;
    case "x": {
      const handle = channel.socials.x ?? channel.socials.youtube ?? channel.site.url;
      const link = handle.replace(/^https?:\/\/(www\.)?/, "");
      return `${episodeTitle(episode)}\n\n${hookLine}\n\n${link}`;
    }
  }
}

export function pinnedComment(episode: Episode, bonusFact: string): string {
  return `Bonus: ${bonusFact} // Next word: ${episode.outro.nextWord}`;
}

export function episodeTitle(episode: Episode): string {
  return applyPattern(
    channel.captions.titlePattern,
    episode.word,
    episode.payoff.revelation,
  );
}

// ---------------------------------------------------------------------------
// Week labels.
//
// A week key is the Monday of the week the batch is meant to publish in. That
// is a CALENDAR fact, and it is not the same as `state.currentWeek`, which only
// means "the most recent batch produced". They drifted three weeks apart in
// September 2026 and the dashboard badged a three-week-old batch as "current",
// which is how a stale queue passes for this week's work.
//
// Everything below derives from the calendar so the two can never be confused
// again.
// ---------------------------------------------------------------------------

/** The Monday of the week containing `d`, as a YYYY-MM-DD key. */
export function mondayOf(d: Date = new Date()): string {
  const utc = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  // getUTCDay: 0 = Sunday. Shift so Monday is the start of the week.
  const shift = (utc.getUTCDay() + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - shift);
  return utc.toISOString().slice(0, 10);
}

/** Whole weeks from week key `a` to week key `b`. Negative means `b` is older. */
export function weeksBetween(a: string, b: string): number {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.round(ms / (7 * 24 * 60 * 60 * 1000));
}

/** "September 7, 2026" from a week key. */
export function formatWeekDate(key: string): string {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** "Week of September 7, 2026" from a week key. */
export function formatWeek(key: string): string {
  return `Week of ${formatWeekDate(key)}`;
}

/** Where a week key sits relative to the current calendar week. */
export function weekPhase(key: string, today: Date = new Date()): string {
  const delta = weeksBetween(mondayOf(today), key);
  if (delta === 0) return "this week";
  if (delta === 1) return "next week";
  if (delta === -1) return "last week";
  return delta < 0 ? `${-delta} weeks ago` : `in ${delta} weeks`;
}

/** How many of a week's words have an MP4 on disk. */
export function renderedCount(week: WeekState): number {
  return week.words.filter((w) => week.renders[w] === "done").length;
}
