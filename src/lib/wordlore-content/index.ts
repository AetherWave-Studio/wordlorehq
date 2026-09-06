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
