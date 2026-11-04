import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { annotations } from "@/content/annotations";

/* ============================================================
   Reads the annotation results tables in content/results at
   build time — server components only (uses node:fs).

   Sources, all produced by the paper's analysis:
     codebook.csv                       variables, option lists
     agreement/Part N (X) responses.csv per-option selection tallies
     agreement/Part N (X) agreement.csv per-question majority share
     agreement/All parts agreement.csv  instrument-wide agreement

   Every number shown is read from these files; only the chance
   baselines are derived, using the paper's formula (appendix,
   "Chance Baselines for Majority-Share Agreement"). Anything that
   fails to line up — an unknown benchmark column, a codebook
   option with no tally — throws, so a bad export fails the build
   instead of rendering a wrong figure.
   ============================================================ */

const resultsDir = path.resolve(process.cwd(), "content", "results");
const agreementDir = path.join(resultsDir, "agreement");

/** k of n annotators chose this code. */
export type Tally = { k: number; n: number };

export type QuestionTallies = {
  variable: string;
  question: string;
  part: number;
  kind: "multi" | "single";
  /** Allowed codes in codebook order, with each benchmark's tally keyed by
   *  slug. A null tally means the question did not apply (coded N/A). */
  options: { code: string; bySlug: Record<string, Tally | null> }[];
};

export type AgreementRow = {
  /** Mean majority share over the scored questions. */
  observed: number;
  /** The same mean under uniformly random answers. */
  chance: number;
  /** Questions scored (conditional questions nobody reached are excluded). */
  questions: number;
};

export type PartAgreement = {
  part: number;
  label: string;
  bySlug: Record<string, AgreementRow>;
};

/** One question's majority share and its chance baseline. */
export type QuestionAgreement = { observed: number; chance: number };

export type AnnotationResults = {
  /** Keyed by lower-cased codebook variable name. */
  questions: Record<string, QuestionTallies>;
  agreement: {
    overall: Record<string, AgreementRow>;
    parts: PartAgreement[];
    /** Lower-cased variable name -> slug -> score. A benchmark is absent for
     *  a question the paper excludes (every annotator skipped it or coded
     *  N/A). */
    questions: Record<string, Record<string, QuestionAgreement>>;
  };
};

/** RFC 4180: quoted fields may hold commas, quotes ("") and newlines. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

const norm = (s: string) => s.trim().toLowerCase();

type CodebookVariable = {
  part: number;
  kind: "multi" | "single";
  question: string;
  options: string[];
};

/** Rows of the codebook table: type, role, variable, question, codes. Part
 *  headings ("2. Validity evidence") sit in the variable column alone. */
function parseCodebook(text: string): Map<string, CodebookVariable> {
  const variables = new Map<string, CodebookVariable>();
  let part = 0;
  for (const [type = "", , variable = "", question = "", codes = ""] of parseCsv(
    text,
  )) {
    const heading = /^(\d)\.\s/.exec(variable.trim());
    if (heading && !type.trim()) {
      part = Number(heading[1]);
      continue;
    }
    if (!/select/i.test(type) || !codes.trim()) continue;
    variables.set(norm(variable), {
      part,
      kind: /multi/i.test(type) ? "multi" : "single",
      question: question.trim(),
      options: codes
        .split(";")
        .map((c) => c.trim())
        .filter(Boolean),
    });
  }
  if (variables.size === 0) throw new Error("codebook.csv: no variables found");
  return variables;
}

/** Expected majority share for one question if three annotators answered at
 *  random: 0.75 for a multi-select (per box), (n² + 3n − 1) / 3n² for a
 *  single-select with n options. */
function chanceBaseline(variable: CodebookVariable): number {
  if (variable.kind === "multi") return 0.75;
  const n = variable.options.length;
  return (n * n + 3 * n - 1) / (3 * n * n);
}

/** Maps each benchmark column of a results table to its annotation slug. */
function benchmarkColumns(header: string[], file: string): Map<number, string> {
  const bySlug = new Map(annotations.map((a) => [norm(a.resultsName), a.slug]));
  const columns = new Map<number, string>();
  header.slice(2).forEach((name, i) => {
    const slug = bySlug.get(norm(name));
    if (!slug) throw new Error(`${file}: no annotation has resultsName "${name}"`);
    columns.set(i + 2, slug);
  });
  for (const a of annotations) {
    if (![...columns.values()].includes(a.slug))
      throw new Error(`${file}: no column for "${a.resultsName}"`);
  }
  return columns;
}

/** "3 of 3" for a multi-select code; null for N/A. */
function parseMultiCell(cell: string, where: string): Tally | null {
  if (/^n\/a$/i.test(cell.trim())) return null;
  const m = /^(\d+)\s+of\s+(\d+)$/.exec(cell.trim());
  if (!m) throw new Error(`${where}: unreadable tally "${cell}"`);
  return { k: Number(m[1]), n: Number(m[2]) };
}

/** "no rules located (2); Public (1)" for a single-select; null for N/A.
 *  "(blank)" counts annotators who skipped a conditional question. */
function parseSingleCell(
  cell: string,
  options: string[],
  where: string,
): Map<string, Tally> | null {
  if (/^n\/a$/i.test(cell.trim())) return null;
  const counts = new Map<string, number>();
  let n = 0;
  for (const part of cell.split(";")) {
    const m = /^(.*)\((\d+)\)\s*$/.exec(part.trim());
    if (!m) throw new Error(`${where}: unreadable answer "${part}"`);
    const code = m[1].trim();
    const k = Number(m[2]);
    n += k;
    if (code === "(blank)") continue;
    const option = options.find((o) => norm(o) === norm(code));
    if (!option) throw new Error(`${where}: "${code}" is not a codebook option`);
    counts.set(option, (counts.get(option) ?? 0) + k);
  }
  return new Map(options.map((o) => [o, { k: counts.get(o) ?? 0, n }]));
}

