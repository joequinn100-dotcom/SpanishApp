# My Spanish Error Log

Every recurring error, with priority, root cause and status. This file is the
source of the app's seeded error database; the app takes over from here and
updates frequency, accuracy and status from live evidence.

Format, one `###` block per error. `Rule` runs to the end of the block and may
span paragraphs — write it in full, not abbreviated.

    ### <title>
    - Category: grammar | tense | vocab | pronunciation | false-friend | collocation
    - Wrong: <what I said>
    - Right: <what it should be>
    - Priority: HIGH | MED | LOW
    - Status: active | improving | resolved
    - Frequency: <count>
    - First seen: YYYY-MM-DD
    - Notes: <optional root cause>
    - B1: <optional upgrade pair, weak version>
    - B2: <optional upgrade pair, native version>
    - Upgrade note: <optional>
    - Rule: <full explanation>

---

## Active

### Gender/number agreement — the Greek -ma masculine group
- Category: grammar
- Wrong: la tema, una problema
- Right: el tema, un problema
- Priority: HIGH
- Status: active
- Frequency: 31
- First seen: 2026-02-11
- Notes: #1 error by volume. Also el sistema, el programa, el clima.
- B1: La tema del presupuesto es un problema grande para nosotros.
- B2: El tema presupuestal es, hoy por hoy, nuestro principal problema.
- Rule: Nouns of Greek origin ending in -ma are MASCULINE despite the -a ending: el tema, un problema, el sistema, el programa, el clima, el idioma, el cronograma, el esquema. The -a is not the Spanish feminine marker; it comes from Greek neuter -ma, which Latin absorbed as masculine. Every word that agrees with the noun must be masculine too — article, demonstrative, quantifier and adjective. Test the whole noun phrase, not just the article: "la problema" and "el problema complicada" are the same mistake at different distances.

### Preterite person endings — yo hablé vs él habló
- Category: tense
- Wrong: yo habló / él hablé
- Right: yo hablé / él habló
- Priority: HIGH
- Status: active
- Frequency: 14
- First seen: 2026-05-06
- Rule: In the preterite the person is carried entirely by the ending, and the two singular endings are minimal pairs distinguished only by the stressed vowel: -é/-í for yo, -ó/-ió for él/ella/usted. Because the written accent falls on the last syllable in both, the only cue is the vowel itself, so a slip changes who did the action. Fix the subject in your head first, then choose the vowel.

### Subjunctive leaking into past-indicative narration
- Category: tense
- Wrong: La semana pasada compremos el material.
- Right: La semana pasada compramos el material.
- Priority: HIGH
- Status: active
- Frequency: 9
- First seen: 2026-05-20
- Notes: Reaching for the "advanced" form under pressure. Narration is indicative.
- Rule: Narrating what actually happened is indicative. The subjunctive appears only when something licenses it: a subordinating "que" after a verb of wish/doubt/influence, a hypothetical "si", "ojalá", "cuando" pointing at the future, or "como si". With none of those present, a finished past event takes the preterite. Rule of thumb: if you could put "ayer" in front of the clause and it still describes a real event, it must be indicative.

### Participio as adjective vs finite verb (avanzó / avanzado)
- Category: grammar
- Wrong: La obra ha avanzó un 20%.
- Right: La obra ha avanzado un 20%.
- Priority: HIGH
- Status: active
- Frequency: 11
- First seen: 2026-03-04
- Notes: Recurring 6+ times across transcripts.
- Rule: "avanzó" is finite — third person singular preterite — and is the only form that can be the main verb of a clause on its own. "avanzado" is the past participle and never stands alone: after HABER it forms the perfect tenses, invariable; after SER/ESTAR or attached to a noun it is an adjective and agrees in gender and number. Test: auxiliary present → participle; no auxiliary and stating an event → finite verb.

### Después used without de
- Category: grammar
- Wrong: Después la reunión, revisamos los planos.
- Right: Después de la reunión, revisamos los planos.
- Priority: HIGH
- Status: active
- Frequency: 38
- First seen: 2026-02-25
- Notes: Very high frequency — 10+ times per week.
- Rule: "Después" alone is an adverb meaning "afterwards" and cannot take a complement. The moment something follows it — noun, pronoun, infinitive or clause — you need DE: después de la reunión, después de eso, después de revisar. Note the contraction del, and the two complement types: después de + infinitive when the subject is the same, después de que + clause when it changes.

### Para used for duration instead of por
- Category: grammar
- Wrong: Trabajamos en el proyecto para tres meses.
- Right: Trabajamos en el proyecto por tres meses.
- Priority: HIGH
- Status: active
- Frequency: 12
- First seen: 2026-04-15
- Rule: Duration is POR, never PARA (durante is equally good in Peru). PARA with a time expression means a DEADLINE. "El contrato es por dos años" runs for two years; "para dos años" says it is destined for a point two years out. Wider split: POR = cause, motive, exchange, means, duration; PARA = purpose, recipient, destination, deadline, standard.

