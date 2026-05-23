import {
  readState,
  readWeekDrafts,
  platformCaption,
  episodeTitle,
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

export default async function PublishPage() {
  const state = await readState();
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
          Captions and publish
        </h1>
        <p className="font-[family-name:var(--font-sans)] text-[#F4E8D0]/60 text-sm max-w-prose">
          Generated from the episode JSON. Copy a caption, click the studio
          link, upload the MP4 from <code className="text-[#C9A961]">E:\Wordlore\episodes\</code>,
          paste the title + caption, publish. The mark-as-published toggle ships
          in Phase 4.
        </p>
      </header>

      <div className="space-y-12">
        {episodes.map((ep) => {
          const title = episodeTitle(ep);
          return (
            <article
              key={ep.word}
              className="border border-[#C9A961]/25 rounded-lg p-6 bg-[#0F1A2E]/40"
            >
              <header className="mb-6">
                <h2
                  className="font-[family-name:var(--font-serif)] text-[#C9A961] text-2xl"
                  style={{ letterSpacing: "0.02em" }}
                >
                  {ep.word}
                </h2>
                <div className="mt-3 flex items-center gap-3">
                  <p className="font-[family-name:var(--font-sans)] text-[#F4E8D0]/85 text-sm">
                    {title}
                  </p>
                  <CopyButton label="Copy title" value={title} />
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
    </div>
  );
}
