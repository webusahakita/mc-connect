#!/usr/bin/env bash
set -euo pipefail

if ! test -t 0; then
    printf 'Buka perintah ini melalui sesi SSH interaktif (ssh -t).\n' >&2
    exit 1
fi

app_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$app_root"
read -r -p 'Email untuk login owner: ' owner_email
read -r -p 'Nama panggung / nama owner: ' owner_name
read -r -s -p 'Password owner (minimal 12 karakter, tidak ditampilkan): ' owner_password
printf '\n'
read -r -s -p 'Ulangi password owner: ' owner_confirmation
printf '\n'
trap 'unset owner_password owner_confirmation' EXIT

if test "${#owner_password}" -lt 12; then
    printf 'Password harus berisi minimal 12 karakter.\n' >&2
    exit 1
fi
if test "$owner_password" != "$owner_confirmation"; then
    printf 'Konfirmasi password tidak cocok.\n' >&2
    exit 1
fi

# Bash hides terminal input; PHP reads the two responses from a non-TTY pipe.
# No password is stored in a file, command argument, or shell history.
printf '%s\n%s\n' "$owner_password" "$owner_confirmation" |
    php artisan mc:create-owner "$owner_email" --name="$owner_name"
unset owner_password owner_confirmation
php artisan up
printf 'Website aktif. Login di https://mc.webusaha.com/login\n'
