import type { Route } from "next";
import Link from "next/link";
import { ScrollReveal } from "@/components/scroll-reveal";
import {
  comparisonQuestions,
  durabilityFacts,
  type ComparisonQuestion,
} from "@/content/annotation-comparisons";
import {
  annotationStatusLabel,
  type Annotation,
} from "@/content/annotations";
import type {
  AnnotationResults,
  QuestionTallies,
  Tally,
} from "@/lib/annotation-results";

/* ============================================================
   AnnotationComparisons — one codebook question per part, every
   benchmark side by side as a card linking to its full record.

   Each allowed code is a square, in codebook order on every card
   so the eye compares like with like: filled when two or three of
   the three annotators selected it, a dot when only one did, empty
   when none did. Splits (1 or 2 of 3) are printed under the label
   rather than rounded away. Codes recording that no evidence was
   located sit apart, after a rule, so a gap never reads as a
   finding of absence. Nothing is counted, summed or ranked.
   ============================================================ */

const MONO = { fontFamily: "var(--rd-mono)" } as const;

function tallies(results: AnnotationResults, variable: string): QuestionTallies {
  const found = results.questions[variable.trim().toLowerCase()];
  if (!found) throw new Error(`content/results has no question "${variable}"`);
  return found;
}

function shortLabel(labels: Record<string, string>, code: string, variable: string) {
  const key = Object.keys(labels).find(
    (k) => k.toLowerCase() === code.toLowerCase(),
  );
  if (!key)
    throw new Error(
      `annotation-comparisons.ts: no short label for "${code}" (${variable})`,
    );
  return labels[key];
}

function tallyText(tally: Tally | null): string {
  if (!tally) return "not asked";
  return `${tally.k} of ${tally.n} annotators`;
}

