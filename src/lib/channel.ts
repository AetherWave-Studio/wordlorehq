/**
 * Channel configuration - the one file a new channel edits.
 *
 * Everything that makes this deployment "Wordlore" rather than some other
 * faceless channel lives in `channel.config.json` at the repo root: the name,
 * the palette, the typefaces, the narrator, the caption grammar, the socials.
 * Nothing else in the codebase should hardcode a brand string or a hex value.
 *
 * Imported by BOTH sides of the system, so it must stay browser-safe: the Next
 * app imports it as `@/lib/channel`, and the Remotion beats import it as
 * `../../src/lib/channel` (they render in a headless browser, so no `fs`, no
 * `process.env`, no Node built-ins in this file or anything it imports).
 *
 * See docs/NEW-CHANNEL.md for what forking this into a second channel takes.
 */

import raw from "../../channel.config.json";

export type Palette = {
  /** Frame and page background. Every beat sits on it. */
  background: string;
  /** Cream/parchment text on the background; card fill where the beat inverts. */
  surface: string;
  /** Hero words, brand mark, ornaments. The primary accent. */
  accent: string;
  /** SCARCE. The payoff revelation colour, Beat 6 only. */
  payoff: string;
  /** Section labels and scholarly decoration. The secondary accent. */
  secondary: string;
};

export type ChannelFonts = {
  /** Display face for hero words and the wordmark. */
  display: string;
  /** Italic serif for hooks, origin words and taglines. */
  displayItalic: string;
  /** Sans for definitions, body copy and captions. */
  body: string;
};

export type SocialPlatform =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "threads"
  | "x";

/** Platforms an episode gets a caption for. Threads reuses the Instagram copy. */
export type CaptionPlatform = "youtube" | "tiktok" | "instagram" | "facebook" | "x";

export type ChannelConfig = {
  /** Lowercase slug. Used for file prefixes and directory names. */
  id: string;
  /** Display name, as written in prose. */
  name: string;
  /** All-caps wordmark burned into every frame. */
  wordmark: string;
  tagline: string;
  site: {
    url: string;
    email: string;
    /** One line. Used for meta description and social cards. */
    description: string;
    /** The splash page's paragraph of positioning copy. */
    blurb: string;
    /** The line under the copyright. */
    footerNote: string;
  };
  socials: Record<SocialPlatform, string | null>;
  palette: Palette;
  fonts: ChannelFonts;
  narration: {
    /** OpenAI TTS model id. */
    model: string;
    /** OpenAI TTS voice id. */
    voice: string;
    /** Playback rate handed to the API. Below 1.0 reads slower and calmer. */
    speed: number;
  };
  captions: {
    /**
     * Title grammar. `{WORD}` is the upper-case word, `{word}` lower-case, and
     * `{revelation}` the payoff line in lower case.
     */
    titlePattern: string;
    /** The line that closes a long-form caption. Usually the tagline. */
    signature: string;
    /**
     * Hashtags per platform, without the leading `#`. Two placeholders are
     * substituted per episode: `{word}` and `{originLanguage}`.
     */
    hashtags: Record<CaptionPlatform, string[]>;
  };
  /**
   * How this channel's accounts are named inside Blotato.
   *
   * Blotato reports whatever the connected account is called - a YouTube
   * channel shows as "Andrew Froehlich (Wordlore)", a Facebook login as a
   * person's name - so these cannot be derived from the `socials` URLs. When
   * one Blotato workspace holds several brands, this is what stops a week of
   * episodes landing on the wrong one.
   */
  /**
   * Where rendered episodes are served from.
   *
   * `baseUrl` empty means "out of `public/episodes/` in this deployment",
   * which is where this channel started and does not scale: the MP4s go into
   * the repo, ship inside every build, and grow with the archive until the
   * host's build quota runs out. Point it at object storage and the deployment
   * carries app code only.
   */
  media?: {
    baseUrl?: string | null;
  };
  blotato?: {
    accounts?: Partial<Record<SocialPlatform, string>>;
    /**
     * Which Facebook page to post to, by name. A Facebook login usually
     * administers several pages, and the API will not choose between them:
     * leave this null only when the account has exactly one.
     */
    facebookPage?: string | null;
  };
  trailer: {
    /**
     * The channel trailer's seven narration lines, in order. `{name}`,
     * `{tagline}` and `{publishDays}` are substituted at render time.
     */
    narration: string[];
  };
  cadence: {
    episodesPerWeek: number;
    /** Full day names, for narration and prose. */
    publishDays: string[];
    /** Abbreviated day names, for tight UI. */
    publishDaysShort: string[];
    publishTime: string;
  };
};

export const channel = raw as ChannelConfig;

/** CSS font stack for a configured family, with sane fallbacks by role. */
export function fontStack(role: keyof ChannelFonts): string {
  const family = `"${channel.fonts[role]}"`;
  return role === "body"
    ? `${family}, -apple-system, BlinkMacSystemFont, system-ui, sans-serif`
    : `${family}, Georgia, serif`;
}

/** The palette as CSS custom properties, for the app's `:root`. */
export function paletteVars(): string {
  return Object.entries(channel.palette)
    .map(([token, value]) => `--${token}: ${value};`)
    .join(" ");
}

/** Fill `{WORD}` / `{word}` / `{revelation}` in a caption pattern. */
export function applyPattern(
  pattern: string,
  word: string,
  revelation: string,
): string {
  return pattern
    .replace(/\{WORD\}/g, word.toUpperCase())
    .replace(/\{word\}/g, word.toLowerCase())
    .replace(/\{revelation\}/g, revelation.toLowerCase());
}

/**
 * How many hashtags each platform will accept on one post.
 *
 * These are platform facts, not channel taste, so they live in code rather
 * than in `channel.config.json`. Instagram is the strict one: it rejects the
 * whole post with a 422 rather than ignoring the extras, which is a failure
 * you only see at publish time - a dry run never calls the network, so it
 * cannot catch this for you. Zero means no published limit worth enforcing.
 */
const HASHTAG_LIMIT: Record<CaptionPlatform, number> = {
  youtube: 15,
  tiktok: 30,
  instagram: 5,
  facebook: 30,
  x: 30,
};

/**
 * Render a platform's hashtag list for one episode.
 *
 * The configured list is priority-ordered: put the tags that matter first,
 * because anything past the platform's limit is dropped here rather than
 * failing the post. Threads reuses the Instagram caption, so it inherits
 * Instagram's ceiling too - which is fine, Threads is the looser of the two.
 */
export function hashtags(
  platform: CaptionPlatform,
  word: string,
  originLanguage: string,
): string {
  return channel.captions.hashtags[platform]
    .slice(0, HASHTAG_LIMIT[platform])
    .map((tag) =>
      tag
        .replace(/\{word\}/g, word.toLowerCase())
        .replace(/\{originLanguage\}/g, originLanguage.toLowerCase().replace(/\s+/g, "")),
    )
    .map((tag) => `#${tag}`)
    .join(" ");
}

/**
 * The public URL of one rendered episode.
 *
 * Falls back to this site's own `/episodes/` path when no media host is
 * configured, which is both the original behaviour and what a new channel gets
 * before it has anywhere to put its renders.
 */
export function episodeUrl(file: string): string {
  const base = channel.media?.baseUrl?.replace(/\/$/, "");
  return base ? `${base}/${file}` : `${channel.site.url}/episodes/${file}`;
}
