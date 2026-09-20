#!/bin/sh

cd "$(git rev-parse --show-toplevel)" || exit 1

while :; do
  if [ "$(git branch --show-current 2>/dev/null)" = "main" ] && [ -n "$(git rev-list origin/main..main 2>/dev/null)" ]; then
    sh scripts/github-autosync.sh
  fi
  sleep 120
done