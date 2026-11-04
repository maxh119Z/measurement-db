import type { Tally } from "@/lib/annotation-results";

/** A square for one code: filled (2–3 of 3), dotted (1 of 3), empty (0).
 *
 *  Its own module so the curated comparison and the question explorer draw
 *  the same mark. Type-only import, so nothing from the results loader (which
 *  uses node:fs) reaches the client bundle. */
export function Square({ tally }: { tally: Tally | null }) {
  const k = tally?.k ?? 0;
  return (
    <span
      className={`relative block size-[22px] rounded-[3px] border-[1.5px] ${
        k >= 2
          ? "border-current bg-current"
          : k === 1
            ? "border-current"
            : "border-black/25"
      }`}
      aria-hidden
    >
      {k === 1 ? (
        <span className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
      ) : null}
    </span>
  );
}
