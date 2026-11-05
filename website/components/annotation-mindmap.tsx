import type { Band, Leaf, LeafStatus } from "@/content/annotations";
import type { AgreementRow, QuestionAgreement } from "@/lib/annotation-results";
import { bandDefinition, codeDefinition } from "@/content/annotations";
import { TreeConnectors } from "./tree-connectors";


/* ============================================================
   AnnotationMindmap — every coded item as a two-sided tree with
   the benchmark at the centre.

   HTML, not SVG. Each leaf is a native <details>, so the tree is
   one line per item until something is opened and the browser
   reflows the column around it. That is the whole reason this is
   not SVG: <text> cannot wrap and a viewBox cannot grow, so the
   old build-time layout had to render every leaf expanded.

   Geometry is CSS grid: left column, centre spine, right column,
   with the band rules and leaf ticks drawn as borders. Collapses
   to a single column below `lg`, where the mirroring is dropped.

   Server component, and no client JS anywhere in it.
   ============================================================ */

type Side = "left" | "right";

/** Annotator agreement in the paper's format (appendix, "Annotation
 *  Agreement"): each question's majority share, and equal-weight means over
 *  the scored questions per part and overall, each beside its chance
 *  baseline. Read from content/results by the page. */
export type TreeAgreement = {
  overall: AgreementRow;
  /** Keyed by band id. */
  parts: Record<string, AgreementRow>;
  /** Keyed by lower-cased codebook variable name. */
  questions: Record<string, QuestionAgreement>;
};

/** Per-option selection tallies for this benchmark, keyed by lower-cased
 *  codebook variable. Read from content/results by the page rather than stored
 *  per leaf, so the tree and the comparison tables cannot disagree. */
export type TreeTallies = Record<
  string,
  readonly { code: string; k: number; n: number }[]
>;

/** The codebook variable a leaf answers: its question reads
 *  "Variable — question text". */
function variableOf(leaf: Leaf): string {
  return leaf.question.split(" — ")[0].trim().toLowerCase();
}

/** "0.87 (n = 6)", as the paper labels its agreement figures. */
function meanLabel(row: AgreementRow): string {
  return `${row.observed.toFixed(2)} (n = ${row.questions})`;
}

const SIDE_OF: Record<string, Side> = {
  durability: "right",
  validity: "right",
  integrity: "left",
  neutrality: "left",
  verification: "left",
};

/** An option on the form that no annotator selected. Not a status — it is the
 *  rest of the question's option set, shown so the reader can see what was
 *  considered and passed over. */
const UNDOCUMENTED = "#7A4FBF";

const MARK_FILL: Record<LeafStatus, string> = {
  ok: "#00917F",
  part: "#C27C00",
  gap: "#B8233A",
  risk: "#3B5FC4",
  desc: "#8A949C",
};

/** Status marks differ in shape as well as colour, so they survive greyscale
 *  and colour-vision deficiency. */
function StatusMark({
  status,
  x,
  y,
}: {
  status: LeafStatus;
  x: number;
  y: number;
}) {
  const fill = MARK_FILL[status];
  if (status === "desc") return <circle cx={x} cy={y} r={4} fill={fill} />;
  if (status === "risk")
    return (
      <rect
        x={x - 5}
        y={y - 5}
        width={10}
        height={10}
        fill={fill}
        transform={`rotate(45 ${x} ${y})`}
      />
    );
  return (
    <>
      <rect
        x={x - 5.5}
        y={y - 5.5}
        width={11}
        height={11}
        rx={1.5}
        fill={status === "ok" ? fill : "transparent"}
        stroke={fill}
        strokeWidth={1.75}
      />
      {status === "part" ? (
        <rect x={x - 5.5} y={y - 5.5} width={5.5} height={11} fill={fill} />
      ) : null}
    </>
  );
}

function Mark({ status }: { status: LeafStatus }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden
      className="mt-[0.3rem] shrink-0"
    >
      <StatusMark status={status} x={6} y={6} />
    </svg>
  );
}

function Chevron() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className="mt-[0.3rem] shrink-0 opacity-65 transition-transform duration-200 group-open:rotate-180"
    >
      <path
        d="M2 4.5 6 8.5l4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** One coded item. Closed it is the verbatim question; open it adds every
 *  per-option tally and, when agreement is shown, the question's score. */
