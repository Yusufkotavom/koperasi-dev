#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <run_id>"
  exit 1
fi

RUN_ID="$1"
PROJECT_DIR="$(pwd)"
RUN_DIR="$PROJECT_DIR/.codex-orchestrator/runs/$RUN_ID"

if [[ ! -f "$RUN_DIR/processes.jsonl" ]]; then
  echo "Run not found: $RUN_DIR"
  exit 1
fi

while IFS= read -r line; do
  id="$(jq -r '.id' <<<"$line")"
  session="$(jq -r '.tmux_session // empty' <<<"$line")"
  if [[ -n "$session" ]] && tmux has-session -t "$session" 2>/dev/null; then
    tmux kill-session -t "$session"
    echo "Stopped: $id (session=$session)"
  else
    echo "Already stopped: $id"
  fi
done < "$RUN_DIR/processes.jsonl"
