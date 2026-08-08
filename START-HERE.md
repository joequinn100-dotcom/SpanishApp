# Start here

Fluencia runs on your own Mac. That is what lets it keep every attempt, every
error and every review date in one file nothing else can touch — and it is why
there is no website to log into.

Two one-time steps, then it is a double-click forever after.

---

## Step 1 — Install Node.js (once, about 3 minutes)

Fluencia is built on it. Free, from the people who make it.

1. Go to **https://nodejs.org**
2. Click the big button marked **LTS** (the left-hand one).
3. Open the downloaded file — it ends in `.pkg` — and click Continue / Install
   through it. Your Mac password may be asked for; that is normal.

Nothing to configure. There is no Node app in your Applications folder
afterwards, and that is expected.

---

## Step 2 — Download Fluencia (once)

1. Go to **https://github.com/joequinn100-dotcom/SpanishApp/tree/claude/fluencia-v2**
2. Green **Code** button → **Download ZIP**.
3. Open the downloaded ZIP — it unzips to a folder called
   **SpanishApp-claude-fluencia-v2**.
4. Drag that folder to your **Documents**. Rename it to **Fluencia** if you like.

---

## Step 3 — Start it

Open the folder and **double-click `Start Fluencia.command`**.

A black Terminal window appears, and after a few seconds your browser opens at
**http://localhost:3000**. **Bookmark that page.**

The first start takes a few minutes — it is fetching what the app needs, once.
Every start after that takes seconds.

> **If macOS says it "cannot be opened because it is from an unidentified
> developer":** right-click the file → **Open** → **Open**. You only do this
> once. macOS asks because the file came from the internet, not because
> anything is wrong with it.

Leave the Terminal window open while you study. Closing it stops the app and
loses nothing — every answer is already on disk.

---

## Every day after that

Double-click `Start Fluencia.command`, or use your bookmark once it is running.

---

## What is where

| | |
|---|---|
| **Progress** | XP, streak, today's quest, and the button that starts a session |
| **Curriculum** | all 97 topics by level, and what is locked behind what |
| **Error log** | the 26 mistakes the app is actively hunting, by severity |
| **Tenses** | drill any of the 15 tenses, plus the full table for any verb |
| **Vocab** | spaced-repetition cards, due today first |
| **Transcripts** | upload a class transcript — findings are proposed, you accept them |
| **Timeline** | the projected date you reach B2, against the exam |
| **⚙ top right** | **Download backup** and **Restore** |

---

## Saving your work

Nothing needs saving as you go. Every answer is written to disk the moment you
press Check, so closing the laptop mid-question loses nothing.

What does need doing is getting a copy **off** the Mac, because that file is the
only copy:

1. **⚙** (top right) → **Download backup**
2. Put the file in iCloud Drive, or anywhere that outlives this laptop.

Once a week is plenty. On a new Mac: repeat steps 1–3 above, then
**⚙ → Restore from a backup**.

---

## If something goes wrong

**The Terminal window says Node.js is not installed** — do Step 1, then
double-click the file again.

**Nothing happens when I double-click** — right-click → **Open** → **Open**.

**The browser says it cannot connect** — give it another ten seconds and
refresh. The very first start compiles the app.

**I want to start completely over** — delete the `data` folder inside the
Fluencia folder. It rebuilds itself on the next start. Download a backup first
if you have progress worth keeping.
