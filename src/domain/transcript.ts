/**
 * Transcript segmentation (SPEC §6).
 *
 * "Segment into learner utterances only — Lorena's speech is context, not
 * evidence." That sentence is the whole reason this file exists, and getting it
 * wrong is worse than not having it: a teacher's correct Spanish scored as the
 * learner's production would quietly resolve errors that were never fixed.
 *
 * Pure. No database, no clock, no model.
 */

export interface Turn {
  speaker: string | null;
  text: string;
  /** Offsets into the original raw text, so a finding can point back at it. */
  start: number;
  end: number;
}

/**
 * Speaker label at the start of a line.
 *
 * Handles the shapes transcripts actually arrive in:
 *   Lorena: ...            (plain label)
 *   [00:12:03] Joe: ...    (timestamped)
 *   00:12 Speaker 1: ...   (short timestamp)
 *   JOE: ...               (shouty exports)
 *
 * Deliberately strict about what counts as a label — up to four words, no
 * sentence-ending punctuation — because Spanish uses colons mid-sentence and a
 * loose pattern would shred ordinary prose into fake turns.
 */
const LABEL =
  /^[ \t]*(?:\[?\d{1,2}:\d{2}(?::\d{2})?\]?[ \t]*)?([\p{Lu}][\p{L}\p{N}._'-]*(?:[ \t]+[\p{L}\p{N}._'-]+){0,3})[ \t]*:[ \t]+/u;

/**
 * A bare timestamp at the start of a line, with no speaker after it.
 *
 * This is what an ASR export of a class actually looks like — Otter, Zoom and
 * the rest emit a timestamp per utterance and no names at all. Real recordings
 * supplied for this app carried 1,332 of them across six files and not one
 * speaker label.
 *
 * Two things go wrong if this is not handled. The timestamps end up inside the
 * quoted text of every finding, so the review screen shows «0:02:45 Y señora
 * Joy también…» instead of the sentence. And segmentation falls back to
 * splitting on blank lines, which an ASR export does not have — one file
 * collapsed 1,035 lines into 21 turns, which makes the per-turn offsets useless
 * for pointing a finding at its context.
 */
const TIMESTAMP = /^[ \t]*\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?[ \t]*/;

/**
 * Which line-initial labels are really speakers.
 *
 * The pattern alone cannot tell «Joe: hola» from «Revisamos tres puntos: el
 * plazo, el costo…» — both are capitalised words before a colon. Frequency can:
 * a speaker recurs, a sentence-internal colon does not. So a label is accepted
 * if it appears at the start of a line more than once, or if it is one or two
 * words (the shape of a name, and too short to be a clause).
 */
function speakerLabels(lines: string[]): Set<string> {
  const counts = new Map<string, number>();
  for (const line of lines) {
    const m = LABEL.exec(line);
    if (m) counts.set(m[1].trim(), (counts.get(m[1].trim()) ?? 0) + 1);
  }
  const ok = new Set<string>();
  for (const [name, n] of counts) {
    if (n > 1 || name.split(/\s+/).length <= 2) ok.add(name);
  }
  return ok;
}

/** Split a transcript into turns, preserving offsets into the original text. */
export function segment(raw: string): Turn[] {
  const lines = raw.split(/\r?\n/);
  const labels = speakerLabels(lines);
  const turns: Turn[] = [];
  let offset = 0;
  let current: Turn | null = null;

  for (const line of lines) {
    const lineStart = offset;
    offset += line.length + 1; // +1 for the newline consumed by split

    if (line.trim() === '') {
      current = null;
      continue;
    }

    const m = LABEL.exec(line);
    if (m && labels.has(m[1].trim())) {
      const textStart = lineStart + m[0].length;
      current = {
        speaker: m[1].trim(),
        text: line.slice(m[0].length),
        start: textStart,
        end: textStart + line.length - m[0].length,
      };
      turns.push(current);
      continue;
    }

    // A bare timestamp starts a new utterance. The timestamp itself is never
    // part of the text — `start` points past it, so a quote drawn from this
    // turn reads as Spanish rather than as a log line.
    const ts = TIMESTAMP.exec(line);
    if (ts) {
      const rest = line.slice(ts[0].length);
      if (rest.trim() === '') {
        // Timestamp alone on its line: it delimits, it does not carry text.
        current = null;
        continue;
      }
      const textStart = lineStart + ts[0].length;
      current = {
        speaker: null,
        text: rest,
        start: textStart,
        end: textStart + rest.length,
      };
      turns.push(current);
      continue;
    }

    if (current) {
      // Continuation of the previous turn: keep it attached, extend the span.
      current.text += `\n${line}`;
      current.end = lineStart + line.length;
    } else {
      current = { speaker: null, text: line, start: lineStart, end: lineStart + line.length };
      turns.push(current);
    }
  }

  return turns.filter((t) => t.text.trim() !== '');
}

/** Distinct speaker labels, most talkative first. */
export function speakers(turns: Turn[]): { name: string; turns: number; chars: number }[] {
  const map = new Map<string, { name: string; turns: number; chars: number }>();
  for (const t of turns) {
    if (!t.speaker) continue;
    const e = map.get(t.speaker) ?? { name: t.speaker, turns: 0, chars: 0 };
    e.turns += 1;
    e.chars += t.text.length;
    map.set(t.speaker, e);
  }
  return [...map.values()].sort((a, b) => b.chars - a.chars);
}

/**
 * Keep only the learner's turns.
 *
 * When no speaker is named, everything is treated as the learner's. That is not
 * a fallback — it is the real shape of this learner's recordings, and the reason
 * is worth writing down because it is invisible from the file alone: Lorena
 * speaks through his headset, so her voice never reaches the microphone the ASR
 * is transcribing. Every word in a class export is his.
 *
 * The evidence is in the transcripts themselves, for anyone who doubts it later:
 * «Lorena, no tengo audio», third-person references («aprender con Lorena»),
 * and fifty-four bare acknowledgement turns — OK, Sí, Ajá — answering speech
 * that is not in the file.
 *
 * Two consequences follow, and the second is the subtle one.
 *
 * The turns need no attribution, so nothing has to be labelled before analysis.
 *
 * But a correction Lorena speaks and the learner repeats *does* land here as his
 * own production, and it is indistinguishable from the real thing by text alone.
 * SPEC §4 lets only spontaneous evidence resolve an error, so the positive
 * detectors — not this function — carry the burden of not counting a repetition
 * as proof of a gap closed.
 *
 * When speakers *are* named and none matches, the result is empty rather than
 * everything: silently falling back to "all of it" is how another speaker's
 * Spanish would end up in the error log.
 */
export function learnerTurns(turns: Turn[], learner: string | null): Turn[] {
  const labelled = turns.some((t) => t.speaker);
  if (!labelled) return turns;
  if (!learner) return [];
  const want = learner.toLowerCase();
  return turns.filter((t) => (t.speaker ?? '').toLowerCase() === want);
}

/**
 * Flatten turns into the text the detectors run over, with a map back to the
 * original offsets so a finding can be quoted in context.
 */
export function flatten(turns: Turn[]): { text: string; map: { at: number; raw: number }[] } {
  const parts: string[] = [];
  const map: { at: number; raw: number }[] = [];
  let at = 0;
  for (const t of turns) {
    map.push({ at, raw: t.start });
    parts.push(t.text);
    at += t.text.length + 1;
  }
  return { text: parts.join('\n'), map };
}
