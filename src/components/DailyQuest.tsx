import type { GameState } from '@/lib/game';

/**
 * §8's daily quest and streak, in the one place they belong: above the fold on
 * the home page, where "have I done today's minimum" is answered in a glance.
 */
export function DailyQuest({ game }: { game: GameState }) {
  const { quest, streak } = game;

  return (
    <section
      className={`rounded-xl border px-5 py-4 ${
        quest.complete
          ? 'border-teal-700/40 bg-teal-500/5'
          : 'border-slate-800 bg-slate-900/40'
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className={`text-xs uppercase tracking-[0.14em] ${quest.complete ? 'text-teal-400' : 'text-slate-500'}`}>
          {quest.complete ? "Today's quest cleared" : "Today's quest"}
        </p>
        <div className="flex-1" />
        <p className="text-xs text-slate-500">
          <span className="font-serif text-base text-amber-300">{streak.current}</span> day streak
          <span className="mx-2 text-slate-700">·</span>
          {streak.freezes} {streak.freezes === 1 ? 'freeze' : 'freezes'} left
          <span className="mx-2 text-slate-700">·</span>
          {game.xp} XP
        </p>
      </div>

      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {quest.steps.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5">
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] ${
                s.complete
                  ? 'border-teal-500 bg-teal-500 text-slate-950'
                  : 'border-slate-700 text-slate-600'
              }`}
            >
              {s.complete ? '✓' : ''}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-sm ${s.complete ? 'text-slate-400' : 'text-slate-200'}`}>
                {s.label}
              </span>
              <span className="block text-[11px] tabular-nums text-slate-600">
                {Math.min(s.done, s.target)} / {s.target}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {!quest.complete && (
        <p className="mt-3 text-xs text-slate-600">
          Deliberately small — twelve minutes on a bad day. A minimum you can hit while travelling
          is the one that keeps the streak alive.
        </p>
      )}
    </section>
  );
}
