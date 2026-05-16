#!/usr/bin/env bash
#
# common.sh -- Shared helper functions for Agency shell scripts.
#
# Source this file from other scripts:
#   SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
#   source "$SCRIPT_DIR/common.sh"
#

normalize_node_entry_path() {
  local path="$1"
  if command -v cygpath >/dev/null 2>&1; then
    local windows_path
    windows_path="$(cygpath -w "$path")"
    printf '%s\n' "${windows_path//\\//}"
    return
  fi
  printf '%s\n' "$path"
}
