import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { detectKind, parseErrorLog, parseSyllabus, parseVocab } from './seedImport';

const read = (f: string) => readFileSync(new URL(`../../seed/${f}`, import.meta.url), 'utf8');
const errorsMd = read('My_Spanish_Error_Log.md');
const syllabusMd = read('My_Spanish_Syllabus.md');
const vocabMd = read('My_Vocabulary_Bank.md');

describe('seed file round-trip', () => {
  it('identifies each file without being told', () => {
    expect(detectKind(errorsMd)).toBe('errors');
    expect(detectKind(syllabusMd)).toBe('syllabus');
    expect(detectKind(vocabMd)).toBe('vocab');
  });

  it('parses the error log', () => {
    const errs = parseErrorLog(errorsMd);
    expect(errs.length).toBe(17);
    const gender = errs.find((e) => e.title.includes('Greek -ma'));
    expect(gender).toBeDefined();
    expect(gender!.wrong).toBe('la tema, una problema');
    expect(gender!.right).toBe('el tema, un problema');
    expect(gender!.priority).toBe('HIGH');
    expect(gender!.status).toBe('active');
    expect(gender!.frequency).toBe(31);
    expect(gender!.firstSeen).toBe('2026-02-11');
    expect(gender!.rule.length).toBeGreaterThan(200);
    // the rule must stop at the next entry, not swallow the rest of the file
    expect(gender!.rule).not.toContain('Preterite person endings');
    expect(gender!.upgradePair?.b2).toContain('presupuestal');
    expect(gender!.drills.length).toBe(1);
    expect(errs.filter((e) => e.status === 'resolved').length).toBe(6);
  });

  it('parses the syllabus with levels, status and layers', () => {
    const topics = parseSyllabus(syllabusMd);
    expect(topics.length).toBe(13);
    const next = topics.find((t) => t.status === 'next');
    expect(next!.name).toContain('Imperfecto vs. pretérito');
    expect(next!.confidence).toBe(2);
    expect(next!.layer).toBe('accuracy');
    expect(next!.summary).toContain('past narrative');
    expect(topics.filter((t) => t.status === 'covered').length).toBe(4);
    expect(topics.find((t) => t.level === 'Mastery (C1–C2)')).toBeDefined();
  });

  it('parses the vocabulary bank with genders', () => {
    const vocab = parseVocab(vocabMd, '2026-07-29');
    expect(vocab.length).toBe(69);
    expect(new Set(vocab.map((v) => v.section)).size).toBe(7);
    const cronograma = vocab.find((v) => v.term === 'cronograma');
    expect(cronograma!.gender).toBe('m');
    expect(cronograma!.gloss).toBe('schedule');
    expect(cronograma!.example).toContain('días de lluvia');
    expect(vocab.find((v) => v.term === 'valorización')!.gender).toBe('f');
    // connectors carry no gender marker
    expect(vocab.find((v) => v.term === 'sin embargo')!.gender).toBeUndefined();
  });

  it('ignores prose and format documentation around the data', () => {
    expect(parseErrorLog('# Just a heading\n\nSome prose.').length).toBe(0);
    expect(parseVocab('# Notes\n\nNo sections here.', '2026-07-29').length).toBe(0);
  });
});
