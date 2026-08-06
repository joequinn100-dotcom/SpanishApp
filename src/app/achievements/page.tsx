import Link from 'next/link';
import { gameState } from '@/lib/game';

export const dynamic = 'force-dynamic';

export default function AchievementsPage() {
  const g = gameState();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-teal-400">Achievements</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {g.earned} of {g.achievements.length} earned
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Every one of these is a claim about evidence in your database, not a reward for showing
          up. None can be earned by opening the app.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {g.achievements.map((a) => (
          <div
            key={a.code}
            className={`rounded-xl border p-4 ${
              a.earned
                ? 'border-teal-700/50 bg-teal-500/[0.05]'
                : 'border-slate-800 bg-slate-900/40'
            }`}
          >
            <div className="flex items-baseline gap-2">
              <h2 className={`font-serif text-lg ${a.earned ? 'text-teal-300' : 'text-slate-300'}`}>
                {a.name}
              </h2>
              <div className="flex-1" />
              {a.earned ? (
                <span className="rounded border border-teal-700/60 px-1.5 text-[10px] uppercase tracking-wide text-teal-400">
                  earned
                </span>
              ) : (
                <span className="text-[11px] tabular-nums text-slate-600">{a.progress}</span>
              )}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{a.description}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-slate-500">
        <Link href="/timeline" className="text-teal-500 hover:text-teal-300">
          The timeline
        </Link>{' '}
        is where the number that actually matters lives.
      </p>
    </div>
  );
}
