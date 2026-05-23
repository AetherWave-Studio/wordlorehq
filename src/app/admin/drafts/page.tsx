import {
  readState,
  readDraft,
  type Episode,
  type WeekState,
} from "@/lib/wordlore-content";

export const dynamic = "force-dynamic";

type WeekBundle = {
  key: string;
  week: WeekState;
  episodes: Episode[];
};

export default async function DraftsPage() {
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
          Drafts
        </h1>
        <p className="font-[family-name:var(--font-sans)] text-[#F4E8D0]/60 text-sm max-w-prose">
          Read-only for now. Form editor and commit-back ship in Phase 2. For
          each chunk, the word count is shown on the left; sage means it&apos;s
          inside the 12-17 word target band, oxblood means it&apos;s outside.
        </p>
      </header>

      {bundles.length === 0 && (
        <p className="font-[family-name:var(--font-sans)] text-[#7A8B6F] text-sm">
          No drafts in play. All current weeks have been published.
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
            {b.episodes.map((ep) => (
              <article
                key={ep.word}
                className="border border-[#C9A961]/25 rounded-lg p-6 bg-[#0F1A2E]/40"
              >
                <header className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
                  <div>
                    <h3
                      className="font-[family-name:var(--font-serif)] text-[#C9A961] text-3xl"
                      style={{ letterSpacing: "0.02em" }}
                    >
                      {ep.word}
                    </h3>
                    <p
                      className="font-[family-name:var(--font-sans)] text-[#7A8B6F] text-xs uppercase mt-1"
                      style={{ letterSpacing: "0.2em" }}
                    >
                      {ep.pronunciation} &middot; {ep.partOfSpeech} &middot;{" "}
                      {ep.origin.language}, {ep.origin.era}
                    </p>
                  </div>
                  <p
                    className="font-[family-name:var(--font-sans)] text-xs uppercase text-[#7A8B6F]"
                    style={{ letterSpacing: "0.2em" }}
                  >
                    Next:{" "}
                    <span className="text-[#C9A961]">{ep.outro.nextWord}</span>
                  </p>
                </header>

                <section className="space-y-5">
                  <Field label="Definition" value={ep.definition} />
                  <Field label="Hook" value={ep.hook} italic />
                  <Field label="Modern anchor" value={ep.modernAnchor} />
                  <Field
                    label="Origin word"
                    value={`${ep.origin.originalWord} - "${ep.origin.originalMeaning}"`}
                    italic
                  />
                  <div>
                    <Label>Journey ({ep.journey.length} chunks)</Label>
                    <ol className="space-y-3 mt-2">
                      {ep.journey.map((chunk, i) => {
                        const words = chunk.trim().split(/\s+/).length;
                        const ok = words >= 12 && words <= 17;
                        return (
                          <li
                            key={i}
                            className="flex gap-4 items-start text-[#F4E8D0]/85 text-sm leading-relaxed"
                          >
                            <span
                              className={`font-[family-name:var(--font-sans)] text-xs uppercase shrink-0 mt-0.5 ${
                                ok ? "text-[#7A8B6F]" : "text-[#8B2635]"
                              }`}
                              style={{ letterSpacing: "0.15em" }}
                              title={
                                ok
                                  ? "Within 12-17 word range"
                                  : "Outside 12-17 word range"
                              }
                            >
                              {i + 1} &middot; {words}w
                            </span>
                            <span>{chunk}</span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                  <div>
                    <Label>Payoff</Label>
                    <p className="mt-2 text-sm">
                      <span className="text-[#F4E8D0]/70">your </span>
                      <span className="text-[#C9A961] font-[family-name:var(--font-serif)]">
                        {ep.payoff.setupWord}
                      </span>
                      <span className="text-[#F4E8D0]/70 font-[family-name:var(--font-serif-italic)] italic">
                        {" "}
                        {ep.payoff.connector}{" "}
                      </span>
                      <span className="text-[#8B2635] font-[family-name:var(--font-serif)] font-bold tracking-wide">
                        {ep.payoff.revelation}
                      </span>
                    </p>
                  </div>
                </section>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-[family-name:var(--font-sans)] text-[#7A8B6F] text-xs uppercase"
      style={{ letterSpacing: "0.2em" }}
    >
      {children}
    </p>
  );
}

function Field({
  label,
  value,
  italic = false,
}: {
  label: string;
  value: string;
  italic?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <p
        className={`mt-1.5 text-[#F4E8D0]/85 text-sm leading-relaxed ${
          italic ? "font-[family-name:var(--font-serif-italic)] italic" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
