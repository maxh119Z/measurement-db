import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { AnnotationAgreement } from "@/components/annotation-agreement";
import { AnnotationComparisons } from "@/components/annotation-comparison";
import {
  AnnotationExplorer,
  type ExplorerQuestion,
} from "@/components/annotation-explorer";
import { PageHero } from "@/components/page-hero";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SectionHeading } from "@/components/section-heading";
import { comparisonQuestions } from "@/content/annotation-comparisons";
import {
  annotationStatusLabel,
  annotations,
  codeDefinition,
} from "@/content/annotations";
import { loadAnnotationResults } from "@/lib/annotation-results";

/** "2026-10-18" -> "Oct 18, 2026". */
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

const description =
  "Private benchmarks withhold the information outsiders would ordinarily use to scrutinize them. These records code what each benchmark hides, and what public evidence remains for checking its validity, integrity and neutrality claims.";

export const metadata: Metadata = {
  title: "Benchmark annotations | AIMS",
  description,
  alternates: { canonical: "/measurement-db/annotations" },
  openGraph: {
    title: "Benchmark annotations",
    description,
    url: "/measurement-db/annotations",
  },
  twitter: {
    card: "summary_large_image",
    title: "Benchmark annotations",
    description,
  },
};

/** A code that records no evidence was located, rather than a finding. The
 *  curated comparisons name these per question; the explorer covers all 21,
 *  so it matches on the codebook's own phrasing instead. */
const isGap = (code: string) =>
  /^(not reported|none documented|unclear)$/i.test(code.trim()) ||
  /\bno\b.*\b(located|documented)\b/i.test(code) ||
  /\bnot located\b/i.test(code);

export default async function AnnotationsIndexPage() {
  // Read from content/results at build time; the page prerenders.
  const results = await loadAnnotationResults();

  // Flattened for the explorer, which is a client component: it gets plain
  // data so neither the results loader nor the annotations dataset is bundled.
  const partLabels = new Map(
    comparisonQuestions.map((q) => [q.part, q.partLabel]),
  );
  const explorerQuestions: ExplorerQuestion[] = Object.entries(results.questions)
    .map(([key, q]) => ({
      key,
      variable: q.variable,
      question: q.question,
      part: q.part,
      partLabel: partLabels.get(q.part) ?? `Part ${q.part}`,
      options: q.options.map((option) => ({
        code: option.code,
        definition: codeDefinition(option.code) ?? null,
        gap: isGap(option.code),
        bySlug: option.bySlug,
      })),
    }))
    .sort((a, b) => a.part - b.part || a.variable.localeCompare(b.variable));

  const explorerBenchmarks = annotations.map((a) => ({
    slug: a.slug,
    name: a.name,
    href: `/annotations/${a.slug}`,
  }));

  return (
    <main id="main-content">
      <PageHero
        eyebrow="Measurement Data Bank"
        title="Benchmark annotations"
        description={description}
      />

      {/* ------------------------------------------------------- the records */}
      <section className="rd-white-band rd-band">
        <div className="rd-container">
          <SectionHeading
            eyebrow={`${annotations.length} benchmarks`}
            title="Benchmarks"
            description="Each benchmark is coded against a shared codebook and tied to evidence available at a frozen cutoff."
          />

          <ScrollReveal stagger>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2">
              {annotations.map((annotation) => {
                const eyebrow = [annotation.operator, annotation.domain]
                  .filter(Boolean)
                  .join(" · ");
                const cutoff = cutoffLabel(annotation.cutoff);
                return (
                  <li key={annotation.slug} className="reveal">
                    <Link
                      href={`/annotations/${annotation.slug}` as Route}
                      className="rd-card h-full gap-3"
                    >
                      {eyebrow ? (
                        <span className="rd-mono !text-[0.62rem] opacity-55">
                          {eyebrow}
                        </span>
                      ) : null}
                      <span className="rd-h3">{annotation.name}</span>
                      {annotation.hidden.length > 0 ? (
                        <span className="text-sm font-light leading-snug opacity-70">
                          Hidden: {annotation.hidden.join(", ")}
                        </span>
                      ) : null}
                      <span className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
                        <span className="rd-chip">
                          {annotationStatusLabel[annotation.status]}
                        </span>
                        {cutoff ? (
                          <span className="rd-mono !text-[0.58rem] opacity-50">
                            Evidence to {cutoff}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </ScrollReveal>
        </div>
      </section>

      {/* ----------------------------------------- the records, compared */}
      <section className="rd-sage-band rd-band">
        <div className="rd-container">
          <SectionHeading
            eyebrow="Side by side"
            title="Annotated so far"
            description="Each benchmark is coded independently by three annotators against a shared codebook, using evidence available at a frozen cutoff. Below, one question from each of the codebook's five parts, side by side. Select a benchmark for its full record."
          />

          <AnnotationComparisons annotations={annotations} results={results} />

          <AnnotationExplorer
            questions={explorerQuestions}
            benchmarks={explorerBenchmarks}
          />

          <p className="rd-prose-wide mt-14 text-sm font-light leading-relaxed opacity-65">
            These codes describe the strength of publicly available evidence,
            not a benchmark&rsquo;s quality. A gap means no supporting evidence
            was located after an adequate search: it does not establish that a
            practice is absent.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------ annotator agreement */}
      <section className="rd-warm-band rd-band">
        <div className="rd-container">
          <SectionHeading
            eyebrow="Annotator agreement"
            title="How consistently we coded"
            description="Agreement is the share of the three annotators who gave the most common answer, averaged over questions. The tick marks what random chance agreement would be on the same questions."
          />
          <AnnotationAgreement
            annotations={annotations}
            agreement={results.agreement}
          />
        </div>
      </section>
    </main>
  );
}
