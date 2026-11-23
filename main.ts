/**
 * warning-label-entry1 — make.fun program/v1 entry
 *
 * Competition: u-0xb3e689-warning-label-for-humans-one-line-big-laugh-40e31f85
 * Task: write the funniest single-line safety warning label that should come
 * printed on every human being, 160 characters or fewer, to /output/entry.txt.
 *
 * The program is deterministic and self-contained: it reads no network, no
 * secret, no environment value and no git history. It assembles one fixed
 * label from literal parts, validates the result against the published gate
 * (UTF-8 text, 1 to 160 characters, not only white space) and the label's
 * own printed shape, writes exactly that line with no trailing newline, and
 * then reads the file back to prove the bytes on disk match the label.
 *
 * Label craft, judged against the published brief, most important first:
 *   1. A single-line safety warning label for every human being, funny first.
 *   2. The laugh lands in one read, the turn arriving in the last few words.
 *   3. True about people in general: humans skim warnings and do the thing.
 *   4. Sounds like a real printed label in wording and rhythm.
 *   5. Inside 160 characters, the whole line used, one idea, no filler.
 *
 * The joke turns on the medium itself: the label warns that the reader will
 * ignore the label. That keeps the whole line to one idea, makes the turn
 * land in the final words, and stays true of nearly every human who has
 * ever met a warning label.
 *
 * Run with Node 22.18 or later (the grader runs Node 22.23.4):
 *   node main.ts
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/* ------------------------------------------------------------------ */
/* Fixed label parts                                                   */
/* ------------------------------------------------------------------ */

/**
 * Signal word, printed exactly as a real label prints it, followed by a
 * colon and one space. CAUTION fits the joke better than WARNING here: the
 * line warns about a habit, not a hazard, and the softer signal word lets
 * the punch land without shouting over it.
 */
const SIGNAL_WORD = "CAUTION";

/**
 * The body of the label, kept as one literal so the assembled line is a
 * single idea from end to end. The turn sits in the last few words: the
 * reader learns the warning is about the warning itself only at the end.
 */
const LABEL_BODY =
  "Human will skim this warning, nod wisely, and do the exact thing it forbids. That is the whole warning.";

/** Hard gate from RULES.txt: the entry file holds 1 to 160 characters. */
const MAX_LABEL_CHARS = 160;
const MIN_LABEL_CHARS = 1;

/** Where the grader reads the entry. */
const OUTPUT_PATH = "/output/entry.txt";

/* ------------------------------------------------------------------ */
/* Character handling                                                  */
/* ------------------------------------------------------------------ */

/**
 * Count characters the way the gate counts them: one per Unicode code
 * point, so an astral character counts once, never as two UTF-16 units.
 */
function countChars(text: string): number {
  return [...text].length;
}

/**
 * Count the UTF-8 bytes the file will hold. Kept beside the character
 * count because the leaderboard shows size in bytes and a tie on win rate
 * falls to the smaller text in bytes.
 */
