import { readState } from "@/lib/wordlore-content";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  drafting: "Drafting",
  review: "Review",
  rendering: "Rendering",
  ready: "Ready",
  publishing: "Publishing",
  published: "Published",
};

export default async function HistoryPage() {
  const state = await readState();
  const weeks = Object.entries(state.weeks).sort(([a], [b]) =>
    b.localeCompare(a),
  );

  return (
    <div className="space-y-10">
      <header>
        <h1
          className="font-[family-name:var(--font-serif)] text-accent text-3xl mb-2"
          style={{ letterSpacing: "0.02em" }}
        >
          History
        </h1>
        <p className="font-[family-name:var(--font-sans)] text-surface/60 text-sm">
          Read-only archive of past weeks.
        </p>
      </header>

      <div className="space-y-4">
        {weeks.map(([week, w]) => (
          <article
            key={week}
            className="border border-accent/20 rounded p-5 bg-background/40"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
              <h2
                className="font-[family-name:var(--font-serif)] text-accent text-xl"
                style={{ letterSpacing: "0.02em" }}
              >
                Week of {week}
                {week === state.currentWeek && (
                  <span
                    className="ml-3 font-[family-name:var(--font-sans)] text-secondary text-xs uppercase"
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
                {STATUS_LABEL[w.status]}
              </p>
            </div>
            <p className="font-[family-name:var(--font-sans)] text-surface/85 text-sm">
              {w.words.map((word) => word.toUpperCase()).join(" - ")}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