### Collocation gap — acabar con/terminar, comenzar a, seguir + gerundio
- Category: collocation
- Wrong: Seguimos trabajar. Comenzamos excavar. Acabamos con el informe.
- Right: Seguimos trabajando. Comenzamos a excavar. Terminamos el informe.
- Priority: HIGH
- Status: active
- Frequency: 10
- First seen: 2026-06-24
- Rule: COMENZAR/EMPEZAR + A + infinitivo, obligatory "a". SEGUIR/CONTINUAR + GERUNDIO, never infinitive. TERMINAR (algo) = finish a task; ACABAR CON (algo) = put an end to / wipe out; ACABAR DE + infinitivo = to have just done. Using "acabar con" where you mean "terminar" says you destroyed the thing.

### Dropped reflexive pronouns
- Category: grammar
- Wrong: Quiero relajar el fin de semana.
- Right: Quiero relajarme el fin de semana.
- Priority: MED
- Status: active
- Frequency: 17
- First seen: 2026-03-18
- Rule: Pronominal verbs carry their pronoun everywhere and it agrees with the subject. With an infinitive both positions are legal — "quiero relajarme" or "me quiero relajar" — but the pronoun cannot vanish. Many of these change meaning without it: quedar vs quedarse, acordar vs acordarse de.

### Una otra vez → otra vez
- Category: grammar
- Wrong: El cliente pidió una otra vez el mismo cambio.
- Right: El cliente pidió otra vez el mismo cambio.
- Priority: MED
- Status: active
- Frequency: 8
- First seen: 2026-04-01
- Rule: Spanish never puts the indefinite article before otro/otra/otros/otras — "otro" already contains the "an". The definite article IS possible and changes the meaning to "the other". For "one more", use "un/una … más".

### Missing hace + time for "ago"
- Category: grammar
- Wrong: Dos semanas atrás entregamos el expediente.
- Right: Hace dos semanas entregamos el expediente.
- Priority: MED
- Status: active
- Frequency: 7
- First seen: 2026-05-27
- Rule: "Ago" is HACE placed BEFORE the time expression, with the verb in the preterite. Related: "hace + tiempo + que + presente" for something still going on, and "desde hace + tiempo" for the same idea with the verb first.

### Ojalá que / como si missing si
- Category: grammar
- Wrong: Ojalá que lleguen. Habla como fuera el residente.
- Right: Ojalá lleguen. Habla como si fuera el residente.
- Priority: MED
- Status: active
- Frequency: 6
- First seen: 2026-06-10
- Rule: OJALÁ is itself the subordinator, so no "que" — and the tense sets the likelihood: present subjunctive = still possible, imperfect = contrary to fact, pluperfect = regret. COMO SI works the other way: the SI is obligatory and it always takes imperfect or pluperfect subjunctive.

---

## Resolved (maintenance reps only — do not re-drill as errors)

### Ser/estar + gender agreement
- Category: grammar
- Wrong: El obra es retrasada.
- Right: La obra está retrasada.
- Priority: LOW
- Status: resolved
- Frequency: 22
- First seen: 2026-01-14
- Rule: SER identifies and classifies; ESTAR gives a state or result. With participles: "la obra está retrasada" (state) vs "la obra fue retrasada por el municipio" (passive).

### Future simple, regular + irregular stems
- Category: tense
- Wrong: tenaré / poderé
- Right: tendré / podré
- Priority: LOW
- Status: resolved
- Frequency: 19
- First seen: 2026-02-04
- Rule: Future endings attach to the whole infinitive, except twelve contracted stems: tendr-, pondr-, saldr-, vendr-, har-, dir-, podr-, sabr-, querr-, habr-, valdr-, cabr-. Includes the future of probability, now spontaneous (valdrá, pesará).

### Cuando + subjunctive
- Category: grammar
- Wrong: Cuando llega el material, empezamos.
- Right: Cuando llegue el material, empezamos.
- Priority: LOW
- Status: resolved
- Frequency: 15
- First seen: 2026-03-11
- Rule: CUANDO pointing at an unrealised future takes the subjunctive; pointing at a habit or a past fact it takes the indicative.

### Commands — regular, irregular, reflexive
- Category: grammar
- Wrong: Hace el informe.
- Right: Haz el informe.
- Priority: LOW
- Status: resolved
- Frequency: 13
- First seen: 2026-04-08
- Rule: Affirmative tú commands use the third-person present with eight irregulars (di, haz, ve, pon, sal, sé, ten, ven). Usted commands and all negatives use the present subjunctive. Pronouns attach to affirmatives and precede negatives.

### Imperfect subjunctive forms (tuviera, fuera, tuviéramos)
- Category: tense
- Wrong: si tenería más plazo
- Right: si tuviera más plazo
- Priority: LOW
- Status: resolved
- Frequency: 11
- First seen: 2026-05-13
- Rule: Built from the third person plural preterite: tuvieron → tuviera; fueron → fuera. Both -ra and -se sets are valid; -ra dominates in Latin America. The live risk is now using it where the indicative belongs.

### Conditional Type 1 & 2 structure
- Category: grammar
- Wrong: Si tendríamos plazo, terminaríamos.
- Right: Si tuviéramos plazo, terminaríamos.
- Priority: LOW
- Status: resolved
- Frequency: 9
- First seen: 2026-06-03
- Rule: Type 1: si + presente indicativo, + futuro/presente. Type 2: si + imperfecto de subjuntivo, + condicional. The conditional never goes inside the si-clause.
