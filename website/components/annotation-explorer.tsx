"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import type { Tally } from "@/lib/annotation-results";
import { Square } from "@/components/annotation-square";

/* ============================================================
   AnnotationExplorer — pick any codebook question, see all four
   benchmarks against it.

   The five curated comparisons above carry hand-written short
   labels; the other sixteen questions have none, so this draws
   the codebook's own wording. Everything it needs is passed in
   as plain data, so the results loader and the annotations
   dataset stay out of the client bundle.
   ============================================================ */

export type ExplorerOption = {
  code: string;
  definition: string | null;
  /** A code recording that no evidence was located; drawn after a rule. */
  gap: boolean;
  bySlug: Record<string, Tally | null>;
};

export type ExplorerQuestion = {
  key: string;
  variable: string;
  question: string;
  part: number;
  partLabel: string;
  options: ExplorerOption[];
};

export type ExplorerBenchmark = { slug: string; name: string; href: string };

const MONO = { fontFamily: "var(--rd-mono)" } as const;

function tallyText(tally: Tally | null): string {
  return tally ? `${tally.k} of ${tally.n} annotators` : "not asked";
}

function Strip({
  question,
  slug,
}: {
  question: ExplorerQuestion;
  slug: string;
}) {
  const options = [
    ...question.options.filter((o) => !o.gap),
    ...question.options.filter((o) => o.gap),
  ];
  const firstGap = options.findIndex((o) => o.gap);

  return (
    <div className="relative pb-11">
      <ul
        className="grid gap-x-1.5"
        style={{
          gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        }}
      >
        {options.map((option, index) => {
          const tally = option.bySlug[slug] ?? null;
          const split = tally && tally.k > 0 && tally.k < tally.n;
          return (
            <li
              key={option.code}
              className={`flex flex-col items-center gap-1.5 text-center ${
                index === firstGap ? "border-l border-black/15 pl-1.5" : ""
              }`}
            >
              <Square tally={tally} />
              {/* Full codebook wording in a narrow column, so it has to be
                  allowed to break inside a word or the columns collide. */}
              <span
                className={`peer w-full break-words text-[0.6rem] leading-tight opacity-80 ${
                  option.gap ? "italic" : ""
                } ${option.definition ? "rd-tip" : ""}`}
                style={MONO}
              >
                {option.code}
              </span>
              {split ? (
                <span
                  className="text-[0.58rem] tabular-nums opacity-50"
                  style={MONO}
                >
                  {tally.k}/{tally.n}
                </span>
              ) : null}
              {option.definition ? (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 hidden text-left text-[0.72rem] font-light leading-snug opacity-70 peer-hover:block">
                  <span className="font-medium">{option.code}</span> &mdash;{" "}
                  {option.definition}
                </span>
              ) : null}
              <span className="sr-only">{tallyText(tally)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AnnotationExplorer({
  questions,
  benchmarks,
}: {
  questions: readonly ExplorerQuestion[];
  benchmarks: readonly ExplorerBenchmark[];
}) {
  const [key, setKey] = useState(questions[0]?.key ?? "");
  const question = questions.find((q) => q.key === key) ?? questions[0];
  if (!question) return null;

  const parts = [...new Set(questions.map((q) => q.part))].sort();

  return (
    // Sixth block of the comparison section, matching the five above it.
    <div className="mt-14">
      <p className="rd-mono opacity-60">6 &middot; Any question</p>
      <h3 className="rd-h3 mt-3">Compare on anything in the codebook</h3>

      <label className="mt-5 block">
        <select
          value={key}
          onChange={(event) => setKey(event.target.value)}
          className="w-full max-w-2xl border border-black/20 bg-white px-3 py-2.5 text-sm font-light"
        >
          {parts.map((part) => (
            <optgroup
              key={part}
              label={`${part} · ${
                questions.find((q) => q.part === part)?.partLabel ?? ""
              }`}
            >
              {questions
                .filter((q) => q.part === part)
                .map((q) => (
                  <option key={q.key} value={q.key}>
                    {q.variable}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>

      <p className="rd-mono mt-10 opacity-60">
        {question.part} &middot; {question.partLabel}
      </p>
      <h4 className="rd-h3 mt-3">{question.variable}</h4>
      <p className="rd-prose-wide mt-3 text-xs font-light italic opacity-50">
        Codebook question: &ldquo;{question.question}&rdquo;
      </p>

      <ul className="mt-6 grid gap-5 sm:grid-cols-2">
        {benchmarks.map((benchmark) => (
          <li key={benchmark.slug}>
            <Link
              href={benchmark.href as Route}
              className="rd-card h-full gap-4"
            >
              <span className="text-xl font-light">{benchmark.name}</span>
              <Strip question={question} slug={benchmark.slug} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
