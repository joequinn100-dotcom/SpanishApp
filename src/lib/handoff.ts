import 'server-only';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tx } from '@/db';
import { db } from './queries';
import { planOf, streak, type SessionRow } from './practice';
import { nextUp } from './progress';

/**
 * Session handoff (SPEC §7).
 *
 * Build Principle 4 calls this first-class, and the reason is that the app is
 * one half of a system whose other half is a human teacher and a chat window.
 * The handoff is what carries state across that boundary — which is why it is
 * written to disk as JSON *and* markdown, not just stored in a column.
 *
 * It is also what makes "resume where you left off" mean something more than
 * durable storage: the next session opens knowing what the last one concluded.
 */

export const HANDOFF_DIR = join(process.cwd(), 'handoffs');

export interface Handoff {
  version: 2;
  session_id: number;
  ended_at: string;
  duration_min: number;
  worked_on: { topic_id: string; accuracy: number; attempts: number; status: string }[];
  errors_committed: { code: string; count: number; evidence: string[] }[];
  errors_avoided: { code: string; clean_streak: number; status: string }[];
  xp: number;
  streak: number;
  next_recommendation: {
    primary: string | null;
    why: string;
    then: string[];
    why_that_order: string;
  };
  resume_prompt: string;
}

function fileStamp(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

/** Build the §7 document from what actually happened in the session. */
export function buildHandoff(s: SessionRow, endedAt: string): Handoff {
  const database = db();
  const plan = planOf(s);

  const workedOn = (
    database
      .prepare(
        `SELECT c.topic_id AS topic_id, count(*) AS attempts
           FROM attempt a JOIN content c ON c.id = a.content_id
          WHERE a.session_id = ?
          GROUP BY c.topic_id`,
      )
      .all(s.id) as { topic_id: string; attempts: number }[]
  ).map((r) => {
    const st = database
      .prepare('SELECT accuracy, status FROM topic_state WHERE topic_id = ?')
      .get(r.topic_id) as { accuracy: number; status: string };
    return {
      topic_id: r.topic_id,
      accuracy: Number((st?.accuracy ?? 0).toFixed(2)),
      attempts: r.attempts,
      status: st?.status ?? 'unknown',
    };
  });

  const committed = (
    database
      .prepare(
        `SELECT e.code AS code, count(*) AS count
           FROM error_event ev JOIN error e ON e.id = ev.error_id
          WHERE ev.session_id = ? AND ev.outcome = 'committed'
          GROUP BY e.code
          ORDER BY count DESC`,
      )
      .all(s.id) as { code: string; count: number }[]
  ).map((r) => ({
    ...r,
    evidence: (
      database
        .prepare(
          `SELECT ev.evidence AS evidence
             FROM error_event ev JOIN error e ON e.id = ev.error_id
            WHERE ev.session_id = ? AND ev.outcome = 'committed' AND e.code = ?
            LIMIT 3`,
        )
        .all(s.id, r.code) as { evidence: string }[]
    ).map((x) => x.evidence),
  }));

  const committedCodes = new Set(committed.map((c) => c.code));
  const avoided = (
    database
      .prepare(
        `SELECT DISTINCT e.code AS code, e.clean_streak AS clean_streak, e.status AS status
           FROM error_event ev JOIN error e ON e.id = ev.error_id
          WHERE ev.session_id = ? AND ev.outcome = 'avoided'`,
      )
      .all(s.id) as { code: string; clean_streak: number; status: string }[]
  ).filter((a) => !committedCodes.has(a.code));

  // The recommendation is derived, not stored: whichever topic the session left
  // furthest from its gate, then the leverage order the home page already uses.
  const weakest = [...workedOn].sort((a, b) => a.accuracy - b.accuracy)[0];
  const then = nextUp(4)
    .map((t) => t.id)
    .filter((id) => id !== weakest?.topic_id)
    .slice(0, 3);

  const why = weakest
    ? `${Math.round(weakest.accuracy * 100)}% rolling accuracy over ${weakest.attempts} items this session, against the 80% consolidation gate.`
    : 'Nothing was attempted this session, so the recommendation falls back to the graph.';

  return {
    version: 2,
    session_id: s.id,
    ended_at: endedAt,
    duration_min: Math.max(
      1,
      Math.round((new Date(endedAt).getTime() - new Date(s.started_at).getTime()) / 60_000),
    ),
    worked_on: workedOn,
    errors_committed: committed,
    errors_avoided: avoided,
    xp: s.xp_earned,
    streak: streak().current,
    next_recommendation: {
      primary: weakest?.topic_id ?? plan.focusTopicId,
      why,
      then,
      why_that_order:
        'Ordered by leverage: topics already in progress first, then by how many further topics each unlocks in the prerequisite graph.',
    },
    resume_prompt:
      'Continue my Spanish fluency training. Review my latest transcript and continue from my error log.',
  };
}

export function handoffMarkdown(h: Handoff): string {
  const lines: string[] = [
    `# Session ${h.session_id} — ${h.ended_at.slice(0, 16).replace('T', ' ')}`,
    '',
    `${h.duration_min} min · ${h.xp} XP · streak ${h.streak}`,
    '',
    '## Worked on',
  ];

  if (h.worked_on.length === 0) lines.push('- nothing logged');
  for (const w of h.worked_on) {
    lines.push(`- \`${w.topic_id}\` — ${Math.round(w.accuracy * 100)}% over ${w.attempts} items (${w.status})`);
  }

  lines.push('', '## Errors committed');
  if (h.errors_committed.length === 0) lines.push('- none');
  for (const e of h.errors_committed) {
    lines.push(`- \`${e.code}\` ×${e.count}${e.evidence.length ? ` — "${e.evidence[0]}"` : ''}`);
  }

  lines.push('', '## Errors avoided');
  if (h.errors_avoided.length === 0) lines.push('- none');
  for (const e of h.errors_avoided) {
    lines.push(`- \`${e.code}\` — clean streak ${e.clean_streak} (${e.status})`);
  }

  lines.push(
    '',
    '## Next',
    `**${h.next_recommendation.primary ?? 'unset'}** — ${h.next_recommendation.why}`,
    '',
    `Then: ${h.next_recommendation.then.map((t) => `\`${t}\``).join(', ') || '—'}`,
    '',
    h.next_recommendation.why_that_order,
    '',
    '---',
    '',
    h.resume_prompt,
    '',
  );

  return lines.join('\n');
}

/**
 * End the session: build the handoff, write both files, store both on the row.
 *
 * The files are written before the transaction commits so that a disk failure
 * aborts the whole thing rather than leaving a session marked ended with no
 * handoff to show for it.
 */
export function finishSession(sessionId: number): Handoff {
  const database = db();
  return tx(database, () => {
    const s = database.prepare('SELECT * FROM session WHERE id = ?').get(sessionId) as SessionRow;
    if (!s) throw new Error(`No session ${sessionId}.`);
    if (s.ended_at) return JSON.parse(s.handoff_json!) as Handoff;

    const endedAt = new Date().toISOString();
    const h = buildHandoff(s, endedAt);
    const md = handoffMarkdown(h);

    mkdirSync(HANDOFF_DIR, { recursive: true });
    const stem = join(HANDOFF_DIR, fileStamp(endedAt));
    writeFileSync(`${stem}.json`, JSON.stringify(h, null, 2), 'utf8');
    writeFileSync(`${stem}.md`, md, 'utf8');

    database
      .prepare('UPDATE session SET ended_at = ?, handoff_json = ?, handoff_md = ? WHERE id = ?')
      .run(endedAt, JSON.stringify(h), md, sessionId);

    return h;
  });
}

/** The most recent finished session's handoff — what the home page resumes from. */
export function latestHandoff(): { handoff: Handoff; markdown: string; sessionId: number } | null {
  const row = db()
    .prepare(
      `SELECT id, handoff_json, handoff_md FROM session
        WHERE ended_at IS NOT NULL AND handoff_json IS NOT NULL
        ORDER BY ended_at DESC LIMIT 1`,
    )
    .get() as { id: number; handoff_json: string; handoff_md: string } | undefined;
  if (!row) return null;
  return {
    sessionId: row.id,
    handoff: JSON.parse(row.handoff_json) as Handoff,
    markdown: row.handoff_md,
  };
}
