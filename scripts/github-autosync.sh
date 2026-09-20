#!/bin/sh
# EcomStack GitHub auto-sync. Runs after every commit on main (via .git/hooks/post-commit)
# and pushes to origin. Normal push only - never force. The token is read at run time
# from the GITHUB_AUTOSYNC_TOKEN Replit Secret and is never written to disk or logs.
cd "$(git rev-parse --show-toplevel)" || exit 0
LOG="$(git rev-parse --absolute-git-dir)/github-autosync.log"
ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }
[ "$(git symbolic-ref --short HEAD 2>/dev/null)" = "main" ] || exit 0
if [ -z "$GITHUB_AUTOSYNC_TOKEN" ]; then echo "$(ts) skipped: GITHUB_AUTOSYNC_TOKEN not set" >> "$LOG"; exit 0; fi
if git ls-files | grep -Ev '\.env\.example$' | grep -Eq '(^|/)\.env($|\.)|(^|/)\.replit$'; then
  echo "$(ts) BLOCKED: a .env or .replit file is tracked - not pushing" >> "$LOG"; exit 0
fi
if git -c credential.helper= -c 'credential.helper=!f() { echo username=x-access-token; echo "password=$GITHUB_AUTOSYNC_TOKEN"; }; f' push origin main >> "$LOG" 2>&1; then
  echo "$(ts) pushed $(git rev-parse --short HEAD)" >> "$LOG"
else
  echo "$(ts) push FAILED" >> "$LOG"
fi
