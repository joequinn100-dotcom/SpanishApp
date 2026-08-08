# Start here

Fluencia runs on your own machine. That is what lets it keep every attempt,
every error and every review date in one file that nothing else can touch —
and it is why there is no website to log in to.

## First time (about three minutes)

You need [Node.js 20 or newer](https://nodejs.org) — the LTS installer, then
restart Terminal.

```bash
cd path/to/SpanishApp
npm install
npm run dev
```

Open **http://localhost:3000** and bookmark it.

That is the whole install. The database creates and seeds itself on the first
page load: 97 topics, 26 live errors, 109 vocabulary cards, 246 drills.

## Every day after that

```bash
cd path/to/SpanishApp
npm run dev
```

Then the bookmark. Leave the Terminal window open while you study; closing it
stops the server but loses nothing.

## What is where

| | |
|---|---|
| **Progress** | XP, streak, today's quest, the ring, and the button that starts a session |
| **Curriculum** | all 97 topics by level, with what is locked and why |
| **Error log** | the 26 mistakes the app is actively hunting, by severity |
| **Tenses** | drill any of the 15 tenses on demand, plus the full table for any verb |
| **Vocab** | spaced-repetition cards, due today first |
| **Transcripts** | upload a class transcript; findings are proposed, you accept them |
| **Timeline** | projected date you reach B2, against the exam |
| **Awards** | achievements tied to your actual history |
| **⚙ (top right)** | **Download backup** and **Restore** |

## Saving your work

Nothing needs saving as you go — every answer is written to disk the moment you
press Check, so closing the laptop mid-question loses nothing.

What *does* need doing is getting a copy off the machine, because the database
is the only copy:

1. **⚙ Settings** → **Download backup**
2. Put the file in iCloud Drive, or anywhere that outlives this laptop.

Do that weekly. On a new machine: install as above, then **⚙ Settings** →
**Restore from a backup**.

## If something goes wrong

- **`command not found: npm`** — Node is not installed, or Terminal needs
  restarting after installing it.
- **Port 3000 in use** — `npm run dev -- -p 3001`, then use that port.
- **Want to start completely fresh** — delete the `data/` folder. It rebuilds on
  the next page load. Back up first if you have progress worth keeping.