async function partFiles(kind: "responses" | "agreement") {
  const files = (await readdir(agreementDir))
    .map((file) => ({ file, m: /^Part (\d) \((.+)\) (\w+)\.csv$/.exec(file) }))
    .filter(({ m }) => m && m[3] === kind)
    .map(({ file, m }) => ({ file, part: Number(m![1]), label: m![2] }))
    .sort((a, b) => a.part - b.part);
  if (files.length !== 5)
    throw new Error(`content/results/agreement: expected 5 ${kind} files, found ${files.length}`);
  return files;
}

const read = (file: string) => readFile(file, "utf8");

export async function loadAnnotationResults(): Promise<AnnotationResults> {
  const codebook = parseCodebook(await read(path.join(resultsDir, "codebook.csv")));

  // ---- selection tallies
  const questions: Record<string, QuestionTallies> = {};
  for (const { file } of await partFiles("responses")) {
    const [header, ...rows] = parseCsv(await read(path.join(agreementDir, file)));
    const columns = benchmarkColumns(header, file);
    const byVariable = new Map<string, string[][]>();
    for (const row of rows) {
      const key = norm(row[0]);
      byVariable.set(key, [...(byVariable.get(key) ?? []), row]);
    }
    for (const [key, varRows] of byVariable) {
      const variable = codebook.get(key);
      if (!variable) throw new Error(`${file}: "${varRows[0][0]}" is not in the codebook`);
      const options = variable.options.map((code) => ({
        code,
        bySlug: {} as Record<string, Tally | null>,
      }));
      for (const [col, slug] of columns) {
        const where = `${file}, ${varRows[0][0]}, ${header[col]}`;
        if (variable.kind === "single") {
          const tallies = parseSingleCell(varRows[0][col] ?? "", variable.options, where);
          for (const o of options) o.bySlug[slug] = tallies?.get(o.code) ?? null;
        } else {
          for (const o of options) {
            const row = varRows.find((r) => norm(r[1]) === norm(o.code));
            if (!row) throw new Error(`${where}: no row for code "${o.code}"`);
            o.bySlug[slug] = parseMultiCell(row[col] ?? "", where);
          }
        }
      }
      questions[key] = {
        variable: varRows[0][0].trim(),
        question: variable.question,
        part: variable.part,
        kind: variable.kind,
        options,
      };
    }
  }

  // ---- agreement: per part, then overall
  const parts: PartAgreement[] = [];
  const questionAgreement: Record<string, Record<string, QuestionAgreement>> = {};
  const baselinesBySlug = new Map<string, number[]>();
  for (const { file, part, label } of await partFiles("agreement")) {
    const [header, ...rows] = parseCsv(await read(path.join(agreementDir, file)));
    const columns = benchmarkColumns(header, file);
    const summary = rows.find((r) => norm(r[0]) === "(mean over questions)");
    if (!summary) throw new Error(`${file}: no "(mean over questions)" row`);
    // One score per question: single-selects carry it on their own row,
    // multi-selects on their "(mean over codes)" row.
    const questionRows = rows.filter(
      (r) =>
        !r[0].trim().startsWith("(") &&
        (r[1].trim() === "" || norm(r[1]) === "(mean over codes)"),
    );
    const bySlug: Record<string, AgreementRow> = {};
    for (const [col, slug] of columns) {
      const baselines: number[] = [];
      for (const row of questionRows) {
        const value = row[col]?.trim() ?? "";
        if (value === "" || /^n\/a$/i.test(value)) continue;
        const variable = codebook.get(norm(row[0]));
        if (!variable) throw new Error(`${file}: "${row[0]}" is not in the codebook`);
        const chance = chanceBaseline(variable);
        const score = Number(value);
        if (!Number.isFinite(score))
          throw new Error(`${file}: unreadable score "${value}" for ${row[0]}, ${header[col]}`);
        baselines.push(chance);
        (questionAgreement[norm(row[0])] ??= {})[slug] = { observed: score, chance };
      }
      const observed = Number(summary[col]);
      if (!Number.isFinite(observed) || baselines.length === 0)
        throw new Error(`${file}: no agreement for ${header[col]}`);
      bySlug[slug] = {
        observed,
        chance: baselines.reduce((a, b) => a + b, 0) / baselines.length,
        questions: baselines.length,
      };
      baselinesBySlug.set(slug, [...(baselinesBySlug.get(slug) ?? []), ...baselines]);
    }
    parts.push({ part, label, bySlug });
  }

  const overall: Record<string, AgreementRow> = {};
  const [, ...overallRows] = parseCsv(
    await read(path.join(agreementDir, "All parts agreement.csv")),
  );
  for (const [name, observed, scored] of overallRows) {
    const a = annotations.find((x) => norm(x.resultsName) === norm(name));
    if (!a) throw new Error(`All parts agreement.csv: no annotation has resultsName "${name}"`);
    const baselines = baselinesBySlug.get(a.slug) ?? [];
    if (baselines.length !== Number(scored))
      throw new Error(
        `All parts agreement.csv: ${name} scores ${scored} questions, but the part tables score ${baselines.length}`,
      );
    overall[a.slug] = {
      observed: Number(observed),
      chance: baselines.reduce((x, y) => x + y, 0) / baselines.length,
      questions: baselines.length,
    };
  }

  return { questions, agreement: { overall, parts, questions: questionAgreement } };
}
