const STYLES: Record<string, string> = {
  // topic states
  locked: 'border-slate-700 text-slate-500',
  available: 'border-sky-700/50 bg-sky-500/10 text-sky-300',
  studying: 'border-amber-600/50 bg-amber-500/10 text-amber-300',
  consolidating: 'border-violet-600/50 bg-violet-500/10 text-violet-300',
  mastered: 'border-emerald-600/50 bg-emerald-500/10 text-emerald-300',
  // error states
  active: 'border-red-700/50 bg-red-500/10 text-red-300',
  regressed: 'border-red-500/60 bg-red-500/20 text-red-200',
  improving: 'border-amber-600/50 bg-amber-500/10 text-amber-300',
  resolved: 'border-emerald-600/50 bg-emerald-500/10 text-emerald-300',
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        STYLES[status] ?? 'border-slate-700 text-slate-500'
      }`}
    >
      {status}
    </span>
  );
}

export function SeverityDots({ severity }: { severity: number }) {
  return (
    <span className="flex shrink-0 gap-0.5" title={`Severity ${severity}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`h-1.5 w-1.5 rounded-full ${
            n <= severity
              ? severity >= 5 ? 'bg-red-400' : severity >= 4 ? 'bg-orange-400' : 'bg-amber-400'
              : 'bg-slate-700'
          }`}
        />
      ))}
    </span>
  );
}
