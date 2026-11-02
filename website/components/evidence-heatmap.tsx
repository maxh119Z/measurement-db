import { Fragment } from "react";
import type { BandQuality, QualityEntry } from "@/content/annotations";
import { evidenceRubric } from "@/content/annotations";

/* ============================================================
   EvidenceHeatmap — every question against the four evidence
   dimensions, as a coloured grid.

   The point of the grid is that a column can be scanned: run
   down V and you see, at once, how much of this benchmark is
   assertion rather than something an outsider could check.

   Colour runs purple (low) to teal (high) through a pale
   midpoint, so "uncheckable" and "checkable" read as opposite
   directions rather than as more or less of one thing. Every
   cell also prints its number, so the grid works in greyscale
   and for anyone who reads colour differently.

   Server component.
   ============================================================ */

const DIMS = [
  { key: "v", letter: "V", name: "Verifiability", floor: 1 },
  { key: "s", letter: "S", name: "Source independence", floor: 0 },
  { key: "p", letter: "P", name: "Precision and fit", floor: 0 },
  { key: "c", letter: "C", name: "Corroboration", floor: 0 },
] as const;

/** Dimension key -> the rubric's own definition, shown on hover. */
const DEFINITION: Record<string, string> = Object.fromEntries(
  evidenceRubric.map((dim) => [dim.key, `${dim.question} ${dim.rule}`]),
);

/** Diverging ramp over 0–3. Midpoint 1.5 is pale; below it goes purple, above
 *  it goes teal. Returns a background and a readable foreground.
 *
 *  Exported so the ceilings figure shades its level bands off the same ramp —
 *  purple and teal have to mean the same thing in both figures. */
export function cellColor(value: number): { bg: string; fg: string } {
  const t = Math.max(0, Math.min(1, value / 3));
  // distance from the pale midpoint, 0 at 1.5 and 1 at either end
  const d = Math.abs(t - 0.5) * 2;
  const strong = d > 0.55;
  if (t < 0.5) {
    return {
      bg: `color-mix(in oklab, #7A4FBF ${Math.round(d * 72)}%, #F4F1F7)`,
      fg: strong ? "#FFFFFF" : "inherit",
    };
  }
  return {
    bg: `color-mix(in oklab, #00917F ${Math.round(d * 72)}%, #EEF4F2)`,
    fg: strong ? "#FFFFFF" : "inherit",
  };
}

function mean(entries: readonly QualityEntry[], key: (typeof DIMS)[number]["key"]) {
  if (entries.length === 0) return null;
  return entries.reduce((sum, e) => sum + e[key], 0) / entries.length;
}

function Cell({
  value,
  strong = false,
}: {
  value: number | null;
  strong?: boolean;
}) {
  if (value === null) {
    return (
      <td className="h-9 border border-white/70 bg-black/[0.03] px-2 text-center align-middle">
        <span className="rd-mono !text-[0.6rem] opacity-30">&mdash;</span>
      </td>
    );
  }
  const { bg, fg } = cellColor(value);
  return (
    <td
      className="h-9 border border-white/70 px-2 text-center align-middle"
      style={{ background: bg, color: fg }}
    >
      <span
        className={`rd-mono !text-[0.68rem] tabular-nums ${strong ? "!font-bold" : ""}`}
      >
        {value.toFixed(2)}
      </span>
    </td>
  );
}

export function EvidenceHeatmap({ bands }: { bands: readonly BandQuality[] }) {
  const all = bands.flatMap((b) => b.questions.flatMap((q) => q.entries));
  if (all.length === 0) return null;

  return (
    <figure className="mt-8">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-left">
          <thead>
            <tr>
              <th className="w-px whitespace-nowrap pb-2 pr-5 align-bottom">
                <span className="rd-mono !text-[0.6rem] uppercase tracking-wider opacity-55">
                  Question
                </span>
              </th>
              {/* Equal widths, so the longest name does not win a wider
                  column. Definition on hover. */}
              {DIMS.map((dim) => (
                <th
                  key={dim.key}
                  scope="col"
                  className="w-28 pb-2 align-bottom text-center"
                >
                  <span className="rd-mono !text-[0.6rem] uppercase tracking-wider opacity-55">
                    {dim.letter}
                  </span>
                  <span className="rd-tip peer mt-1 block text-[0.7rem] font-light leading-tight opacity-55">
                    {dim.name}
                  </span>
                  {/* Fixed to the column width, so revealing it grows the
                      header row without widening the column. */}
                  <span className="mt-1 hidden w-28 text-left text-[0.68rem] font-light leading-snug opacity-60 peer-hover:block">
                    {DEFINITION[dim.key]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bands.map((band) => {
              const bandEntries = band.questions.flatMap((q) => q.entries);
              return (
                <Fragment key={band.id}>
                  {/* Band row. Uniform row height everywhere, so the label in
                      the first column lines up with its own coloured cells;
                      bands are set apart by weight and a rule, not by padding
                      that would shift the text off its row. */}
                  <tr className="border-t-2 border-white">
                    <th
                      scope="row"
                      className="h-9 w-px whitespace-nowrap pr-5 text-left align-middle font-normal"
                    >
                      <span className="rd-mono !text-[0.62rem] !font-bold uppercase tracking-wider">
                        {band.label}
                      </span>
                    </th>
                    {DIMS.map((dim) => (
                      <Cell
                        key={dim.key}
                        value={mean(bandEntries, dim.key)}
                        strong
                      />
                    ))}
                  </tr>
                  {band.questions.map((question) => (
                    <tr key={question.leaf}>
                      <th
                        scope="row"
                        className="relative h-9 w-px whitespace-nowrap pr-5 text-left align-middle text-sm font-light opacity-75"
                      >
                        {/* The row carries only the item's name; the full
                            question is on hover. Absolute, not in flow: a
                            growing row would throw the grid out of line. */}
                        <span className="rd-tip peer">
                          {question.question.split("—")[0].trim()}
                        </span>
                        <span className="absolute left-0 top-full z-10 hidden w-max max-w-md whitespace-normal border border-black/15 bg-white p-2.5 text-sm font-light leading-snug peer-hover:block">
                          {question.question}
                        </span>
                      </th>
                      {DIMS.map((dim) => (
                        <Cell
                          key={dim.key}
                          value={mean(question.entries, dim.key)}
                        />
                      ))}
                    </tr>
                  ))}
                </Fragment>
              );
            })}
            <tr className="border-t-2 border-white">
              <th
                scope="row"
                className="h-9 w-px whitespace-nowrap pr-5 text-left align-middle font-normal"
              >
                <span className="rd-mono !text-[0.62rem] !font-bold uppercase tracking-wider">
                  All codes
                </span>
              </th>
              {DIMS.map((dim) => (
                <Cell key={dim.key} value={mean(all, dim.key)} strong />
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <figcaption className="mt-5 flex flex-col gap-2.5">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-light">
          <span className="rd-mono !text-[0.6rem] uppercase tracking-wider opacity-55">
            Scale
          </span>
          <span className="flex items-center gap-1.5">
            {[0, 0.75, 1.5, 2.25, 3].map((v) => (
              <span
                key={v}
                className="inline-block size-4 border border-white/70"
                style={{ background: cellColor(v).bg }}
                aria-hidden
              />
            ))}
          </span>
          <span className="opacity-60">
            0 purple &rarr; 3 teal. Each cell is a mean across the annotators
            who rated that question.
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
