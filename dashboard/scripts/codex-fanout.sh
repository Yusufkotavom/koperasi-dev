#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <jobs.json> [base-branch]"
  exit 1
fi

JOBS_FILE="$1"
BASE_BRANCH="${2:-$(git -C "$(pwd)" rev-parse --abbrev-ref HEAD)}"
PROJECT_DIR="$(pwd)"
REPO_ROOT="$(git -C "$PROJECT_DIR" rev-parse --show-toplevel)"
RUN_ID="$(date +%Y%m%d_%H%M%S)"
RUN_DIR="$PROJECT_DIR/.codex-orchestrator/runs/$RUN_ID"
WT_ROOT="/tmp/codex-fanout/$RUN_ID"

mkdir -p "$RUN_DIR/logs" "$WT_ROOT"

for cmd in jq codex tmux; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "$cmd is required"; exit 1; }
done

cp "$JOBS_FILE" "$RUN_DIR/jobs.json"
printf "run_id=%s\nbase_branch=%s\nproject_dir=%s\nrepo_root=%s\n" "$RUN_ID" "$BASE_BRANCH" "$PROJECT_DIR" "$REPO_ROOT" > "$RUN_DIR/meta.env"

count="$(jq 'length' "$JOBS_FILE")"
[[ "$count" -gt 0 ]] || { echo "No jobs found"; exit 1; }

echo "Starting $count Codex jobs (run_id=$RUN_ID)"

for i in $(seq 0 $((count - 1))); do
  id="$(jq -r ".[$i].id" "$JOBS_FILE")"
  prompt="$(jq -r ".[$i].prompt" "$JOBS_FILE")"
  mode="$(jq -r ".[$i].mode // \"full-auto\"" "$JOBS_FILE")"
  branch_override="$(jq -r ".[$i].branch // empty" "$JOBS_FILE")"

  [[ -n "$id" && "$id" != "null" ]] || id="job_$((i+1))"
  branch="${branch_override:-codex/${RUN_ID}/${id}}"

  wt="$WT_ROOT/$id"
  log="$RUN_DIR/logs/$id.log"
  prompt_file="$RUN_DIR/logs/$id.prompt.txt"
  session_name="codex_${RUN_ID}_${id}"
  worker_cwd="$wt"

  printf "%s\n" "$prompt" > "$prompt_file"
  git -C "$REPO_ROOT" worktree add -b "$branch" "$wt" "$BASE_BRANCH" >/dev/null
  if [[ -d "$wt/dashboard" ]]; then
    worker_cwd="$wt/dashboard"
  fi
  if [[ -d "$PROJECT_DIR/node_modules" && ! -e "$worker_cwd/node_modules" ]]; then
    ln -s "$PROJECT_DIR/node_modules" "$worker_cwd/node_modules"
  fi

  codex_flag="--full-auto"
  if [[ "$mode" == "danger" ]]; then
    codex_flag="--dangerously-bypass-approvals-and-sandbox"
  fi

  tmux new-session -d -s "$session_name" "cd '$worker_cwd' && codex exec $codex_flag --disable plugins --disable apps \"\$(cat '$prompt_file')\" 2>&1 | tee '$log'"

  printf '{"id":"%s","branch":"%s","worktree":"%s","log":"%s","mode":"%s","tmux_session":"%s"}\n' \
    "$id" "$branch" "$wt" "$log" "$mode" "$session_name" >> "$RUN_DIR/processes.jsonl"

  echo "Launched: $id (session=$session_name)"
done

echo
echo "Run created: $RUN_DIR"
echo "Check status: ./scripts/codex-status.sh $RUN_ID"
