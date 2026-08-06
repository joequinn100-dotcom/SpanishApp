import type { Metadata } from 'next';
import Link from 'next/link';
import { CommandPalette } from '@/components/CommandPalette';
import { searchIndex } from '@/lib/queries';
import { pendingCount } from '@/lib/transcripts';
import { dueVocabCount } from '@/lib/vocab';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fluencia',
  description: 'Spanish fluency training — B1 → B2, Lima',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const index = searchIndex();
  // Findings waiting on a decision. Surfaced in the nav because an unreviewed
  // transcript is evidence the error log has not seen yet.
  const pending = pendingCount();
  const vocabDue = dueVocabCount();
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-200 antialiased">
        <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
          {/* Seven nav links plus a search button overflow a phone, so the bar
              wraps rather than pushing the whole app sideways. */}
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-6">
            <Link href="/" className="font-serif text-xl tracking-tight">
              Fluen<span className="text-teal-400">cia</span>
            </Link>
            <nav className="order-3 flex w-full flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400 sm:order-none sm:w-auto">
              <Link href="/" className="transition hover:text-slate-100">Progress</Link>
              <Link href="/timeline" className="transition hover:text-slate-100">Timeline</Link>
              <Link href="/curriculum" className="transition hover:text-slate-100">Curriculum</Link>
              <Link href="/errors" className="transition hover:text-slate-100">Error log</Link>
              <Link href="/achievements" className="transition hover:text-slate-100">Awards</Link>
              <Link href="/vocab" className="inline-flex items-center gap-1.5 transition hover:text-slate-100">
                Vocab
                {vocabDue > 0 && (
                  <span className="rounded-full bg-teal-500/20 px-1.5 text-[10px] text-teal-300">
                    {vocabDue}
                  </span>
                )}
              </Link>
              <Link href="/transcripts" className="inline-flex items-center gap-1.5 transition hover:text-slate-100">
                Transcripts
                {pending > 0 && (
                  <span className="rounded-full bg-amber-500/20 px-1.5 text-[10px] text-amber-300">
                    {pending}
                  </span>
                )}
              </Link>
            </nav>
            <div className="flex-1" />
            <CommandPalette index={index} />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