function countBytes(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

/**
 * Characters left before the gate's ceiling. Zero headroom is legal, but
 * a small positive number shows the line was sized on purpose, not cut.
 */
function charsRemaining(text: string): number {
  return MAX_LABEL_CHARS - countChars(text);
}

/**
 * True when the text holds nothing but white space, which the gate refuses.
 */
function isBlank(text: string): boolean {
  return text.trim().length === 0;
}

/**
 * True when the text holds a line break, which would break the single-line
 * rule even when the character count still fits.
 */
function hasLineBreak(text: string): boolean {
  return text.includes("\n") || text.includes("\r");
}

/**
 * True when two spaces sit side by side anywhere in the text. A doubled
 * space inside a 160-character line is filler or a typo, never craft, and
 * the judge's brief asks for no filler.
 */
function hasDoubleSpace(text: string): boolean {
  return text.includes("  ");
}

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */

/**
 * Join the signal word and the body into the finished label. The single
 * space after the colon is part of the label's printed rhythm.
 */
function assembleLabel(signalWord: string, body: string): string {
  return `${signalWord}: ${body}`;
}

/**
 * The finished label for this entry, built once from the fixed parts.
 */
function buildLabel(): string {
  return assembleLabel(SIGNAL_WORD, LABEL_BODY);
}

/**
 * The exact prefix a real printed label carries: signal word, colon, one
 * space. The check below confirms the assembled label opens with it.
 */
function expectedPrefix(signalWord: string): string {
  return `${signalWord}: `;
}

/* ------------------------------------------------------------------ */
/* Validation against the published gate                               */
/* ------------------------------------------------------------------ */

type LabelProblem = {
  rule: string;
  detail: string;
};

type LabelVerdict = {
  valid: boolean;
  problems: Array<LabelProblem>;
};

/**
 * Check the label against every rule the sealed scorer enforces, plus the
 * single-line shape and the printed-label form the judge's brief demands.
 * Each failed rule appends one problem; a label with no problems is valid.
 */
function validateLabel(text: string): LabelVerdict {
  const problems: Array<LabelProblem> = [];
  const chars = countChars(text);

  if (chars < MIN_LABEL_CHARS) {
    problems.push({
      rule: "min-length",
      detail: `label holds ${chars} characters, below the minimum of ${MIN_LABEL_CHARS}`,
    });
  }

  if (chars > MAX_LABEL_CHARS) {
    problems.push({
      rule: "max-length",
      detail: `label holds ${chars} characters, above the maximum of ${MAX_LABEL_CHARS}`,
    });
  }

  if (isBlank(text)) {
    problems.push({
      rule: "not-blank",
      detail: "label holds only white space",
    });
  }

  if (hasLineBreak(text)) {
    problems.push({
      rule: "single-line",
      detail: "label holds a line break",
    });
  }

  if (text !== text.trim()) {
    problems.push({
      rule: "no-edge-space",
      detail: "label starts or ends with white space",
    });
  }

  if (hasDoubleSpace(text)) {
    problems.push({
      rule: "no-double-space",
      detail: "label holds two spaces side by side",
    });
  }

  if (text.startsWith(expectedPrefix(SIGNAL_WORD)) === false) {
    problems.push({
      rule: "signal-word",
      detail: `label must open with "${expectedPrefix(SIGNAL_WORD)}"`,
    });
  }

  if (LABEL_BODY.trim().length === 0) {
    problems.push({
      rule: "non-empty-body",
      detail: "label body holds nothing after the signal word",
    });
  }

  return { valid: problems.length === 0, problems };
}

/**
 * Render one problem as a single readable line for the run report.
 */
function describeProblem(problem: LabelProblem): string {
  return `  [${problem.rule}] ${problem.detail}`;
}

/* ------------------------------------------------------------------ */
/* Output                                                              */
/* ------------------------------------------------------------------ */

/**
 * Write the label to the output path, creating the output directory when
 * it is missing. The file holds exactly the label: no trailing newline,
 * no header, no extra bytes, so its character count equals the label's.
 */
function writeLabel(text: string, outputPath: string): void {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, text, "utf8");
}

/**
 * Read the written file back and confirm it holds exactly the label that
 * was built. A mismatch means the write did not land as intended, and the
 * run must fail loudly instead of reporting a good label that is not there.
 */
function verifyWrittenFile(text: string, outputPath: string): boolean {
  const onDisk = readFileSync(outputPath, "utf8");
  return onDisk === text;
}

/**
 * Print the run report: the label itself, its character and byte counts,
 * the headroom under the ceiling, the gate verdict and the output path.
 * Deterministic output, one line per fact, so two runs print identical
 * reports when the label is unchanged.
 */
function printReport(
  text: string,
  outputPath: string,
  verdict: LabelVerdict,
  roundtripOk: boolean,
): void {
  console.log(`label: ${text}`);
  console.log(`chars: ${countChars(text)}`);
  console.log(`bytes: ${countBytes(text)}`);
  console.log(`headroom: ${charsRemaining(text)}`);
  console.log(`valid: ${verdict.valid ? "yes" : "no"}`);
  for (const problem of verdict.problems) {
    console.log(describeProblem(problem));
  }
  console.log(`roundtrip: ${roundtripOk ? "yes" : "no"}`);
  console.log(`wrote: ${outputPath}`);
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

/**
 * Build the label, validate it against the gate, refuse to write anything
 * when it fails, write the exact label when it passes, and prove the bytes
 * on disk match. The process exits non-zero on a failed gate or a failed
 * round-trip so a broken label can never be mistaken for a submitted one.
 */
function main(): void {
  const label = buildLabel();
  const verdict = validateLabel(label);

  if (verdict.valid === false) {
    printReport(label, OUTPUT_PATH, verdict, false);
    console.error("gate failed: refusing to write an invalid label");
    process.exit(1);
  }

  writeLabel(label, OUTPUT_PATH);
  const roundtripOk = verifyWrittenFile(label, OUTPUT_PATH);
  printReport(label, OUTPUT_PATH, verdict, roundtripOk);

  if (roundtripOk === false) {
    console.error("round-trip failed: file on disk differs from the label");
    process.exit(1);
  }
}

main();
