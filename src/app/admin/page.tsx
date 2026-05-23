import Link from "next/link";
import { readState, readWeekDrafts } from "@/lib/wordlore-content";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  drafting: "Drafting",
  review: "Review",
  rendering: "Rendering",
  ready: "Ready to publish",
  publishing: "Publishing",
  published: "Published",
};

const STATUS_COLOR: Record<string, string> = {
  drafting: "text-[#7A8B6F]",
  review: "text-[#C9A961]",
  rendering: "text-[#C9A961]",
  ready: "text-[#C9A961]",
  publishing: "text-[#C9A961]",
  published: "text-[#7A8B6F]",
};

export default async function AdminHome() {
  const state = await readState();
  const week = state.weeks[state.currentWeek];
  const episodes = await readWeekDrafts(state.currentWeek);

  const renderProgress = Object.values(week.renders).filter(
    (r) => r === "done",
  ).length;

  return (
    <div className="space-y-12">
      <header>
        <p
          className="font-[family-name:var(--font-sans)] text-[#7A8B6F] text-xs uppercase mb-2"
          style={{ letterSpacing: "0.25em" }}
        >
          Current week
        </p>
        <h1
          className="font-[family-name:var(--font-serif)] text-[#C9A961] text-4xl mb-3"
          style={{ letterSpacing: "0.02em" }}
        >
          Week of {state.currentWeek}
        </h1>
        <p
          className={`font-[family-name:var(--font-sans)] uppercase text-sm ${STATUS_COLOR[week.status]}`}
          style={{ letterSpacing: "0.2em" }}
        >
          {STATUS_LABEL[week.status]}
        </p>
      </header>

      <section>
        <h2
          className="font-[family-name:var(--font-serif)] text-[#F4E8D0] text-xl mb-4"
          style={{ letterSpacing: "0.02em" }}
        >
          Episodes ({renderProgress}/{week.words.length} rendered)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {episodes.map((ep) => (
            <div
              key={ep.word}
              className="border border-[#C9A961]/30 rounded-lg p-5 bg-[#0F1A2E]/50 hover:border-[#C9A961]/60 transition"
            >
              <p
                className="font-[family-name:var(--font-sans)] text-[#7A8B6F] text-xs uppercase mb-2"
                style={{ letterSpacing: "0.2em" }}
              >
                {ep.origin.language}
              </p>
              <h3
                className="font-[family-name:var(--font-serif)] text-[#C9A961] text-2xl mb-3"
                style={{ letterSpacing: "0.02em" }}
              >
                {ep.word}
              </h3>
              <p className="font-[family-name:var(--font-serif-italic)] italic text-[#F4E8D0]/75 text-sm mb-3 leading-relaxed">
                &ldquo;{ep.hook}&rdquo;
              </p>
              <p
                className="font-[family-name:var(--font-sans)] text-xs uppercase"
                style={{ letterSpacing: "0.2em" }}
              >
                <span className="text-[#7A8B6F]">Payoff:&nbsp;</span>
                <span className="text-[#F4E8D0]/85">
                  {ep.payoff.revelation}
                </span>
              </p>
              <p
                className="font-[family-name:var(--font-sans)] text-xs uppercase mt-3"
                style={{ letterSpacing: "0.2em" }}
              >
                <span className="text-[#7A8B6F]">Render:&nbsp;</span>
                <span className={STATUS_COLOR[week.renders[ep.word.toLowerCase()] ?? "queued"]}>
                  {week.renders[ep.word.toLowerCase()] ?? "queued"}
                </span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/drafts"
          className="block border border-[#C9A961]/30 rounded-lg p-6 hover:border-[#C9A961] hover:bg-[#C9A961]/5 transition"
        >
          <p
            className="font-[family-name:var(--font-sans)] text-[#7A8B6F] text-xs uppercase mb-1"
            style={{ letterSpacing: "0.2em" }}
          >
            Step 1
          </p>
          <p className="font-[family-name:var(--font-serif)] text-[#F4E8D0] text-lg">
            Review the drafts
          </p>
        </Link>
        <Link
          href="/admin/render"
          className="block border border-[#C9A961]/30 rounded-lg p-6 hover:border-[#C9A961] hover:bg-[#C9A961]/5 transition"
        >
          <p
            className="font-[family-name:var(--font-sans)] text-[#7A8B6F] text-xs uppercase mb-1"
            style={{ letterSpacing: "0.2em" }}
          >
            Step 2
          </p>
          <p className="font-[family-name:var(--font-serif)] text-[#F4E8D0] text-lg">
            Render queue
          </p>
        </Link>
        <Link
          href="/admin/publish"
          className="block border border-[#C9A961]/30 rounded-lg p-6 hover:border-[#C9A961] hover:bg-[#C9A961]/5 transition"
        >
          <p
            className="font-[family-name:var(--font-sans)] text-[#7A8B6F] text-xs uppercase mb-1"
            style={{ letterSpacing: "0.2em" }}
          >
            Step 3
          </p>
          <p className="font-[family-name:var(--font-serif)] text-[#F4E8D0] text-lg">
            Captions and publish
          </p>
        </Link>
      </section>
    </div>
  );
}
