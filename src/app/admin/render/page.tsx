import { readState, readWeekDrafts } from "@/lib/wordlore-content";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  queued: "text-[#7A8B6F]",
  rendering: "text-[#C9A961]",
  done: "text-[#C9A961]",
  failed: "text-[#8B2635]",
};

const VIDEO_BASE =
  process.env.NEXT_PUBLIC_WORDLORE_VIDEO_BASE ||
  "https://videos.wordlorehq.com/episodes";

export default async function RenderPage() {
  const state = await readState();
  const week = state.weeks[state.currentWeek];
  const episodes = await readWeekDrafts(state.currentWeek);

  return (
    <div className="space-y-12">
      <header>
        <p
          className="font-[family-name:var(--font-sans)] text-[#7A8B6F] text-xs uppercase mb-2"
          style={{ letterSpacing: "0.25em" }}
        >
          Week of {state.currentWeek}
        </p>
        <h1
          className="font-[family-name:var(--font-serif)] text-[#C9A961] text-3xl mb-2"
          style={{ letterSpacing: "0.02em" }}
        >
          Render queue
        </h1>
        <p className="font-[family-name:var(--font-sans)] text-[#F4E8D0]/60 text-sm max-w-prose">
          For now, renders run locally on Andrew&apos;s machine. Once a video is
          uploaded to R2 (or the configured video base), the preview will play
          inline. Status comes from state.json - the Phase 3 GitHub Actions
          worker will update it via webhook.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {episodes.map((ep) => {
          const slug = ep.word.toLowerCase();
          const status = week.renders[slug] ?? "queued";
          const mp4Url = `${VIDEO_BASE}/${slug}-2026-05-25.mp4`;

          return (
            <article
              key={ep.word}
              className="border border-[#C9A961]/25 rounded-lg p-5 bg-[#0F1A2E]/40"
            >
              <div className="flex items-baseline justify-between mb-4">
                <h2
                  className="font-[family-name:var(--font-serif)] text-[#C9A961] text-2xl"
                  style={{ letterSpacing: "0.02em" }}
                >
                  {ep.word}
                </h2>
                <span
                  className={`font-[family-name:var(--font-sans)] uppercase text-xs ${STATUS_COLOR[status]}`}
                  style={{ letterSpacing: "0.2em" }}
                >
                  {status}
                </span>
              </div>

              {status === "done" ? (
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
                    className="font-[family-name:var(--font-sans)] text-[#7A8B6F] text-xs uppercase text-center px-4"
                    style={{ letterSpacing: "0.2em" }}
                  >
                    {status === "queued"
                      ? "Awaiting render"
                      : status === "rendering"
                        ? "Rendering..."
                        : "Render failed"}
                  </p>
                </div>
              )}

              <p
                className="font-[family-name:var(--font-sans)] text-[#7A8B6F] text-xs mt-3 break-all"
                title={mp4Url}
              >
                {mp4Url}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
