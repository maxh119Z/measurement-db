import type { Metadata } from "next";
import { AnnotationAgreement } from "@/components/annotation-agreement";
import { AnnotationComparisons } from "@/components/annotation-comparison";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { annotations } from "@/content/annotations";
import { loadAnnotationResults } from "@/lib/annotation-results";

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

export default async function AnnotationsIndexPage() {
  // Read from content/results at build time; the page prerenders.
  const results = await loadAnnotationResults();

  return (
    <main id="main-content">
      <PageHero
        eyebrow="Measurement Data Bank"
        title="Benchmark annotations"
        description={description}
      />

      {/* ----------------------------------------- the records, compared */}
      <section className="rd-white-band rd-band">
        <div className="rd-container">
          <SectionHeading
            eyebrow={`${annotations.length} benchmarks`}
            title="Annotated so far"
            description="Each benchmark is coded independently by three annotators against a shared codebook, using evidence available at a frozen cutoff. Below, one question from each of the codebook's five parts, side by side. Select a benchmark for its full record."
          />

          <AnnotationComparisons annotations={annotations} results={results} />

          <p className="rd-prose-wide mt-14 text-sm font-light leading-relaxed opacity-65">
            These codes describe the strength of publicly available evidence,
            not a benchmark&rsquo;s quality, fairness or validity. A gap means
            no supporting evidence was located after an adequate search &mdash;
            it does not establish that a practice is absent. Making a claim
            checkable is also not the same as someone having checked it.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------ annotator agreement */}
      <section className="rd-warm-band rd-band">
        <div className="rd-container">
          <SectionHeading
            eyebrow="Annotator agreement"
            title="How consistently we coded"
            description="Agreement is the share of the three annotators who gave the most common answer, averaged over questions. The tick marks what answering at random would score on the same questions. It shows how hard a question was to code, not anything about the benchmark."
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
