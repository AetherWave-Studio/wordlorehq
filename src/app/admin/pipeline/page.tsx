import { readPipeline } from "@/lib/wordlore-content";

export const dynamic = "force-dynamic";

const TIER_LABEL: Record<number, string> = {
  1: "Tier 1 - visceral",
  2: "Tier 2 - historical",
  3: "Tier 3 - mythological",
  4: "Tier 4 - surprise",
};

export default async function PipelinePage() {
  const pipeline = await readPipeline();
  const byTier = pipeline.available.reduce(
    (acc, w) => {
      (acc[w.tier] ??= []).push(w);
      return acc;
    },
    {} as Record<number, typeof pipeline.available>,
  );
  const tiers = Object.keys(byTier)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-12">
      <header>
        <h1
          className="font-[family-name:var(--font-serif)] text-accent text-3xl mb-2"
          style={{ letterSpacing: "0.02em" }}
        >
          Word pipeline
        </h1>
        <p className="font-[family-name:var(--font-sans)] text-surface/60 text-sm max-w-prose">
          {pipeline.available.length} candidates ready. {pipeline.used.length}{" "}
          already produced. Reordering, marking as used, and adding new words
          ships in Phase 5.
        </p>
      </header>

      <section>
        <h2
          className="font-[family-name:var(--font-serif)] text-surface text-xl mb-4"
          style={{ letterSpacing: "0.02em" }}
        >
          Available
        </h2>
        <div className="space-y-8">
          {tiers.map((tier) => (
            <div key={tier}>
              <p
                className="font-[family-name:var(--font-sans)] text-secondary text-xs uppercase mb-3"
                style={{ letterSpacing: "0.2em" }}
              >
                {TIER_LABEL[tier]}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {byTier[tier].map((w) => (
                  <div
                    key={w.word}
                    className="border border-accent/20 rounded p-4 bg-background/40"
                  >
                    <p
                      className="font-[family-name:var(--font-serif)] text-accent text-lg"
                      style={{ letterSpacing: "0.02em" }}
                    >
                      {w.word}
                    </p>
                    <p
                      className="font-[family-name:var(--font-sans)] text-secondary text-xs uppercase mt-1"
                      style={{ letterSpacing: "0.15em" }}
                    >
                      {w.language}
                    </p>
                    <p className="font-[family-name:var(--font-serif-italic)] italic text-surface/75 text-sm mt-2">
                      {w.payoff}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2
          className="font-[family-name:var(--font-serif)] text-surface text-xl mb-4"
          style={{ letterSpacing: "0.02em" }}
        >
          Used
        </h2>
        <div className="border border-accent/20 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-accent/20">
              <tr>
                <th
                  className="text-left px-4 py-3 font-[family-name:var(--font-sans)] text-secondary text-xs uppercase"
                  style={{ letterSpacing: "0.2em" }}
                >
                  Word
                </th>
                <th
                  className="text-left px-4 py-3 font-[family-name:var(--font-sans)] text-secondary text-xs uppercase"
                  style={{ letterSpacing: "0.2em" }}
                >
                  Week
                </th>
                <th
                  className="text-left px-4 py-3 font-[family-name:var(--font-sans)] text-secondary text-xs uppercase"
                  style={{ letterSpacing: "0.2em" }}
                >
                  Drafted
                </th>
              </tr>
            </thead>
            <tbody>
              {pipeline.used.map((u) => (
                <tr key={u.word} className="border-t border-accent/10">
                  <td className="px-4 py-3 text-accent font-[family-name:var(--font-serif)]">
                    {u.word}
                  </td>
                  <td className="px-4 py-3 text-surface/75">{u.week}</td>
                  <td className="px-4 py-3 text-surface/75">{u.drafted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
