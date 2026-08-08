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

### macOS will block it the first time

You will almost certainly see:

> *"Start Fluencia.command" cannot be opened because it is from an unidentified
> developer.*

This is expected, and it is not a sign anything is wrong. macOS flags
**everything** that arrives in a downloaded ZIP, whatever is inside it. Click
**OK** to dismiss it, then use either route below. You only do this once — the
launcher clears the flag from its own folder on first run, so every later
double-click just works.

**Route 1 — right-click**

1. **Right-click** (or Control-click) `Start Fluencia.command`
2. Choose **Open**
3. A similar box appears, but this one has an **Open** button. Click it.

**Route 2 — if there is no Open button**

Newer macOS versions moved this:

1. Open **System Settings** → **Privacy & Security**
2. Scroll to the bottom. There is a line saying *"Start Fluencia.command" was
   blocked*, with an **Open Anyway** button. Click it.
3. Double-click the file again.

**Route 3 — the one that always works**

This skips Gatekeeper entirely:

1. Open **Terminal** (press ⌘-Space, type `Terminal`, press return)
2. Type `bash ` — the word bash, then **one space**. Do not press return yet.
3. **Drag** `Start Fluencia.command` from your Finder window into the Terminal
   window. It fills in the location for you.
4. Press **return**.

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

**It says "Symbol not found" or "Node is installed but cannot run on this
Mac"** — the Node you downloaded was built for a newer macOS than yours. The
newest Node always assumes a recent macOS, and nodejs.org offers you the newest
by default. See the next section.

### If your Mac is older

Find your version: **Apple menu → About This Mac**, or in Terminal type
`sw_vers -productVersion` and press return.

| Your macOS | What to install |
|---|---|
| 13 Ventura, 14 Sonoma, 15 Sequoia or newer | The **LTS** button on nodejs.org — any recent version works |
| 12 Monterey or 11 Big Sur | **Node 20**, specifically. Get it from https://nodejs.org/dist/latest-v20.x/ — the file ending `.pkg` |
| 10.15 Catalina or older | Fluencia cannot run on this Mac. Tell me and we will host it instead, so you reach it from any browser including the iPad. |

That last row is not a fudge. Fluencia is built on Next.js 16, which needs Node
20 or newer, and no build of Node 20 runs on macOS 10.15 or below. There is no
combination that works, and pretending otherwise would waste an afternoon.

**Nothing happens when I double-click** — right-click → **Open** → **Open**.

**The browser says it cannot connect** — give it another ten seconds and
refresh. The very first start compiles the app.

**I want to start completely over** — delete the `data` folder inside the
Fluencia folder. It rebuilds itself on the next start. Download a backup first
if you have progress worth keeping.
