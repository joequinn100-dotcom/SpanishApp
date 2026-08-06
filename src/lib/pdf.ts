import 'server-only';

/**
 * PDF text extraction (SPEC §6: "paste or upload (txt/pdf/docx)").
 *
 * A PDF has no lines. It has glyphs at coordinates, and any notion of "line"
 * or "paragraph" is reconstructed from their positions — which is why naive
 * extraction turns a class transcript into one unbroken wall of text and the
 * speaker segmentation, which works line by line, then finds nothing at all.
 *
 * So this does not just concatenate strings. It groups text items into lines by
 * their vertical position, orders them top-down, and emits real newlines. That
 * is what makes `Lorena:` and `Joe:` recoverable downstream.
 */

/** Two glyphs within this many points vertically are on the same line. */
const LINE_TOLERANCE = 3;

export interface PdfText {
  text: string;
  pages: number;
  /** True when the file yielded almost nothing — usually a scan with no text layer. */
  looksScanned: boolean;
}

interface TextItem {
  str: string;
  transform: number[];
  hasEOL?: boolean;
}

export async function extractPdfText(data: Uint8Array): Promise<PdfText> {
  // Imported lazily: pdfjs is large, and every page that does not ingest a PDF
  // should not pay for it.
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');

  // getDocument returns a loading task; the document hangs off its promise, and
  // it is the task that owns teardown.
  const task = getDocument({
    data,
    // No worker in Node, and no network for standard fonts — neither is needed
    // for text extraction, and leaving them on produces console noise.
    useWorkerFetch: false,
    useSystemFonts: true,
  });
  const doc = await task.promise;

  const pages: string[] = [];

  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    const items = content.items as TextItem[];

    // Group by baseline y. transform[5] is the y translation; transform[4] is x.
    const lines: { y: number; parts: { x: number; str: string }[] }[] = [];
    for (const item of items) {
      if (!item.str) continue;
      const x = item.transform[4];
      const y = item.transform[5];
      const line = lines.find((l) => Math.abs(l.y - y) <= LINE_TOLERANCE);
      if (line) line.parts.push({ x, str: item.str });
      else lines.push({ y, parts: [{ x, str: item.str }] });
    }

    const text = lines
      // Descending y: PDF origin is bottom-left, so larger y is higher up.
      .sort((a, b) => b.y - a.y)
      .map((l) =>
        l.parts
          .sort((a, b) => a.x - b.x)
          .map((p) => p.str)
          .join('')
          .replace(/\s+/g, ' ')
          .trim(),
      )
      .filter((l) => l !== '')
      .join('\n');

    pages.push(text);
    page.cleanup();
  }

  const numPages = doc.numPages;
  await task.destroy();

  const text = pages.join('\n\n');
  return {
    text,
    pages: numPages,
    // A page of a text-layer PDF carries hundreds of characters. A scan carries
    // none, and the honest answer is "this needs OCR", not an empty transcript.
    looksScanned: text.replace(/\s/g, '').length < numPages * 40,
  };
}
