# Benchmark annotations — working notes

State of the private-benchmark verifiability annotations and the website pages
that display them. Read this before touching anything under `/annotations`.

## What this is

A survey of how far private AI benchmarks can be checked from outside, coded by
three annotators against **Codebook v3.1** (final — v4 exists in the sheet but is
not what was coded). It backs the paper *Trustworthy Private AI Benchmarks
Require External Verification*.

The instrument codes **public verifiability** — how strongly available evidence
lets outsiders assess a benchmark's claims. Per the codebook's own rule, scores
describe *the strength of verifiability evidence, not the benchmark's actual
quality, fairness, or validity*. A `Not located` code means no supporting
evidence was found after an adequate search; it does **not** establish that a
practice is absent. Website copy must not drift into reading these as a quality
ranking.

Two framing points from the paper that the pages depend on:

- **Durability is not a fourth claim.** It is the constraint that motivates
  withholding information, so it sets the disclosure limits the other claims
  work within. It is descriptive and excluded from any scale score.
- **Verifiability is not verification.** Making a claim checkable is not the
  same as someone having checked it.

## Current state

**Focus is FrontierMath.** Finish it properly before spreading effort across the
other three — if the framing gets challenged, we'd rather have paid that cost
once.

| Benchmark | Context | Tree | Summary table | Evidence quality |
|---|---|---|---|---|
| FrontierMath | done | 18 leaves | 4 claims filled | 129 codes rated |
| SWE-Bench Pro | done | — | — | — |
| METR Time Horizon / HCAST | done | — | — | — |
| GDPval | done | — | — | — |

All four are annotated in all five CSV parts by all three annotators. Only
FrontierMath has been brought through to the site.

**Annotators are anonymised to initials** — MZ, AP, NT — everywhere in
`annotations.ts` and on the page. `frontiermath-sources.md` still spells the
names out in its scope section and per-source attributions; decide whether that
should be stripped before the repo goes public. The site footer also credits a
team member by name, which is unrelated to annotator anonymity.

## Page structure (`/annotations`)

```
hero
Annotated so far  legend, then one block per codebook part, each comparing all
                  four benchmarks on one question (cards link to /[slug]):
                    1 Durability    Protected component  + hidden from / release /
                                    how models run, status chip, evidence cutoff
                    2 Validity      Hidden-set coverage evidence
                    3 Integrity     Run audit evidence
                    4 Neutrality    Evaluator–provider ties
                    5 Verification  External verification status
How consistently  one agreement panel per benchmark: overall + per part,
we coded          observed vs chance (paper's equal-weight majority share)
```

The question per part, its blurb and the short option labels are editorial, in
`content/annotation-comparisons.ts`. Squares: filled = 2–3 of 3 annotators,
dot = 1, empty = 0; splits print as `2/3`; not-located codes sit after a rule.
Nothing on the page is summed or ranked.

## Page structure (`/annotations/frontiermath`)

```
header            operator · domain · version · stamp-free meta row
                  Hidden / Run by / Release / Verification (links only when found)
                  summary + its drafting brief
By claim          4 rows: Validity, Integrity, Neutrality, Verification
                  × Strengths | Concerns | What would make it checkable
By item           mindmap with verbatim questions and selection tallies; the
                  agreement toggle adds the paper's figures (see below)
                  → public open-questions panel, 1 (Verification split)
Evidence quality  rubric pulldown (verbatim) → heatmap → All codes + Summary slot
                  → band pulldowns → question → code → per-annotator scores
Sources           38 titled links
```

## Where things live

```
website/annotations/
  Part 1..5 *.csv            raw form exports — the record, tracked in git
  Evidence quality rubric.pdf  the rubric; its text is transcribed into the site
  frontiermath-sources.md    38 normalized sources from the FrontierMath records
  test.html                  standalone mock the design came from (gitignored)

website/content/results/
  codebook.csv                 Codebook v3.1: variables, types, option lists
  agreement/*responses.csv     per-option tallies ("3 of 3"), all benchmarks
  agreement/*agreement.csv     per-question majority share, per part
  agreement/All parts agreement.csv
  Part 1..5 *.csv              raw form exports (not read by the site)

website/content/annotations.ts            all page data, hand-maintained
website/content/annotation-comparisons.ts index: question per part, labels
website/lib/annotation-results.ts         reads content/results at build time
website/components/annotation-comparison.tsx  index comparison cards
website/components/annotation-agreement.tsx   index agreement panels
website/components/annotation-mindmap.tsx tree, layout computed at build
website/components/evidence-quality.tsx   rubric + band/question/code pulldowns
website/components/evidence-heatmap.tsx   question × dimension grid
website/app/annotations/                  index + /[slug] report pages
```

Nothing fetches Google Sheets at build time. The index page reads the tables in
`content/results` as the site builds (`lib/annotation-results.ts`); replace those
files to update it. Each benchmark's `resultsName` in `annotations.ts` is its
column header there. The loader throws on anything that doesn't line up (an
unknown column, a codebook option with no tally), so a bad export fails the
build rather than showing a wrong figure. The benchmark pages are still
hand-transcribed into `annotations.ts`, except their agreement figures, which
come from the same tables.

**No coordinates live in the data.** The mindmap computes its own layout: leaf
blocks size themselves from their content, a band sits at the mean anchor of its
leaves, the root at the middle. Text is wrapped at build time from a
character-width estimate, because SVG `<text>` does not wrap — if a line
overflows, adjust `CHARS` in the component.

## Agreement figures

Everywhere on the site, agreement is the paper's measure and its numbers
(appendix, "Annotation Agreement"), read from `content/results/agreement`:

