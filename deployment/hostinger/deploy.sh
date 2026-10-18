#!/usr/bin/env bash
set -euo pipefail
umask 077
STATE=/home/u333915259/.mc-connect-deploy
SITE=/home/u333915259/domains/mc.webusaha.com
APP=$SITE/mc-connect
WEB=$SITE/public_html
revision=${1:-}
[[ "$revision" =~ ^[a-f0-9]{40}$ ]] || exit 64
[[ "$(realpath "$SITE")" == "$SITE" && "$(realpath "$APP")" == "$APP" && "$(realpath "$WEB")" == "$WEB" ]] || exit 65
[[ -f "$APP/.env" && -f "$APP/artisan" && -L "$APP/public" && -L "$WEB/storage" ]] || exit 65
exec 9> "$STATE/deploy.lock"
flock -w 120 9 || { echo 'Another deployment is still running.' >&2; exit 75; }
[[ ! -f "$APP/storage/framework/down" ]] || { echo 'Website is already in maintenance. Deployment stopped.' >&2; exit 75; }
archive=$STATE/incoming/$revision.tar.gz
[[ -f "$archive" ]] || { echo 'Upload this revision first.' >&2; exit 66; }
work=$(mktemp -d "$STATE/releases/$revision.XXXXXX")
backup=$SITE/deployment-backups/$(date -u +%Y%m%d-%H%M%S)-${revision:0:12}
options=$work/mysql.cnf
changed=0
maintenance=0
finished=0

app_sync() {
    rsync -a --delete --exclude='/.env' --exclude='/storage/***' --exclude='/public' \
        --exclude='/bootstrap/cache/***' "$1/" "$APP/"
}
web_sync() {
    rsync -a --delete --exclude='/uploads/***' --exclude='/storage' \
        --exclude='/.well-known/***' --exclude='/.user.ini' "$1/" "$WEB/"
    if [[ -f "$1/uploads/.htaccess" ]]; then
        mkdir -p "$WEB/uploads"
        cp -- "$1/uploads/.htaccess" "$WEB/uploads/.htaccess"
        chmod 644 "$WEB/uploads/.htaccess"
    fi
}
clear_bootstrap_cache() {
    find "$APP/bootstrap/cache" -maxdepth 1 -type f -name '*.php' -delete
}
cleanup() {
    status=$?
    trap - EXIT
    rm -f -- "$options"
    if (( finished == 0 && maintenance == 1 )); then
        echo 'Deployment failed; restoring the previous application files.' >&2
        set +e
        restore_status=0
        if (( changed == 1 )); then
            (cd "$APP" && php artisan down --retry=60) >/dev/null 2>&1
            app_sync "$backup/app" || restore_status=1
            web_sync "$backup/public_html" || restore_status=1
            clear_bootstrap_cache || restore_status=1
            rsync -a "$backup/bootstrap-cache/" "$APP/bootstrap/cache/" || restore_status=1
        fi
        if (( restore_status == 0 )); then
            (cd "$APP" && php artisan up) || restore_status=1
        fi
        if (( restore_status != 0 )); then
            echo 'Automatic file restore needs attention; website remains in maintenance.' >&2
        fi
        echo "Database changes are not automatically reversed. Backup: $backup/database.sql" >&2
    fi
    exit "$status"
}
trap cleanup EXIT

# Inspect names and entry types before extraction; links and special entries are forbidden.
tar -tzf "$archive" > "$work/archive-files.txt"
awk '
    /^\// || /\\/ || /(^|\/)\.\.($|\/)/ { exit 1 }
    !/^(mc-connect(\/|$)|public_html(\/|$)|release\.json$)/ { exit 1 }
' "$work/archive-files.txt"
tar -tvzf "$archive" > "$work/archive-types.txt"
awk 'substr($0,1,1) != "-" && substr($0,1,1) != "d" { exit 1 }' "$work/archive-types.txt"
mkdir "$work/package"
tar --extract --gzip --file="$archive" --directory="$work/package" --no-same-owner --no-same-permissions
php "$STATE/verify-release.php" "$work/package" "$revision"
stage=$work/package/mc-connect
stage_web=$work/package/public_html
# Prepare dependencies before maintenance. Composer scripts run against the live app later.
(cd "$stage" && /usr/local/bin/composer2 install --no-dev --no-scripts --prefer-dist --optimize-autoloader --no-interaction)

mkdir -p "$backup/app" "$backup/public_html" "$backup/bootstrap-cache"
chmod 700 "$backup"
database=$(php "$STATE/database-backup-config.php" "$APP" "$options")
mysqldump --defaults-extra-file="$options" --single-transaction --quick --skip-lock-tables --no-tablespaces "$database" > "$backup/database.sql"
[[ -s "$backup/database.sql" ]] || { echo 'Database backup is empty.' >&2; exit 74; }
rm -f -- "$options"
rsync -a --exclude='/.env' --exclude='/storage/***' --exclude='/public' "$APP/" "$backup/app/"
rsync -a --exclude='/uploads/***' --exclude='/storage' --exclude='/.well-known/***' --exclude='/.user.ini' "$WEB/" "$backup/public_html/"
mkdir -p "$backup/public_html/uploads"
[[ ! -f "$WEB/uploads/.htaccess" ]] || cp "$WEB/uploads/.htaccess" "$backup/public_html/uploads/.htaccess"
rsync -a "$APP/bootstrap/cache/" "$backup/bootstrap-cache/"

(cd "$APP" && php artisan down --retry=60)
maintenance=1
changed=1
app_sync "$stage"
web_sync "$stage_web"
clear_bootstrap_cache
# tar honors umask 077; restore readable assets for the web server, keeping .env private.
find "$WEB" -path "$WEB/uploads" -prune -o -path "$WEB/.well-known" -prune -o -type d -exec chmod 755 {} + -o -type f ! -name '.user.ini' -exec chmod 644 {} +
(cd "$APP" && php artisan package:discover --ansi && php artisan migrate --force && php artisan config:cache && php artisan route:cache && php artisan up)

for endpoint in / /login /api/calendar/availability /api/cms/biodata; do
    status=$(curl --silent --show-error --max-time 30 --output /dev/null --write-out '%{http_code}' "https://mc.webusaha.com$endpoint")
    [[ "$status" == 200 ]] || { echo "Health check failed: $endpoint HTTP $status" >&2; exit 70; }
done
status=$(curl --silent --show-error --max-time 30 --header 'Accept: application/json' --output /dev/null --write-out '%{http_code}' https://mc.webusaha.com/api/cms/events)
[[ "$status" == 401 ]] || { echo "Guest protection check failed: HTTP $status" >&2; exit 70; }
printf '%s\n' "$revision" > "$STATE/current-revision"
finished=1
echo "Deployed $revision. Database and previous application backup: $backup"
