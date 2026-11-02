import type { BandQuality } from "@/content/annotations";
import { evidenceRubric } from "@/content/annotations";
import { cellColor } from "./evidence-heatmap";

/* ============================================================
   EvidenceCeilings — how the rated codes fall across each
   dimension's scale, and where the scale runs out.

   The four means hide the finding. They all land near the middle
   of their scales and read as "middling across the board", when
   what the counts actually show is that three of the four scales
   are never reached at the top: nothing is Confirmed, almost
   nothing cites anything but the operator, nothing is
   corroborated across parties.

   So a level no code reached is drawn as an empty dashed slot
   rather than left out, and the bar visibly stops short of the
   end of its scale. Counting within a dimension only — the
   rubric forbids combining them, and these four bars are never
   summed or ranked against each other.

   Server component.
   ============================================================ */

const SCORED = ["v", "s", "p", "c"] as const;
type ScoredKey = (typeof SCORED)[number];

export function EvidenceCeilings({
  bands,
}: {
  bands: readonly BandQuality[];
}) {
  const entries = bands.flatMap((band) =>
    band.questions.flatMap((question) => question.entries),
  );
  if (entries.length === 0) return null;

  // Rubric order, so the figure and the rubric pulldown agree. `search` is
  // excluded: it rates codes that were NOT selected, on its own scale.
  const rows = evidenceRubric
    .filter((dim): dim is typeof dim & { key: ScoredKey } =>
      (SCORED as readonly string[]).includes(dim.key),
    )
    .map((dim) => ({
      dim,
      counts: dim.levels.map(
        (_, index) =>
          entries.filter((entry) => entry[dim.key] === dim.min + index).length,
      ),
    }));

  return (
    <figure className="mt-9 flex flex-col gap-7">
      {rows.map(({ dim, counts }) => (
        <div key={dim.key} className="flex flex-col gap-2.5">
          {/* The definition is a real line below the name, shown on hover, so
              the page carries none of this text until it is asked for. */}
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="rd-mono !text-[0.62rem] !font-bold uppercase tracking-wider">
              {dim.letter}
            </span>
            <span className="rd-tip peer text-sm font-medium">{dim.name}</span>
            <span className="hidden basis-full text-sm font-light leading-snug opacity-60 peer-hover:block">
              {dim.question} {dim.rule}
            </span>
          </div>

          {/* Widths are proportional to count; a level at 0 holds a fixed
              narrow slot so the scale still shows all its levels. */}
          <div className="flex h-8 w-full items-stretch gap-1">
            {counts.map((count, index) => {
              const tone = cellColor((index / (dim.levels.length - 1)) * 3);
              return (
                <span
                  key={dim.levels[index]}
                  className="flex min-w-0 items-center justify-center overflow-hidden"
                  style={{
                    flex: count === 0 ? "0 0 3.5rem" : `${count} 1 0%`,
                    background: tone.bg,
                    color: tone.fg,
                  }}
                  aria-label={`${dim.levels[index]}: ${count}`}
                >
                  <span className="rd-mono !text-[0.62rem] !font-bold tabular-nums">
                    {count}
                  </span>
                </span>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            {counts.map((count, index) => (
              <span
                key={dim.levels[index]}
                className="flex max-w-[20rem] flex-wrap items-center gap-x-1.5"
              >
                <span
                  aria-hidden
                  className="inline-block size-2.5"
                  style={{
                    background: cellColor((index / (dim.levels.length - 1)) * 3)
                      .bg,
                  }}
                />
                <span className="rd-tip peer text-sm font-light opacity-70">
                  {dim.levels[index]}
                </span>
                <span className="rd-mono !text-[0.62rem] tabular-nums opacity-55">
                  {count}
                </span>
                <span className="mt-0.5 hidden basis-full text-sm font-light leading-snug opacity-60 peer-hover:block">
                  {dim.levelNotes[index]}
                </span>
              </span>
            ))}
          </div>
        </div>
      ))}

    </figure>
  );
}
