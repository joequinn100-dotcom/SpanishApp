/**
 * Achievements (SPEC §8, mechanic 5).
 *
 * §8 is specific about the kind: "tied to your actual history" — "Greek Slayer"
 * (Greek -ma gender resolved), "Después de nada" (30 days clean on bare
 * después), "Tender Ready" (clear all B2 prof topics). Not participation
 * badges. Every one here is a claim about evidence in the database, evaluated
 * against it, and none can be earned by opening the app.
 *
 * Pure: the caller supplies the snapshot.
 */

export interface Snapshot {
  now: string;
  errors: {
    code: string;
    status: string;
    cleanStreak: number;
    spontaneousOk: number;
    resolvedAt: string | null;
  }[];
  topics: { id: string; level: string; strand: string; status: string; noSchedule: boolean }[];
  vocab: { stage: string }[];
  streakCurrent: number;
  streakLongest: number;
  sessions: number;
  transcripts: number;
  attempts: number;
}

export interface Achievement {
  code: string;
  name: string;
  description: string;
  /** What the learner still has to do, when it is not yet earned. */
  progress: string;
  earned: boolean;
}

const err = (s: Snapshot, code: string) => s.errors.find((e) => e.code === code);

const topicsIn = (s: Snapshot, pred: (t: Snapshot['topics'][number]) => boolean) =>
  s.topics.filter((t) => !t.noSchedule && pred(t));

const clearedAll = (s: Snapshot, pred: (t: Snapshot['topics'][number]) => boolean) => {
  const set = topicsIn(s, pred);
  return { total: set.length, done: set.filter((t) => t.status === 'mastered').length };
};

export function achievements(s: Snapshot): Achievement[] {
  const list: Achievement[] = [];

  const greek = err(s, 'noun.greek_ma');
  list.push({
    code: 'greek_slayer',
    name: 'Greek Slayer',
    description: 'The Greek -ma group resolved — «el tema», «el problema», every time.',
    earned: greek?.status === 'resolved',
    progress: greek
      ? `clean streak ${greek.cleanStreak}/12, spontaneous ${greek.spontaneousOk}/2`
      : 'error not in the log',
  });

  const desp = err(s, 'prep.despues_de');
  list.push({
    code: 'despues_de_nada',
    name: 'Después de nada',
    description: 'Bare «después» extinct: the preposition never goes missing again.',
    earned: desp?.status === 'resolved',
    progress: desp ? `clean streak ${desp.cleanStreak}/12` : 'error not in the log',
  });

  const subj = err(s, 'mood.subj_imperfecto_missing');
  list.push({
    code: 'si_tuviera',
    name: 'Si tuviera',
    description:
      'The imperfect subjunctive acquired — the highest-severity gap in the log, closed.',
    earned: subj?.status === 'resolved' || subj?.status === 'consolidating',
    progress: subj
      ? `clean streak ${subj.cleanStreak}/12, spontaneous ${subj.spontaneousOk}/2`
      : 'error not in the log',
  });

  const tender = clearedAll(s, (t) => t.level === 'B2' && t.strand === 'prof');
  list.push({
    code: 'tender_ready',
    name: 'Tender Ready',
    description: 'Every B2 professional topic mastered — licitación, negociación, the lot.',
    earned: tender.total > 0 && tender.done === tender.total,
    progress: `${tender.done}/${tender.total} B2 professional topics`,
  });

  const past = clearedAll(
    s,
    (t) => t.level === 'B1' && t.strand === 'verb',
  );
  list.push({
    code: 'past_master',
    name: 'Past Master',
    description: 'The whole B1 verb spine: preterite, imperfect, the contrast, the pluperfect.',
    earned: past.total > 0 && past.done === past.total,
    progress: `${past.done}/${past.total} B1 verb topics`,
  });

  const resolved = s.errors.filter((e) => e.status === 'resolved').length;
  list.push({
    code: 'ten_down',
    name: 'Ten Down',
    description: 'Ten errors carried all the way to resolved on spontaneous evidence.',
    earned: resolved >= 10,
    progress: `${resolved}/10 resolved`,
  });

  const spoken = s.vocab.filter((v) => v.stage === 'spontaneous').length;
  list.push({
    code: 'own_words',
    name: 'In My Own Words',
    description: 'Twenty seeded words used unprompted in a transcript — not recalled, used.',
    earned: spoken >= 20,
    progress: `${spoken}/20 words reached for`,
  });

  list.push({
    code: 'evidence_based',
    name: 'Evidence Based',
    description: 'Five class transcripts reviewed. The app only knows what you feed it.',
    earned: s.transcripts >= 5,
    progress: `${s.transcripts}/5 transcripts`,
  });

  list.push({
    code: 'fortnight',
    name: 'Fortnight',
    description: 'Fourteen consecutive days. Two freezes a month exist so this survives travel.',
    earned: s.streakLongest >= 14,
    progress: `longest streak ${s.streakLongest}/14`,
  });

  list.push({
    code: 'thousand',
    name: 'A Thousand Answers',
    description: 'A thousand drill attempts logged — right or wrong, all of it evidence.',
    earned: s.attempts >= 1000,
    progress: `${s.attempts}/1000 attempts`,
  });

  return list;
}

/**
 * The daily quest (SPEC §8, mechanic 6): "1 warm-up + 1 new topic segment +
 * 5 vocab reviews. Small, completable in 12 minutes on a bad day."
 *
 * Deliberately small. §8's own argument is that the streak breaks on the day
 * the minimum is too big, and a broken streak is where these apps lose people.
 */
export interface QuestStep {
  label: string;
  done: number;
  target: number;
  complete: boolean;
}

export function dailyQuest(today: {
  warmupItems: number;
  topicItems: number;
  vocabReviews: number;
}): { steps: QuestStep[]; complete: boolean } {
  const steps: QuestStep[] = [
    { label: 'Warm-up items', done: today.warmupItems, target: 1, complete: today.warmupItems >= 1 },
    { label: 'New material', done: today.topicItems, target: 1, complete: today.topicItems >= 1 },
    { label: 'Vocab reviews', done: today.vocabReviews, target: 5, complete: today.vocabReviews >= 5 },
  ];
  return { steps, complete: steps.every((s) => s.complete) };
}
