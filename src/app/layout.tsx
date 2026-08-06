import type { Metadata } from 'next';
import Link from 'next/link';
import { CommandPalette } from '@/components/CommandPalette';
import { searchIndex } from '@/lib/queries';
import { pendingCount } from '@/lib/transcripts';
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
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-200 antialiased">
        <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
            <Link href="/" className="font-serif text-xl tracking-tight">
              Fluen<span className="text-teal-400">cia</span>
            </Link>
            <nav className="flex gap-4 text-sm text-slate-400">
              <Link href="/" className="transition hover:text-slate-100">Progress</Link>
              <Link href="/curriculum" className="transition hover:text-slate-100">Curriculum</Link>
              <Link href="/errors" className="transition hover:text-slate-100">Error log</Link>
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
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
