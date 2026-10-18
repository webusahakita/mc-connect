#!/usr/bin/env bash
set -euo pipefail
umask 077
STATE=/home/u333915259/.mc-connect-deploy
read -r action revision extra <<< "${SSH_ORIGINAL_COMMAND:-}"
if [[ -n "${extra:-}" || ! "${revision:-}" =~ ^[a-f0-9]{40}$ ]]; then
    echo 'Only a release upload or deployment is allowed.' >&2
    exit 64
fi
case "$action" in
    upload)
        target=$(mktemp "$STATE/incoming/$revision.XXXXXX")
        trap 'rm -f -- "$target"' EXIT
        head -c 104857601 > "$target"
        size=$(wc -c < "$target")
        if (( size == 0 || size > 104857600 )); then
            echo 'Release archive must be between 1 byte and 100 MiB.' >&2
            exit 65
        fi
        mv -- "$target" "$STATE/incoming/$revision.tar.gz"
        sha256sum "$STATE/incoming/$revision.tar.gz"
        ;;
    deploy) exec /usr/bin/bash "$STATE/deploy.sh" "$revision" ;;
    *) echo 'This SSH key only accepts upload/deploy commands.' >&2; exit 64 ;;
esac
