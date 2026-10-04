import type { State } from "./index";

/**
 * Decide what recording a finished render changes in state.json.
 *
 * Split out from the render script's file I/O so the decisions can be
 * exercised without a twenty-minute Remotion run. The script keeps the parts
 * that need the disk - confirming the MP4 is really there and big enough, and
 * reading the write back - and this holds the parts that are easy to get
 * quietly wrong.
 *
 * Returns the week it recorded against plus any warnings worth printing.
 * Mutates `state`; the caller owns serialising it.
 */
export function applyEpisodeRecord(
  state: State,
  opts: { contentKey: string; coverMs: number; renderDate: string },
): { week: string | null; warnings: string[] } {
  const { contentKey, coverMs, renderDate } = opts;
  const warnings: string[] = [];

  /* The week that actually contains this word, not currentWeek. A backlog
     re-render targets an older week - routine-prompt.md step 6b re-renders up
     to four `missing` episodes from earlier weeks - and recording it against
     currentWeek would both lie about the current week and leave the backlog
     week still broken. */
  const week =
    Object.keys(state.weeks ?? {}).find((w) =>
      state.weeks[w].words?.some((word) => word.toLowerCase() === contentKey),
    ) ?? state.currentWeek;

  const weekState = state.weeks?.[week];
  if (!weekState) return { week: null, warnings };

  /* renderDate is one value for the whole week, and episodeVideoFile builds
     every filename in it from that one date. Moving it after siblings are
     already `done` re-dates their filenames too, and reconcileRenders will
     read them as `missing`. That is correct when a whole week is re-rendered
     and a bug when a run straddles midnight, so name the affected siblings
     rather than deciding silently. */
  if (weekState.renderDate && weekState.renderDate !== renderDate) {
    const stranded = Object.entries(weekState.renders ?? {})
      .filter(([word, status]) => status === "done" && word !== contentKey)
      .map(([word]) => word);
    if (stranded.length) {
      warnings.push(
        `${week} renderDate ${weekState.renderDate} -> ${renderDate}; ` +
          `${stranded.join(", ")} were rendered under the old date and will ` +
          `read as missing until re-rendered`,
      );
    }
  }

  weekState.renderDate = renderDate;
  weekState.renders = { ...(weekState.renders ?? {}), [contentKey]: "done" };
  weekState.covers = { ...(weekState.covers ?? {}), [contentKey]: coverMs };

  return { week, warnings };
}
