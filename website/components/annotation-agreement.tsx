import type { Annotation } from "@/content/annotations";
import type { AgreementRow, AnnotationResults } from "@/lib/annotation-results";

/* ============================================================
   AnnotationAgreement — how consistently the three annotators
   coded each benchmark, overall and by codebook part.

   One small panel per benchmark rather than one colour per
   benchmark, so nothing depends on matching colours to a legend.
   Each row draws the chance level (what uniformly random answers
   would score on exactly the questions scored in that row) as a
   tick, observed agreement as a dot, and the line between them.
   This describes our coding process, not the benchmarks.
   ============================================================ */

const W = 340;
const ROW = 32;
const TOP = 10;
const LABEL_W = 100;
/** Room for the paper's value label, "0.88 (n = 21)". */
const VALUE_W = 92;

type Row = AgreementRow & { label: string; strong?: boolean };

function Panel({
  name,
  rows,
  lo,
}: {
  name: string;
  rows: Row[];
  lo: number;
}) {
  const plotLeft = LABEL_W;
  const plotRight = W - VALUE_W;
  const x = (v: number) => plotLeft + ((v - lo) / (1 - lo)) * (plotRight - plotLeft);
  const height = TOP + rows.length * ROW + 24;
  const ticks = [lo, (lo + 1) / 2, 1];

  return (
    <figure className="min-w-0">
      <figcaption className="text-base font-normal">{name}</figcaption>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="mt-2 h-auto w-full max-w-[25rem]"
        role="img"
        aria-label={`${name}: annotator agreement overall and by codebook part, against chance.`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={x(t)}
              x2={x(t)}
              y1={TOP - 4}
              y2={height - 20}
              stroke="currentColor"
              strokeOpacity={0.12}
            />
            <text
              x={x(t)}
              y={height - 6}
              textAnchor="middle"
              className="fill-current text-[11px] tabular-nums"
              opacity={0.55}
            >
              {t.toFixed(2)}
            </text>
          </g>
        ))}
        {rows.map((row, i) => {
          const y = TOP + i * ROW + ROW / 2;
          return (
            <g key={row.label}>
              <title>
                {`${row.label}: ${row.observed.toFixed(2)} observed, ${row.chance.toFixed(2)} by chance, over ${row.questions} question${row.questions === 1 ? "" : "s"}`}
              </title>
              <text
                x={0}
                y={y + 4}
                className={`fill-current text-[13px] ${row.strong ? "font-semibold" : ""}`}
              >
                {row.label}
              </text>
              <line
                x1={x(row.chance)}
                x2={x(row.observed)}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.28}
                strokeWidth={2}
              />
              <line
                x1={x(row.chance)}
                x2={x(row.chance)}
                y1={y - 7}
                y2={y + 7}
                stroke="currentColor"
                strokeOpacity={0.5}
                strokeWidth={2}
              />
              <circle
                cx={x(row.observed)}
                cy={y}
                r={5}
                className="fill-current"
                stroke="var(--rd-warm)"
                strokeWidth={2}
              />
              <text
                x={W}
                y={y + 4}
                textAnchor="end"
                className="fill-current text-[12.5px] tabular-nums"
              >
                {row.observed.toFixed(2)}
                <tspan opacity={0.55}>{` (n = ${row.questions})`}</tspan>
              </text>
              {i === 0 ? (
                <line
                  x1={0}
                  x2={W}
                  y1={TOP + ROW}
                  y2={TOP + ROW}
                  stroke="currentColor"
                  strokeOpacity={0.12}
                />
              ) : null}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

export function AnnotationAgreement({
  annotations,
  agreement,
}: {
  annotations: readonly Annotation[];
  agreement: AnnotationResults["agreement"];
}) {
  const panels = annotations.map((annotation) => {
    const rows: Row[] = [
      { label: "All questions", strong: true, ...agreement.overall[annotation.slug] },
      ...agreement.parts.map((part) => ({
        label: part.label,
        ...part.bySlug[annotation.slug],
      })),
    ];
    return { annotation, rows };
  });
  // Shared scale across panels; widened only if some value falls below 0.5.
  const min = Math.min(
    ...panels.flatMap(({ rows }) => rows.flatMap((r) => [r.observed, r.chance])),
  );
  const lo = Math.min(0.5, Math.floor(min * 10) / 10);

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-light opacity-80">
        <span className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <circle cx="6" cy="6" r="5" className="fill-current" />
          </svg>
          observed agreement
        </span>
        <span className="flex items-center gap-2">
          <svg width="4" height="14" viewBox="0 0 4 14" aria-hidden>
            <line x1="2" x2="2" y1="0" y2="14" stroke="currentColor" strokeOpacity={0.5} strokeWidth="2" />
          </svg>
          chance, if answers were random
        </span>
        <span className="flex items-center gap-2">
          <svg width="22" height="4" viewBox="0 0 22 4" aria-hidden>
            <line x1="0" x2="22" y1="2" y2="2" stroke="currentColor" strokeOpacity={0.28} strokeWidth="2" />
          </svg>
          distance above chance
        </span>
        <span className="opacity-70">n is the number of questions scored</span>
      </div>

      <div className="mt-8 grid gap-x-16 gap-y-10 md:grid-cols-2">
        {panels.map(({ annotation, rows }) => (
          <Panel key={annotation.slug} name={annotation.name} rows={rows} lo={lo} />
        ))}
      </div>
      <p className="mt-4 text-sm font-light opacity-60">
        Mean agreement over scored questions (majority share)
      </p>

      <details className="mt-8 text-sm">
        <summary className="cursor-pointer font-light opacity-70">
          Show as a table
        </summary>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[36rem] border-collapse text-left tabular-nums">
            <thead>
              <tr className="border-b border-black/15">
                {["Benchmark", "Part", "Observed", "Chance", "Questions"].map((h) => (
                  <th key={h} scope="col" className="py-2 pr-6 font-normal">
                    <span className="rd-mono !text-[0.6rem] opacity-60">{h}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {panels.flatMap(({ annotation, rows }) =>
                rows.map((row) => (
                  <tr key={`${annotation.slug}-${row.label}`} className="border-b border-black/10">
                    <td className="py-1.5 pr-6 font-light">{annotation.name}</td>
                    <td className="py-1.5 pr-6 font-light">{row.label}</td>
                    <td className="py-1.5 pr-6">{row.observed.toFixed(2)}</td>
                    <td className="py-1.5 pr-6">{row.chance.toFixed(2)}</td>
                    <td className="py-1.5 pr-6">{row.questions}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
