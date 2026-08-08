#!/bin/bash
#
# Double-click this file to start Fluencia.
#
# It exists because the alternative is asking someone to remember three
# Terminal commands and a directory path before they can study — which is a
# tax charged every single day, on the days when motivation is lowest.
#
# What it does: checks Node is installed, installs the app's dependencies the
# first time only, starts the server, and opens the browser once the server is
# actually answering. Closing the window stops the server and loses nothing.

cd "$(dirname "$0")" || exit 1

BOLD=$'\033[1m'; DIM=$'\033[2m'; GREEN=$'\033[32m'; RED=$'\033[31m'; OFF=$'\033[0m'

echo ""
echo "${BOLD}Fluencia${OFF}"
echo "${DIM}$(pwd)${OFF}"
echo ""

# --- Node -------------------------------------------------------------------
# GUI apps and double-clicked scripts do not always inherit the PATH a login
# shell has, so the usual install locations are checked directly before giving
# up. This is the single most common reason "but I installed Node" fails.
for dir in /usr/local/bin /opt/homebrew/bin "$HOME/.nvm/versions/node"/*/bin; do
  [ -x "$dir/node" ] && PATH="$dir:$PATH"
done
export PATH

if ! command -v node >/dev/null 2>&1; then
  echo "${RED}Node.js is not installed.${OFF}"
  echo ""
  echo "Fluencia needs it to run. It is a free, one-time install:"
  echo ""
  echo "  1. The download page will open in a moment."
  echo "  2. Take the button marked ${BOLD}LTS${OFF} — the left-hand one."
  echo "  3. Open the downloaded .pkg and click through it."
  echo "  4. Come back and double-click this file again."
  echo ""
  read -r -p "Press return to open the download page… " _
  open "https://nodejs.org/en/download"
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "${RED}Node $(node -v) is too old${OFF} — Fluencia needs 20 or newer."
  echo "Install the LTS version from nodejs.org, then run this again."
  echo ""
  read -r -p "Press return to open the download page… " _
  open "https://nodejs.org/en/download"
  exit 1
fi

echo "${GREEN}✓${OFF} Node $(node -v)"

# --- Dependencies -----------------------------------------------------------
if [ ! -d node_modules ]; then
  echo ""
  echo "First run — installing the app's dependencies."
  echo "${DIM}A few minutes, once. Every run after this is instant.${OFF}"
  echo ""
  if ! npm install; then
    echo ""
    echo "${RED}That did not finish.${OFF} The most likely cause is the network."
    echo "Try again, and if it keeps failing, send me what is printed above."
    read -r -p "Press return to close… " _
    exit 1
  fi
fi
echo "${GREEN}✓${OFF} Dependencies ready"

# --- Port -------------------------------------------------------------------
# 3000 is a popular port. Rather than failing with an error most people cannot
# act on, find one that is free and use it.
PORT=3000
while lsof -i ":$PORT" >/dev/null 2>&1; do
  PORT=$((PORT + 1))
  if [ "$PORT" -gt 3010 ]; then
    echo "${RED}No free port between 3000 and 3010.${OFF} Restarting the Mac will clear it."
    read -r -p "Press return to close… " _
    exit 1
  fi
done

URL="http://localhost:$PORT"

# --- Start ------------------------------------------------------------------
echo ""
echo "Starting… ${DIM}the browser opens by itself in a few seconds${OFF}"
echo ""

npm run dev -- -p "$PORT" &
SERVER=$!

# Stop the server when this window closes, rather than leaving it running
# invisibly and holding the port for the next attempt.
trap 'kill $SERVER 2>/dev/null' EXIT INT TERM

# Wait for the port to accept a connection before opening the browser: opening
# too early shows a connection error, which is a bad first impression of a
# working app. The check uses bash's own /dev/tcp rather than curl or nc, so it
# depends on nothing that might be missing or wrapped by a proxy.
for _ in $(seq 1 60); do
  if (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null; then
    exec 3<&- 3>&-
    break
  fi
  sleep 0.5
done

# Open regardless of how that loop ended. If the server is merely slow, a page
# that needs one refresh beats a browser that never opened and no explanation.
open "$URL"

echo ""
echo "${GREEN}${BOLD}Fluencia is running at $URL${OFF}"
echo ""
echo "  ${BOLD}Bookmark that address.${OFF}"
echo "  Leave this window open while you study."
echo "  Closing it stops the app — your work is already saved."
echo ""

wait $SERVER