- **Majority share** per question: the fraction of the three annotators giving
  the most common answer. A multi-select question scores the mean over its
  allowed codes, plus Other when someone used it; a code nobody picked scores
  1.0 (all three agreed it does not apply).
- **Mean (n = …)** per part and overall: question scores averaged with equal
  weight; n is the number of questions scored. A skipped follow-up counts as
  selecting nothing, and a question is excluded when every annotator skipped it
  or coded N/A (so SWE-bench Pro scores 18 of 21).
- **Chance**: 0.75 per multi-select question, `(n² + 3n − 1) / 3n²` for a
  single-select with n options (0.63 for three, 0.49 for six), averaged over the
  same questions: 0.70 for the full instrument, 0.72 for SWE-bench Pro.

FrontierMath: 0.88 (n = 21) overall; by part 0.87 (n = 6), 0.97 (n = 4),
0.89 (n = 4), 0.99 (n = 3), 0.74 (n = 4). Verification's n counts three
follow-up questions that have no leaf in the tree; the band says so.

Values print to two decimals, as the paper does. The tables are already
rounded, so recomputing a part mean from its question scores can differ in the
second decimal — the site shows the paper's own mean rows.

## Evidence quality (Rubric v1)

Every **selected** code carries four scores. The rubric is explicit: *"Record
each score separately. Do not add them up or assign a band."* So means are taken
**per dimension only** — mean V, mean S, mean P, mean C — and never across them.
Nothing in the code should ever produce a single blended number.

| | Scale | |
|---|---|---|
| V Verifiability | 1–3 | Stated · Inspectable · Confirmed |
| S Source independence | 0–3 | Unattributed · Interested · Operator official · Independent |
| P Precision and fit | 0–3 | Off-target · Adjacent · On-target · Exact |
| C Corroboration | 0–3 | Contradicted · Single · Same party · Cross-party |
| Search completeness | 0–3 | for codes **not** selected: Minimal · Partial · Complete · Targeted |

**V floors at 1, the others at 0.** A pale V in the heatmap is therefore a worse
result than the same colour in another column; the caption says so rather than
normalising each column away.

`N/A`, `none documented` and `not reported` are exempt from rating by the
rubric — which is also why they are hidden at 0/n in the tree.

FrontierMath, 129 rated codes: mean V 1.45 · S 1.98 · P 1.76 · C 1.50. Read
together: the documentation is consistent and operator-official, and most of it
cannot be checked from outside.

## Known defects

**Code transfer error — 30 rows (NT 12, MZ 3 by code, 30 rendered).** Rationale
is attached to a code by matching the annotator's note header against the option
text. NT writes shorthand headers ("Measured capability and target domain" for
two separate codes) and sometimes groups several codes under a header naming
none of them. Token-overlap matching recovered most (81% → 88% coverage) but not
all. The page labels the rest `Code transfer error` in cardinal — **this is a
pipeline bug, not missing annotation; every rated code was written up.** Two
ways to finish: attach an unmatched block to every code selected for that
question (cheap, over-attributes), or match on quote text rather than header
(precise, more work). Needs a decision.

## What's left

**FrontierMath**

1. Review the evidence-quality summary (`frontierMathEvidenceSummary` in
   `annotations.ts`). Its counts are hand-copied, so recount if ratings change.
2. Settle the Verification split shown in the open-questions panel. The
   internal reconciliation items that used to sit on the page are tracked
   privately.
3. Fix the code transfer error above.

**The other three benchmarks**

4. Transcribe context, leaves, tallies and evidence quality the same way. CSV
   parsing is straightforward; the editorial statuses are not — each needs a
   curator reading the evidence notes, not just the selections.

**Charts**

5. **Spider plots are deliberately deferred.** They need at least two benchmarks
   to be worth drawing — a four-axis radar for one benchmark is four numbers
   drawn as a shape. When built: Validity and Integrity only for content codes,
   unfilled outlines (a filled polygon's area is an implicit sum of V+S+P+C,
   which the rubric forbids), fixed axis order, and N/A drops an axis rather
   than plotting as 0.
6. Evidence quality **is** comparable across all five bands, unlike the content
   codes — it rates the citation, not the benchmark's merit. That is why the
   heatmap spans every band while the claim table does not.

**Pipeline**

7. The CSV → `annotations.ts` path is manual. Past four benchmarks it wants a
   generator under `scripts/render_website/`, following the existing
   `generate_*.py` → `content/generated/*.json` pattern. It needs the codebook
   sheet as a second input for the option lists.

## Open questions

- **Search completeness is coded but not shown.** It rates how hard an annotator
  looked before concluding a code had no support, which is what makes a negative
  finding credible. Different scale from the four dimensions, and it attaches to
  unselected codes, so it needs its own place.
- **Three claims or five bands.** The summary table shows four claims; the tree
  and heatmap show all five codebook parts. Defensible together, but labels and
  band order must agree.

## Conventions

- Annotator disagreement is a property of our coding process, not a finding
  about the benchmark. Keep it out of strengths/concerns.
- "What would make it checkable" is deliberately not "what would fix it":
  disclosure trades against durability, and a claim can be made checkable
  through controlled inspection or non-disclosing verification rather than
  publication.
- Questions and option codes are stored **verbatim** from the forms. Counting is
  case-insensitive (coders typed both `items/tasks` and `Items/tasks`); the most
  common spelling is kept.
- Status marks differ in **shape as well as colour**, so they survive greyscale
  and colour-vision deficiency. Keep it that way.
- The summary brief is a drafting aid and comes out before publication. The
  open-questions panel is public: only questions meant for readers go there;
  internal to-dos stay off the page.
- `.rd-mono` sets its own font weight, so plain `font-bold` on a mono span does
  nothing. Use `!font-bold`.