/** A square for one code: filled (2–3 of 3), dotted (1 of 3), empty (0). */
function Square({ tally }: { tally: Tally | null }) {
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

function Strip({
  config,
  question,
  slug,
}: {
  config: ComparisonQuestion;
  question: QuestionTallies;
  slug: string;
}) {
  const notLocated = new Set(
    (config.notLocated ?? []).map((code) => code.toLowerCase()),
  );
  // Codebook order, with the not-located codes moved to the end.
  const options = [
    ...question.options.filter((o) => !notLocated.has(o.code.toLowerCase())),
    ...question.options.filter((o) => notLocated.has(o.code.toLowerCase())),
  ];
  const firstGap = options.findIndex((o) => notLocated.has(o.code.toLowerCase()));

  return (
    <ul
      className="grid gap-x-1.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option, index) => {
        const tally = option.bySlug[slug] ?? null;
        const label = shortLabel(config.labels, option.code, config.variable);
        const gap = notLocated.has(option.code.toLowerCase());
        const split = tally && tally.k > 0 && tally.k < tally.n;
        return (
          <li
            key={option.code}
            title={`${option.code}: ${tallyText(tally)}`}
            className={`flex flex-col items-center gap-1.5 text-center ${
              index === firstGap ? "border-l border-black/15 pl-1.5" : ""
            }`}
          >
            <Square tally={tally} />
            <span
              className={`text-[0.62rem] leading-tight opacity-80 ${gap ? "italic" : ""}`}
              style={MONO}
            >
              {label}
            </span>
            {split ? (
              <span className="text-[0.58rem] tabular-nums opacity-50" style={MONO}>
                {tally.k}/{tally.n}
              </span>
            ) : null}
            <span className="sr-only">{tallyText(tally)}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Majority answers for one of the Durability context lines. */
function Fact({
  label,
  variable,
  labels,
  results,
  slug,
}: (typeof durabilityFacts)[number] & { results: AnnotationResults; slug: string }) {
  const picked = tallies(results, variable).options.flatMap((o) => {
    const t = o.bySlug[slug];
    return t && t.k * 2 > t.n ? [{ text: shortLabel(labels, o.code, variable), t }] : [];
  });
  return (
    <>
      <dt className="rd-mono !text-[0.58rem] pt-0.5 opacity-50">{label}</dt>
      <dd className="text-sm font-light">
        {picked.length === 0 ? (
          <span className="opacity-50">no majority</span>
        ) : (
          picked.map(({ text, t }, i) => (
            <span key={text}>
              {text}
              {t.k < t.n ? (
                <span className="ml-1 text-[0.6rem] tabular-nums opacity-50" style={MONO}>
                  {t.k}/{t.n}
                </span>
              ) : null}
              {i < picked.length - 1 ? ", " : ""}
            </span>
          ))
        )}
      </dd>
    </>
  );
}

function cutoffLabel(cutoff: string | null): string | null {
  if (!cutoff) return null;
  const date = new Date(`${cutoff}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return cutoff;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-light opacity-80">
      <span className="flex items-center gap-2">
        <Square tally={{ k: 3, n: 3 }} /> two or three of three annotators
      </span>
      <span className="flex items-center gap-2">
        <Square tally={{ k: 1, n: 3 }} /> one annotator
      </span>
      <span className="flex items-center gap-2">
        <Square tally={{ k: 0, n: 3 }} /> none
      </span>
      <span className="flex items-center gap-2">
        <span className="text-[0.62rem] tabular-nums opacity-60" style={MONO}>
          2/3
        </span>
        a split, shown rather than rounded
      </span>
      <span className="flex items-center gap-2">
        <span className="h-5 border-l border-black/25" aria-hidden />
        <span className="italic">after the rule:</span> no evidence located, which
        is not evidence of absence
      </span>
    </div>
  );
}

export function AnnotationComparisons({
  annotations,
  results,
}: {
  annotations: readonly Annotation[];
  results: AnnotationResults;
}) {
  return (
    <div className="mt-10">
      <Legend />
      {comparisonQuestions.map((config) => {
        const question = tallies(results, config.variable);
        const lead = config.part === 1;
        return (
          <div key={config.variable} className="mt-14">
            <p className="rd-mono opacity-60">
              {config.part} · {config.partLabel}
            </p>
            <h3 className="rd-h3 mt-3">{config.title}</h3>
            <p className="rd-prose-wide mt-3 text-sm font-light leading-relaxed opacity-70">
              {config.why}
            </p>
            <p className="rd-prose-wide mt-1.5 text-xs font-light italic opacity-50">
              Codebook question: &ldquo;{question.question}&rdquo;
            </p>

            <ScrollReveal stagger>
              <ul className="mt-6 grid gap-5 sm:grid-cols-2">
                {annotations.map((annotation) => {
                  const eyebrow = [annotation.operator, annotation.domain]
                    .filter(Boolean)
                    .join(" · ");
                  const cutoff = cutoffLabel(annotation.cutoff);
                  return (
                    <li key={annotation.slug} className="reveal">
                      <Link
                        href={`/annotations/${annotation.slug}` as Route}
                        className="rd-card h-full gap-4"
                      >
                        {lead && eyebrow ? (
                          <span className="rd-mono !text-[0.62rem] opacity-55">
                            {eyebrow}
                          </span>
                        ) : null}
                        <span className={lead ? "rd-h3" : "text-xl font-light"}>
                          {annotation.name}
                        </span>
                        <Strip
                          config={config}
                          question={question}
                          slug={annotation.slug}
                        />
                        {lead ? (
                          <>
                            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                              {durabilityFacts.map((fact) => (
                                <Fact
                                  key={fact.variable}
                                  {...fact}
                                  results={results}
                                  slug={annotation.slug}
                                />
                              ))}
                            </dl>
                            <span className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                              <span className="rd-chip">
                                {annotationStatusLabel[annotation.status]}
                              </span>
                              {cutoff ? (
                                <span className="rd-mono !text-[0.58rem] opacity-50">
                                  Evidence to {cutoff}
                                </span>
                              ) : null}
                            </span>
                          </>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </ScrollReveal>
          </div>
        );
      })}
    </div>
  );
}
