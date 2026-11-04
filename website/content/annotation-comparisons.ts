/* ============================================================
   The cross-benchmark comparison on /annotations: one codebook
   question per part, chosen as the one that most directly bears
   on that part's claim for a PRIVATE benchmark.

   Editorial, hand-maintained. The tallies themselves come from
   content/results (see lib/annotation-results.ts); this file
   only says which question to show and how to label its options
   briefly. Variable and option names are matched to the codebook
   case-insensitively, and a missing label fails the build rather
   than printing raw codebook text.
   ============================================================ */

export type ComparisonQuestion = {
  /** Codebook part, 1–5. */
  part: number;
  partLabel: string;
  /** Codebook variable name, verbatim. */
  variable: string;
  title: string;
  /** Why this question stands for its part, and how to read the squares. */
  why: string;
  /** Short strip label for every allowed code, keyed by the codebook text. */
  labels: Record<string, string>;
  /** Codes recording that no evidence was located. Drawn apart from the
   *  rest, so a gap never reads as a finding of absence. */
  notLocated?: readonly string[];
};

export const comparisonQuestions: readonly ComparisonQuestion[] = [
  {
    part: 1,
    partLabel: "Durability",
    variable: "Protected component",
    title: "What is withheld",
    why: "Everything else depends on what is hidden. This part is descriptive: more filled squares means more is withheld, not a better or worse benchmark.",
    labels: {
      "Items/tasks": "Tasks",
      "labels/reference answers": "Answers",
      "rubric/judge/scorer": "Scorer",
      "test membership/distribution": "Test split",
      "environment/tools/data": "Environment",
      "aggregation/reporting rules": "Aggregation",
      "run logs/configuration": "Run logs",
    },
  },
  {
    part: 2,
    partLabel: "Validity",
    variable: "Hidden-set coverage evidence",
    title: "Does the hidden set cover the task?",
    why: "A private benchmark's score comes from items no outsider can see. This asks what public evidence lets someone judge whether those hidden items cover what the benchmark says it measures.",
    labels: {
      "Sampling/source method documented": "Sampling method",
      "public-private comparability evidence": "Public vs. hidden comparison",
      "documented expert or independent review of hidden set": "Expert review",
      "none documented": "None documented",
    },
    notLocated: ["none documented"],
  },
  {
    part: 3,
    partLabel: "Integrity",
    variable: "Run audit evidence",
    title: "Can a reported run be checked?",
    why: "Whether the evidence behind a reported score is kept in a form someone could use to check that the stated procedure was followed. Available evidence, not proof that anyone checked.",
    labels: {
      "Public outputs/logs/run record": "Public run records",
      "controlled-access run records": "Controlled access",
      "evaluator or third-party replay possible": "Replay possible",
      "none documented": "None documented",
    },
    notLocated: ["none documented"],
  },
  {
    part: 4,
    partLabel: "Neutrality",
    variable: "Evaluator–provider ties",
    title: "Ties between operator and developers",
    why: "Relationships between whoever runs the benchmark and the developers whose models it scores. A filled square is a documented tie: a disclosure, not a verdict.",
    labels: {
      "Same organization/affiliate": "Same organization",
      "funding/sponsorship": "Funding",
      "customer/vendor relationship": "Customer or vendor",
      "research/technical partnership": "Research partner",
      "privileged model/data/API access": "Privileged access",
      "other material tie": "Other tie",
      "explicit no material ties": "No ties stated",
      "no relationship information located": "No information",
    },
    notLocated: ["no relationship information located"],
  },
  {
    part: 5,
    partLabel: "Verification",
    variable: "External verification status",
    title: "Has anyone outside checked?",
    why: "Whether a party outside the operator and the evaluated developers actually performed a check. A check being possible is not the same as one having happened.",
    labels: {
      "Verifier-authored or other external evidence located":
        "External evidence",
      "operator reports external verification only": "Operator's report only",
      "no external verification located": "None located",
    },
    notLocated: ["no external verification located"],
  },
];

/** Short wording for the context lines on the Durability cards. */
export const durabilityFacts: readonly {
  label: string;
  variable: string;
  labels: Record<string, string>;
}[] = [
  {
    label: "Hidden from",
    variable: "Restricted audience",
    labels: {
      "Evaluated provider/team": "evaluated developers",
      "benchmark participant/user": "participants",
      "independent researcher": "researchers",
      "general public": "the public",
      "customer/client": "customers",
    },
  },
  {
    label: "Release",
    variable: "Secrecy lifecycle",
    labels: {
      "Indefinite/no planned release": "none planned",
      "rolling release/replacement": "rolling",
      "fixed or event-bounded release": "at a set point",
      "until benchmark retirement": "on retirement",
      "mixed by component": "differs by component",
      "not reported": "not stated",
    },
  },
  {
    label: "How models run",
    variable: "Evaluation access",
    labels: {
      "Prediction submission to server": "developers submit predictions",
      "hosted task/evaluation API": "through a hosted API",
      "evaluator runs the model/system": "the operator runs them",
      "submitted code/container": "developers submit code",
      "secure/controlled environment": "in a secure environment",
      "third-party platform/custodian": "through a third party",
    },
  },
];
