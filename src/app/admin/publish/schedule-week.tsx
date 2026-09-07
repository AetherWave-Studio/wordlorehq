"use client";

import { useState } from "react";

type SlotResult = {
  episode: string;
  platform: string;
  scheduledFor: string;
  status: string;
  /** The handle this slot would post as. The whole point of the preview. */
  postingAs?: string;
  reason?: string;
  error?: string;
};

type Account = { id: string; username: string | null; name: string | null };

type ScheduleResponse = {
  counts?: Record<string, number>;
  results?: SlotResult[];
  /** Which account each platform resolved to, before anything is posted. */
  postingAs?: Record<string, Account>;
  error?: string;
  connected?: string[];
};

/**
 * Two-step schedule control: preview, then commit.
 *
 * The preview is not politeness. Committing posts every episode to every
 * connected platform at a computed time, and the failure mode of getting the
 * week or the cadence wrong is twenty videos going out on the wrong days. So
 * the first click is always a dry run, and the commit button does not exist
 * until you have seen what it would do.
 */
export function ScheduleWeek({ week, episodeCount }: { week: string; episodeCount: number }) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<ScheduleResponse | null>(null);
  const [committed, setCommitted] = useState<ScheduleResponse | null>(null);

  async function call(dryRun: boolean) {
    setBusy(true);
    try {
      const res = await fetch("/api/schedule-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week, dryRun }),
      });
      const data: ScheduleResponse = await res.json();
      if (dryRun) setPreview(data);
      else setCommitted(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      const failure = { error: message };
      if (dryRun) setPreview(failure);
      else setCommitted(failure);
    } finally {
      setBusy(false);
    }
  }

  const shown = committed ?? preview;
  const isDryRun = !committed && !!preview;

  return (
    <div className="mt-4 border border-accent/25 rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => call(true)}
          disabled={busy}
          className="font-[family-name:var(--font-sans)] text-xs uppercase border border-accent/40 text-accent px-4 py-2 rounded hover:bg-accent/10 disabled:opacity-40"
          style={{ letterSpacing: "0.15em" }}
        >
          {busy && !committed ? "Checking..." : "Preview schedule"}
        </button>

        {isDryRun && !shown?.error && (
          <button
            onClick={() => call(false)}
            disabled={busy}
            className="font-[family-name:var(--font-sans)] text-xs uppercase bg-accent text-background px-4 py-2 rounded hover:brightness-110 disabled:opacity-40"
            style={{ letterSpacing: "0.15em" }}
          >
            {busy ? "Scheduling..." : `Schedule ${episodeCount} episodes`}
          </button>
        )}

        <span
          className="font-[family-name:var(--font-sans)] text-secondary text-xs"
          style={{ letterSpacing: "0.1em" }}
        >
          {committed ? "Sent to the platforms" : "Preview first - this posts for real"}
        </span>
      </div>

      {shown?.error && (
        <p className="mt-3 font-[family-name:var(--font-sans)] text-payoff text-sm">
          {shown.error}
          {shown.connected && (
            <span className="text-surface/60"> (connected: {shown.connected.join(", ") || "none"})</span>
          )}
        </p>
      )}

      {shown?.postingAs && (
        <div className="mt-4">
          <p
            className="font-[family-name:var(--font-sans)] text-secondary text-[10px] uppercase mb-1"
            style={{ letterSpacing: "0.2em" }}
          >
            Posting as
          </p>
          <p className="font-[family-name:var(--font-sans)] text-surface/80 text-xs">
            {Object.entries(shown.postingAs).map(([platform, a], i) => (
              <span key={platform}>
                {i > 0 && <span className="text-surface/30"> &middot; </span>}
                <span className="text-secondary">{platform}</span>{" "}
                <span className="text-accent">
                  {a.username ? `@${a.username}` : a.name || a.id}
                </span>
              </span>
            ))}
          </p>
          <p className="mt-2 font-[family-name:var(--font-sans)] text-surface/50 text-[11px]">
            Check these are the channel&apos;s own accounts before confirming.
            They come from whichever Blotato workspace the API key belongs to,
            which is not necessarily this channel&apos;s.
          </p>
        </div>
      )}

      {shown?.counts && (
        <p className="mt-3 font-[family-name:var(--font-sans)] text-surface/70 text-xs uppercase" style={{ letterSpacing: "0.15em" }}>
          {Object.entries(shown.counts).map(([k, v]) => `${v} ${k}`).join(" · ")}
        </p>
      )}

      {shown?.results && shown.results.length > 0 && (
        <div className="mt-3 max-h-72 overflow-y-auto">
          <table className="w-full font-[family-name:var(--font-sans)] text-xs">
            <tbody>
              {shown.results.map((r, i) => (
                <tr key={`${r.episode}-${r.platform}-${i}`} className="border-b border-accent/10">
                  <td className="py-1 pr-3 text-accent uppercase">{r.episode}</td>
                  <td className="py-1 pr-3 text-surface/70">
                    {r.platform}
                    {r.postingAs && (
                      <span className="text-surface/40"> @{r.postingAs}</span>
                    )}
                  </td>
                  <td className="py-1 pr-3 text-surface/50">
                    {new Date(r.scheduledFor).toLocaleString("en-US", {
                      weekday: "short", month: "short", day: "numeric",
                      hour: "numeric", minute: "2-digit",
                    })}
                  </td>
                  <td className={`py-1 ${r.status === "failed" ? "text-payoff" : "text-secondary"}`}>
                    {r.status}
                    {r.reason ? ` - ${r.reason}` : ""}
                    {r.error ? ` - ${r.error}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
