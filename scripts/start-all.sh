#!/usr/bin/env bash

set -euo pipefail

check_only=false
skip_checks=false

for arg in "$@"; do
  case "$arg" in
    --check-only)
      check_only=true
      ;;
    --skip-checks)
      skip_checks=true
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

if [[ "$check_only" == true && "$skip_checks" == true ]]; then
  echo "Choose either --check-only or --skip-checks, not both." >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
backend_dir="$repo_root/backend"
backend_python="$backend_dir/.venv/bin/python"
model_path="$backend_dir/yolov8n.pt"
node_modules_dir="$repo_root/node_modules"

assert_path_exists() {
  local path="$1"
  local label="$2"

  if [[ ! -e "$path" ]]; then
    echo "$label missing: $path" >&2
    exit 1
  fi
}

run_check_step() {
  local label="$1"
  shift

  echo "Checking $label..."
  "$@" >/dev/null
  echo "OK: $label"
}

if [[ "$skip_checks" != true ]]; then
  run_check_step "Node.js" node --version
  run_check_step "npm" npm --version
  run_check_step "backend virtualenv python" assert_path_exists "$backend_python" "Backend Python"
  run_check_step "backend model file" assert_path_exists "$model_path" "YOLO model"
  run_check_step "frontend node_modules" assert_path_exists "$node_modules_dir" "node_modules"
  run_check_step "backend Python imports" "$backend_python" -c "import cv2, fastapi, numpy, torch, ultralytics, uvicorn"
  run_check_step "Expo package manifest" npm --prefix "$repo_root" run --silent start -- --help

  if [[ "$check_only" == true ]]; then
    echo
    echo "Environment checks passed. No services were started."
    exit 0
  fi
fi

cleanup() {
  if [[ -n "${backend_pid:-}" ]] && kill -0 "$backend_pid" >/dev/null 2>&1; then
    echo
    echo "Stopping backend..."
    kill "$backend_pid" >/dev/null 2>&1 || true
    wait "$backend_pid" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

echo
echo "Starting backend in the background..."
(
  cd "$repo_root"
  exec "$backend_python" -m uvicorn backend.app:app --app-dir "$repo_root" --host 0.0.0.0 --port 8000
) &
backend_pid=$!

echo "Starting Expo in the current terminal..."
cd "$repo_root"
npm start