function LeafItem({
  leaf,
  side,
  score,
  votes,
}: {
  leaf: Leaf;
  side: Side;
  score: QuestionAgreement | null;
  votes: TreeTallies[string];
}) {
  const agree = score
    ? `Majority share ${score.observed.toFixed(2)}  ·  chance ${score.chance.toFixed(2)}`
    : null;
  const mirror = side === "left";

  return (
    <details className="group">
      <summary
        className={`flex cursor-pointer list-none items-start gap-2 py-2 [&::-webkit-details-marker]:hidden ${
          mirror ? "lg:flex-row-reverse lg:text-right" : ""
        }`}
      >
        <Chevron />
        <Mark status={leaf.status} />
        <span className="min-w-0 flex-1 text-[0.95rem] font-medium leading-snug">
          {leaf.question}
        </span>
      </summary>

      <div
        className={`flex flex-col gap-2 pb-4 ${
          mirror ? "lg:items-end lg:text-right" : ""
        }`}
      >
        {votes.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {votes.map((vote) => {
              const def = codeDefinition(vote.code);
              return (
                <li
                  key={vote.code}
                  className="text-[0.8rem] leading-snug"
                  style={vote.k === 0 ? { color: UNDOCUMENTED } : undefined}
                >
                  <span className="rd-mono !text-[0.62rem] tabular-nums">
                    {vote.k}/{vote.n}
                  </span>{" "}
                  <span
                    className={`${def ? "rd-tip peer" : ""} ${
                      vote.k === 0 ? "" : "opacity-65"
                    }`}
                  >
                    {vote.code}
                  </span>
                  {def ? (
                    <span className="hidden max-w-sm text-sm font-light leading-snug opacity-60 peer-hover:block">
                      {def}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
        {agree ? (
          <p className="rd-agree rd-mono !text-[0.6rem] !normal-case tabular-nums opacity-50">
            {agree}
          </p>
        ) : null}
      </div>
    </details>
  );
}

/** One codebook part: its label, then its items hanging off a vertical rule. */
function BandBlock({
  band,
  index,
  side,
  agreement,
  tallies,
}: {
  band: Band;
  index: number;
  side: Side;
  agreement?: TreeAgreement;
  tallies: TreeTallies;
}) {
  const mirror = side === "left";
  const part = agreement?.parts[band.id];
  // Verification's three follow-up questions are scored but have no leaf.
  const unseen = part ? part.questions - band.leaves.length : 0;
  return (
    <section
      className={`relative flex flex-col gap-2 ${mirror ? "lg:items-end" : ""}`}
    >
      <div className={`flex flex-col gap-1.5 ${mirror ? "lg:items-end" : ""}`}>
        <h4
          data-tree-band={side}
          className="rd-mono rd-tip peer !text-[0.68rem] uppercase tracking-wider"
        >
          {index + 1} &middot; {band.label}
        </h4>
        {bandDefinition(band.id) ? (
          <span className="hidden max-w-sm text-sm font-light leading-snug opacity-60 peer-hover:block">
            {bandDefinition(band.id)}
          </span>
        ) : null}
        {part ? (
          <span
            className={`rd-agree rd-mono !text-[0.6rem] !normal-case tabular-nums opacity-50 ${
              mirror ? "lg:text-right" : ""
            }`}
          >
            <span className="block">
              Mean {meanLabel(part)} &middot; chance {part.chance.toFixed(2)}
            </span>
            {unseen > 0 ? (
              <span className="block">
                n includes {unseen} follow-up question{unseen === 1 ? "" : "s"}{" "}
                not drawn here
              </span>
            ) : null}
          </span>
        ) : null}
      </div>
      <ul
        className={`flex w-full flex-col border-black/15 ${
          mirror ? "border-l pl-5 lg:border-l-0 lg:border-r lg:pl-0 lg:pr-5" : "border-l pl-5"
        }`}
      >
        {band.leaves.map((leaf) => (
          <li
            key={leaf.name}
            className={`relative before:absolute before:top-[0.85rem] before:w-3 before:border-t before:border-black/15 ${
              mirror
                ? "before:-left-5 lg:before:left-auto lg:before:-right-5"
                : "before:-left-5"
            }`}
          >
            <LeafItem
              leaf={leaf}
              side={side}
              score={agreement ? questionScore(agreement, leaf) : null}
              votes={tallies[variableOf(leaf)] ?? []}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function questionScore(agreement: TreeAgreement, leaf: Leaf): QuestionAgreement {
  const score = agreement.questions[variableOf(leaf)];
  if (!score)
    throw new Error(`No agreement score in content/results for "${leaf.question}"`);
  return score;
}

export function AnnotationMindmap({
  benchmarkName,
  bands,
  agreement,
  tallies,
}: {
  benchmarkName: string;
  bands: readonly Band[];
  agreement?: TreeAgreement;
  tallies: TreeTallies;
}) {
  if (bands.length === 0) return null;

  const indexed = bands.map((band, index) => ({ band, index }));
  const right = indexed.filter(
    ({ band }) => (SIDE_OF[band.id] ?? "right") === "right",
  );
  // Reversed so the left column reads upward from the lowest-numbered band.
  const left = indexed
    .filter(({ band }) => SIDE_OF[band.id] === "left")
    .reverse();

  return (
    <div className="rd-tree">
      <Key />
      <figure className="mt-7">
        <div className="relative grid gap-8 lg:grid-cols-[1fr_18rem_1fr] lg:gap-10">
          <TreeConnectors />
          <div className="flex flex-col gap-9">
            {left.map(({ band, index }) => (
              <BandBlock
                key={band.id}
                band={band}
                index={index}
                side="left"
                agreement={agreement}
                tallies={tallies}
              />
            ))}
          </div>

          <div className="relative order-first flex items-center justify-center lg:order-none">
            {/* Every connector starts on this pill's edge — see
                TreeConnectors, which measures it. */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <span
                data-tree-root
                className="rounded-full bg-[var(--rd-dark)] px-5 py-2 text-[1.05rem] font-semibold text-[var(--rd-sage)]"
              >
                {benchmarkName}
              </span>
              {/* Mean agreement over every scored question, as the paper
                  reports it. */}
              {agreement ? (
                <span className="rd-agree rd-mono !text-[0.62rem] !normal-case space-y-1 bg-[var(--rd-sage)] px-3 py-1 text-center tabular-nums opacity-60">
                  <span className="block">
                    Mean agreement {meanLabel(agreement.overall)}
                  </span>
                  <span className="block opacity-75">
                    Chance {agreement.overall.chance.toFixed(2)}
                  </span>
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-9">
            {right.map(({ band, index }) => (
              <BandBlock
                key={band.id}
                band={band}
                index={index}
                side="right"
                agreement={agreement}
                tallies={tallies}
              />
            ))}
          </div>
        </div>
      </figure>
    </div>
  );
}

/** The key, above the tree so the marks and abbreviations are read first. */
function Key() {
  const entries: { status: LeafStatus; label: string; gloss: string }[] = [
    { status: "ok", label: "Documented", gloss: "public evidence answers it" },
    { status: "part", label: "Partial", gloss: "some evidence, with a gap" },
    { status: "gap", label: "Not located", gloss: "no evidence found" },
    {
      status: "risk",
      label: "Disclosed risk",
      gloss: "a stated conflict or unequal access",
    },
    {
      status: "desc",
      label: "Descriptive",
      gloss: "an unordered category, no status",
    },
  ];
  const terms = [
    [
      "Majority share",
      "the fraction of the three annotators who gave the most common answer. A multi-select question scores the mean over its options, so an option nobody picked counts as agreement that it does not apply.",
    ],
    [
      "Mean (n = …)",
      "the average over a part's scored questions, or all of them at the centre, each question weighted equally; n is the number of questions.",
    ],
    [
      "Chance",
      "what random chance agreement would be on the same questions: 0.75 for a multi-select question, falling from 0.63 to 0.49 for single-select questions with three to six options.",
    ],
  ];
  return (
    <div className="mt-8 flex flex-col gap-4">
      <div className="flex flex-wrap gap-x-7 gap-y-2.5">
        {entries.map((entry) => (
          <span
            key={entry.status}
            className="flex items-baseline gap-2 text-sm font-light"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <StatusMark status={entry.status} x={6} y={6} />
            </svg>
            <span className="rd-mono !text-[0.62rem] uppercase tracking-wider">
              {entry.label}
            </span>
            <span className="opacity-60">{entry.gloss}</span>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-7 gap-y-2.5">
        <span className="flex items-baseline gap-2 text-sm font-light">
          <span
            className="size-2.5 shrink-0"
            style={{ background: UNDOCUMENTED }}
            aria-hidden
          />
          <span className="rd-mono !text-[0.62rem] uppercase tracking-wider">
            Undocumented
          </span>
          <span className="opacity-60">
            an option on the form that no annotator selected
          </span>
        </span>
      </div>
      {/* Agreement is a property of our coding, not of the benchmark, so it
          is off until asked for. The checkbox drives the whole tree through
          `:has()` — see `.rd-agree` in redesign.css. */}
      <div className="border-t border-black/10 pt-3.5">
        <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm font-light">
          <input
            type="checkbox"
            className="rd-agree-toggle size-3.5 accent-[var(--rd-dark)]"
          />
          <span>Show annotator agreement</span>
        </label>
        <div className="rd-agree mt-3.5">
          <div className="flex flex-col gap-1.5">
            {terms.map(([abbr, gloss]) => (
              <span
                key={abbr}
                className="flex items-baseline gap-2.5 text-sm font-light"
              >
                <span className="rd-mono !text-[0.62rem] w-28 shrink-0">
                  {abbr}
                </span>
                <span className="opacity-60">{gloss}</span>
              </span>
            ))}
            <span className="mt-1 text-sm font-light opacity-55">
              With three annotators a multi-select option cannot score below
              2/3, so scores sit near the top of the scale. A score near its
              chance level means the coders were no more consistent than
              chance, not that the benchmark did badly.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
