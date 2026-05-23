import {
  readState,
  readDraft,
  platformCaption,
  episodeTitle,
  type Episode,
  type WeekState,
} from "@/lib/wordlore-content";
import { CopyButton } from "./copy-button";

export const dynamic = "force-dynamic";

const PLATFORMS = [
  { id: "youtube" as const, label: "YouTube", studio: "https://studio.youtube.com/" },
  { id: "tiktok" as const, label: "TikTok", studio: "https://www.tiktok.com/upload" },
  { id: "instagram" as const, label: "Instagram", studio: "https://www.instagram.com/" },
  { id: "facebook" as const, label: "Facebook", studio: "https://www.facebook.com/" },
  { id: "x" as const, label: "X", studio: "https://x.com/compose/post" },
];

type WeekBundle = {
  key: string;
  week: WeekState;
  episodes: Episode[];
};

export default async function PublishPage() {
  const state = await readState();
  const weekKeys = Object.keys(state.weeks)
    .filter((k) => state.weeks[k].status !== "published")
    .sort((a, b) => b.localeCompare(a));

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
    <div className="space-y-16">
      <header>
        <h1
          className="font-[family-name:var(--font-serif)] text-[#C9A961] text-3xl mb-2"
          style={{ letterSpacing: "0.02em" }}
        >
          Captions and publish
        </h1>
        <p className="font-[family-name:var(--font-sans)] text-[#F4E8D0]/60 text-sm max-w-prose">
          Captions are generated from each episode&apos;s JSON. Copy a caption,
          click the studio link, upload the MP4 from{" "}
          <code className="text-[#C9A961]">E:\Wordlore\episodes\</code>, paste
          the title + caption, publish. The mark-as-published toggle ships in
          Phase 4.
        </p>
      </header>

      {bundles.length === 0 && (
        <p className="font-[family-name:var(--font-sans)] text-[#7A8B6F] text-sm">
          Nothing in the publish queue. Drafts in earlier phases will show up
          here as soon as their week status leaves &ldquo;drafting.&rdquo;
        </p>
      )}

      {bundles.map((b) => (
        <section key={b.key} className="space-y-8">
          <header className="border-b border-[#C9A961]/20 pb-3 flex flex-wrap items-baseline justify-between gap-3">
            <h2
              className="font-[family-name:var(--font-serif)] text-[#F4E8D0] text-2xl"
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
              {b.week.status}
            </p>
          </header>

          <div className="space-y-10">
            {b.episodes.map((ep) => {
              const title = episodeTitle(ep);
              const slug = ep.word.toLowerCase();
              const renderStatus = b.week.renders[slug] ?? "queued";
              const mp4Filename = b.week.renderDate
                ? `${slug}-${b.week.renderDate}.mp4`
                : null;

              return (
                <article
                  key={ep.word}
                  className="border border-[#C9A961]/25 rounded-lg p-6 bg-[#0F1A2E]/40"
                >
                  <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
                    <div>
                      <h3
                        className="font-[family-name:var(--font-serif)] text-[#C9A961] text-2xl"
                        style={{ letterSpacing: "0.02em" }}
                      >
                        {ep.word}
                      </h3>
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <p className="font-[family-name:var(--font-sans)] text-[#F4E8D0]/85 text-sm">
                          {title}
                        </p>
                        <CopyButton label="Copy title" value={title} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="font-[family-name:var(--font-sans)] text-[#7A8B6F] text-[10px] uppercase mb-1"
                        style={{ letterSpacing: "0.2em" }}
                      >
                        Render
                      </p>
                      <p
                        className={`font-[family-name:var(--font-sans)] text-xs uppercase ${
                          renderStatus === "done"
                            ? "text-[#C9A961]"
                            : renderStatus === "failed"
                              ? "text-[#8B2635]"
                              : "text-[#7A8B6F]"
                        }`}
                        style={{ letterSpacing: "0.2em" }}
                      >
                        {renderStatus}
                      </p>
                      {mp4Filename && renderStatus === "done" && (
                        <p
                          className="font-[family-name:var(--font-sans)] text-[#7A8B6F] text-[10px] mt-1"
                          title={mp4Filename}
                        >
                          {mp4Filename}
                        </p>
                      )}
                    </div>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {PLATFORMS.map((p) => {
                      const caption = platformCaption(ep, p.id);
                      return (
                        <div
                          key={p.id}
                          className="border border-[#C9A961]/15 rounded p-4 bg-[#0F1A2E]/60"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <p
                              className="font-[family-name:var(--font-sans)] text-[#C9A961] text-xs uppercase"
                              style={{ letterSpacing: "0.2em" }}
                            >
                              {p.label}
                            </p>
                            <div className="flex items-center gap-3">
                              <a
                                href={p.studio}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-[family-name:var(--font-sans)] text-[#F4E8D0]/60 hover:text-[#C9A961] text-xs uppercase"
                                style={{ letterSpacing: "0.15em" }}
                              >
                                Studio &rarr;
                              </a>
                              <CopyButton label="Copy" value={caption} />
                            </div>
                          </div>
                          <pre className="whitespace-pre-wrap text-[#F4E8D0]/85 text-xs leading-relaxed font-[family-name:var(--font-sans)]">
                            {caption}
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
