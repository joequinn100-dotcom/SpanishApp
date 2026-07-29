/**
 * Text-to-speech for every example sentence and drill item.
 * Latin American voices only — es-PE first, then es-MX, then any es-419/es-US.
 */

const PREFERRED = ['es-PE', 'es-MX', 'es-419', 'es-US', 'es-CO', 'es-AR', 'es-CL'];

let cached: SpeechSynthesisVoice[] = [];

export function voices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const all = window.speechSynthesis.getVoices();
  if (all.length) cached = all;
  return cached.filter((v) => v.lang.toLowerCase().startsWith('es'));
}

export function onVoicesReady(cb: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.onvoiceschanged = () => {
    cached = window.speechSynthesis.getVoices();
    cb();
  };
}

export function pickVoice(preferredURI?: string): SpeechSynthesisVoice | undefined {
  const list = voices();
  if (!list.length) return undefined;
  if (preferredURI) {
    const exact = list.find((v) => v.voiceURI === preferredURI);
    if (exact) return exact;
  }
  for (const tag of PREFERRED) {
    const hit = list.find((v) => v.lang.replace('_', '-').toLowerCase() === tag.toLowerCase());
    if (hit) return hit;
  }
  // anything Spanish that isn't peninsular
  return list.find((v) => !v.lang.toLowerCase().startsWith('es-es')) ?? list[0];
}

export function speak(text: string, opts: { voiceURI?: string; rate?: number } = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice(opts.voiceURI);
  if (v) {
    u.voice = v;
    u.lang = v.lang;
  } else {
    u.lang = 'es-MX';
  }
  u.rate = opts.rate ?? 0.95;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export const speechAvailable = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * Words whose spelling misleads an English-speaking reader.
 * Flagged with a "listen and repeat" control wherever they appear.
 */
export const PRONUNCIATION_TRAPS: { word: string; why: string }[] = [
  { word: 'caiga', why: '"ai" is one diphthong — KÁI-ga, not ka-I-ga. Same in caigo, traiga, salga… but note the g is hard.' },
  { word: 'caigo', why: 'KÁI-go. The stress sits on the diphthong, not on the -go.' },
  { word: 'hubo', why: 'The h is silent: Ú-bo. Contrast with "había" (a-BÍ-a) — different verb use entirely.' },
  { word: 'había', why: 'a-BÍ-a, three syllables. The í breaks the diphthong; that written accent is doing real work.' },
  { word: 'valorización', why: 'va-lo-ri-sa-SIÓN in LatAm — the z is /s/, never the peninsular /θ/.' },
  { word: 'ejecución', why: 'The j is a strong /x/: e-xe-ku-SIÓN.' },
  { word: 'obra', why: 'The b is a soft fricative between vowels — Ó-βra, not an English hard B.' },
  { word: 'ingeniero', why: 'in-xe-NIÉ-ro. The g before e/i is /x/, like the j.' },
  { word: 'cronograma', why: 'kro-no-GRÁ-ma. Single tapped r, and stress on the penultimate.' },
  { word: 'adicional', why: 'a-di-sio-NÁL — stress on the final syllable, unlike English "additional".' },
  { word: 'presupuesto', why: 'pre-su-PUÉS-to. Don\'t swallow the "ue" diphthong.' },
  { word: 'reunión', why: 'rreu-NIÓN — initial r is trilled, and the accent forces the final stress.' },
  { word: 'licitación', why: 'li-si-ta-SIÓN. Four syllables before the stress; keep each vowel clean.' },
  { word: 'después', why: 'des-PUÉS — final stress. English speakers tend to flatten it to DES-pues.' },
  { word: 'construyó', why: 'kons-tru-YÓ. The y absorbs the i of -ió; stress on the last syllable.' },
];

export function trapsIn(text: string): { word: string; why: string }[] {
  const lower = text.toLowerCase();
  return PRONUNCIATION_TRAPS.filter((t) => lower.includes(t.word.toLowerCase()));
}
