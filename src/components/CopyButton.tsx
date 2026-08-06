'use client';

import { useState } from 'react';

/** SPEC §7: the handoff is "shown on screen with a Copy button". */
export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
      className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
    >
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}
