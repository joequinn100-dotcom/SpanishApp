import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractPdfText } from './pdf';
import { segment, learnerTurns, flatten } from '@/domain/transcript';
import { analyze } from '@/domain/detectors';

const fixture = (name: string) =>
  new Uint8Array(readFileSync(join(__dirname, '__fixtures__', name)));

describe('extractPdfText', () => {
  it('reads every page', async () => {
    const r = await extractPdfText(fixture('clase.pdf'));
    expect(r.pages).toBe(2);
    expect(r.looksScanned).toBe(false);
  });

  it('reconstructs lines, which is the whole point', async () => {
    // A PDF has glyphs at coordinates, not lines. Naive extraction returns one
    // unbroken wall of text, and the speaker segmentation — which works line by
    // line — then finds nothing at all.
    const { text } = await extractPdfText(fixture('clase.pdf'));
    const lines = text.split('\n').filter((l) => l.trim());
    expect(lines.length).toBeGreaterThan(10);
    expect(lines.some((l) => l.startsWith('Lorena:'))).toBe(true);
    expect(lines.some((l) => l.startsWith('Joe:'))).toBe(true);
  });

  it('keeps the reading order top-down across pages', async () => {
    const { text } = await extractPdfText(fixture('clase.pdf'));
    expect(text.indexOf('Buenos dias')).toBeLessThan(text.indexOf('Quisiera que revisara'));
  });

  it('says so when a PDF is a scan rather than failing silently', async () => {
    // An empty transcript with no explanation is the worst outcome here: it
    // looks like the class went perfectly.
    const r = await extractPdfText(fixture('scan.pdf'));
    expect(r.looksScanned).toBe(true);
  });

  it('feeds the transcript pipeline end to end', async () => {
    const { text } = await extractPdfText(fixture('clase.pdf'));
    const mine = learnerTurns(segment(text), 'Joe');
    expect(mine.length).toBeGreaterThan(5);

    const findings = analyze(flatten(mine).text);
    const codes = findings.filter((f) => f.kind === 'error').map((f) => f.errorCode);
    expect(codes).toContain('noun.greek_ma');
    expect(codes).toContain('prep.buscar_para');
    expect(codes).toContain('verb.hace_ago');

    // And the teacher's corrections must not be scored as the learner's errors.
    for (const f of findings) expect(f.quote).not.toContain('Son masculinos');
  });
});
