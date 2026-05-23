import { promises as fs } from "fs";
import path from "path";

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

export type RenderStatus = "queued" | "rendering" | "done" | "failed";

export type WeekState = {
  status: WeekStatus;
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

export async function readState(): Promise<State> {
  const raw = await fs.readFile(path.join(CONTENT_ROOT, "state.json"), "utf-8");
  return JSON.parse(raw) as State;
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
  platform: "youtube" | "tiktok" | "instagram" | "facebook" | "x",
): string {
  const title = `${episode.word} literally means "${episode.payoff.revelation.toLowerCase()}"`;
  const hookLine = episode.modernAnchor;
  const lowerWord = episode.word.toLowerCase();

  switch (platform) {
    case "youtube":
    case "facebook":
      return `${hookLine}\n\nEvery word has a story.\n\n#etymology #wordhistory #shorts #${lowerWord} #language`;
    case "tiktok":
      return `${hookLine}\n\n#etymology #wordhistory #fyp #learnontiktok #wordsoftiktok #${lowerWord} #${episode.origin.language.toLowerCase().replace(/\s+/g, "")} #words #englishhistory`;
    case "instagram":
      return `${hookLine} ${episode.journey[0]}\n\n#etymology #wordhistory #reels #language #englishlanguage #${lowerWord} #words #linguistics`;
    case "x":
      return `${title}\n\n${hookLine}\n\nyoutube.com/@wordlorehq`;
  }
}

export function pinnedComment(episode: Episode, bonusFact: string): string {
  return `Bonus: ${bonusFact} // Next word: ${episode.outro.nextWord}`;
}

export function episodeTitle(episode: Episode): string {
  return `${episode.word} literally means "${episode.payoff.revelation.toLowerCase()}"`;
}
