import { readState, readDraft, type Episode, type WeekState } from "@/lib/wordlore-content";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  queued: "text-[#7A8B6F]",
  rendering: "text-[#C9A961]",
  done: "text-[#C9A961]",
  failed: "text-[#8B2635]",
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
          className="font-[family-name:var(--font-serif)] text-[#C9A961] text-3xl mb-2"
          style={{ letterSpacing: "0.02em" }}
        >
          Render queue
        </h1>
        <p className="font-[family-name:var(--font-sans)] text-[#F4E8D0]/60 text-sm max-w-prose">
          For now, renders run locally on Andrew&apos;s machine. Status comes
          from <code className="text-[#C9A961]">state.json</code> - the Phase 3
          GitHub Actions worker will update it via webhook. MP4s served from{" "}
          <code className="text-[#C9A961]">{VIDEO_BASE}</code>.
        </p>
      </header>

      {bundles.map((b) => (
        <section key={b.key}>
          <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
            <h2
              className="font-[family-name:var(--font-serif)] text-[#F4E8D0] text-xl"
              style={{ letterSpacing: "0.02em" }}
            >
              Week of {b.key}
              {b.key === state.currentWeek && (
                <span
                  className="ml-3 font-[family-name:var(--font-sans)] text-[#C9A961] text-xs uppercase"
                  style={{ letterSpacing: "0.2em" }}
                >
                  current
                </span>
              )}
            </h2>
            <p
              className="font-[family-name:var(--font-sans)] text-[#7A8B6F] text-xs uppercase"
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
                  className="border border-[#C9A961]/25 rounded-lg p-3 bg-[#0F1A2E]/40"
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <h3
                      className="font-[family-name:var(--font-serif)] text-[#C9A961] text-lg"
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
                    <div className="w-full rounded bg-[#0F1A2E] border border-[#C9A961]/20 aspect-[9/16] flex items-center justify-center">
                      <p
                        className="font-[family-name:var(--font-sans)] text-[#7A8B6F] text-[10px] uppercase text-center px-3"
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
