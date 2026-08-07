import json, html
import os, sys

# Regenerate docs/field-reference.html — the bookmarkable companion.
#
#   npx tsx --tsconfig tsconfig.scripts.json scripts/dump-reference.ts
#   python3 scripts/build-reference.py
#
# The conjugations are dumped from the live engine rather than retyped, so the
# reference cannot drift from what the drills mark you against.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = os.path.join(ROOT, 'docs') + os.sep
d = json.load(open(S + 'reference-data.json', encoding='utf-8'))
DATA = json.dumps(d, ensure_ascii=False, separators=(',', ':'))

CAT_LABEL = {
    'connector': 'Connectors',
    'set_phrase': 'Meeting phrases',
    'work_noun': 'The words that make a claim precise',
    'verb_pattern': 'Verbs that assign responsibility',
    'collocation': 'Fixed pairings',
    'false_friend': 'False friends',
}
CAT_NOTE = {
    'connector': 'What an examiner listens for. The ones marked <b>+ subj</b> force a subjunctive after them, so each one carries a grammar lesson with it.',
    'set_phrase': 'Disagreeing without conceding is the register this job runs on.',
    'work_noun': 'The difference between «hubo un problema» and «se detectó una interferencia que obligó a reprogramar el vaciado».',
    'verb_pattern': 'Verbs that place responsibility somewhere specific.',
    'collocation': 'Pairings that are fixed — the second word is not a choice.',
    'false_friend': 'The expensive kind, where the wrong word does not sound wrong.',
}
CAT_ORDER = ['connector', 'set_phrase', 'work_noun', 'verb_pattern', 'collocation', 'false_friend']

vocab_html = []
for cat in CAT_ORDER:
    items = [v for v in d['vocab'] if v['category'] == cat]
    if not items:
        continue
    rows = []
    for v in items:
        subj = ' <span class="sub">+ subj</span>' if '+ subjunctive' in v['gloss'] else ''
        gloss = html.escape(v['gloss'].replace(' (+ subjunctive)', ''))
        rows.append(
            f'<div class="lex"><div class="lex-h"><span class="es">{html.escape(v["term"])}</span>'
            f'<span class="lv">{v["level"]}</span></div>'
            f'<div class="en">{gloss}{subj}</div>'
            f'<div class="ex">{html.escape(v["example"])}</div></div>'
        )
    vocab_html.append(
        f'<section class="band"><h3 class="band-h">{CAT_LABEL[cat]}'
        f'<span class="count">{len(items)}</span></h3>'
        f'<p class="band-note">{CAT_NOTE[cat]}</p>'
        f'<div class="lex-grid">{"".join(rows)}</div></section>'
    )
VOCAB_HTML = ''.join(vocab_html)

tpl = open(S + 'field-reference.template.html', encoding='utf-8').read()
out = tpl.replace('/*__DATA__*/', DATA).replace('<!--__VOCAB__-->', VOCAB_HTML)
open(S + 'field-reference.html', 'w', encoding='utf-8').write(out)
print('written', len(out), 'bytes')
