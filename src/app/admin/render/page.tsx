import { readState, readDraft, type Episode, type WeekState } from "@/lib/wordlore-content";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  queued: "text-secondary",
  rendering: "text-accent",
  done: "text-accent",
  failed: "text-payoff",
  missing: "text-payoff",
};

const VIDEO_BASE =
  process.env.NEXT_PUBLIC_WORDLORE_VIDEO_BASE || "/episodes";

const WEEK_STATUS_LABEL: Record<string, string> = {
  drafting: "Drafting",
  review: "Review",
  rendering: "Rendering",
  ready: "Ready to publish",
  publishing: "Publishing",
  published: "Published",
};

type WeekBundle = {
  key: string;
  week: WeekState;
  episodes: Episode[];
};

export default async function RenderPage() {
  const state = await readState();
  const weekKeys = Object.keys(state.weeks).sort((a, b) => b.localeCompare(a));
  const bundles: WeekBundle[] = await Promise.all(
    weekKeys.map(async (k) => ({
      key: k,
      week: state.weeks[k],
      episodes: await Promise.all(
        state.weeks[k].words.map((w) => readDraft(k, w)),
      ),
    })),
  );

  return (
    <div className="space-y-12">
      <header>
        <h1
          className="font-[family-name:var(--font-serif)] text-accent text-3xl mb-2"
          style={{ letterSpacing: "0.02em" }}
        >
          Render queue
        </h1>
        <p className="font-[family-name:var(--font-sans)] text-surface/60 text-sm max-w-prose">
          Renders come from the weekly cloud routine, which commits each MP4 to{" "}
          <code className="text-accent">{VIDEO_BASE}</code>. Status starts
          from <code className="text-accent">state.json</code> and is checked
          against the files actually on disk -{" "}
          <span className="text-payoff">missing</span> means the week was
          recorded as rendered but the MP4 never landed.
        </p>
      </header>

      {bundles.map((b) => (
        <section key={b.key}>
          <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
            <h2
              className="font-[family-name:var(--font-serif)] text-surface text-xl"
              style={{ letterSpacing: "0.02em" }}
            >
              Week of {b.key}
              {b.key === state.currentWeek && (
                <span
                  className="ml-3 font-[family-name:var(--font-sans)] text-accent text-xs uppercase"
                  style={{ letterSpacing: "0.2em" }}
                >
                  current
                </span>
              )}
            </h2>
            <p
              className="font-[family-name:var(--font-sans)] text-secondary text-xs uppercase"
              style={{ letterSpacing: "0.2em" }}
            >
              {WEEK_STATUS_LABEL[b.week.status]}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {b.episodes.map((ep) => {
              const slug = ep.word.toLowerCase();
              const status = b.week.renders[slug] ?? "queued";
              const mp4Url = b.week.renderDate
                ? `${VIDEO_BASE}/${slug}-${b.week.renderDate}.mp4`
                : null;
              const canPlay = status === "done" && mp4Url;

              return (
                <article
                  key={ep.word}
                  className="border border-accent/25 rounded-lg p-3 bg-background/40"
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <h3
                      className="font-[family-name:var(--font-serif)] text-accent text-lg"
                      style={{ letterSpacing: "0.02em" }}
                    >
                      {ep.word}
                    </h3>
                    <span
                      className={`font-[family-name:var(--font-sans)] uppercase text-[10px] ${STATUS_COLOR[status]}`}
                      style={{ letterSpacing: "0.2em" }}
                    >
                      {status}
                    </span>
                  </div>

                  {canPlay ? (
                    <video
                      src={mp4Url}
                      controls
                      playsInline
                      className="w-full rounded bg-black aspect-[9/16]"
                      preload="metadata"
                    />
                  ) : (
                    <div className="w-full rounded bg-background border border-accent/20 aspect-[9/16] flex items-center justify-center">
                      <p
                        className="font-[family-name:var(--font-sans)] text-secondary text-[10px] uppercase text-center px-3"
                        style={{ letterSpacing: "0.2em" }}
                      >
                        {status === "queued"
                          ? "Awaiting render"
                          : status === "rendering"
                            ? "Rendering..."
                            : status === "failed"
                              ? "Render failed"
                              : "No file"}
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
