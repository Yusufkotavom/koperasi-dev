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

echo "Run: $RUN_ID"
echo "Directory: $RUN_DIR"
echo

while IFS= read -r line; do
  id="$(jq -r '.id' <<<"$line")"
  branch="$(jq -r '.branch' <<<"$line")"
  session="$(jq -r '.tmux_session // empty' <<<"$line")"
  log="$(jq -r '.log' <<<"$line")"

  state="dead"
  if [[ -n "$session" ]] && tmux has-session -t "$session" 2>/dev/null; then
    state="running"
  fi

  echo "[$state] $id  branch=$branch  session=$session"
  if [[ -f "$log" ]]; then
    tail -n 4 "$log" | sed 's/^/    /'
  fi
  echo
done < "$RUN_DIR/processes.jsonl"
