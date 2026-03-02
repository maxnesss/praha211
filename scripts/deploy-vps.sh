#!/usr/bin/env bash

set -euo pipefail

SSH_HOST="${1:-praha112}"
BRANCH="${2:-main}"
REMOTE_SCRIPT_PATH="${REMOTE_SCRIPT_PATH:-/home/maxim/apps/praha211/scripts/deploy-remote.sh}"

ssh "$SSH_HOST" "bash \"$REMOTE_SCRIPT_PATH\" \"$BRANCH\""
