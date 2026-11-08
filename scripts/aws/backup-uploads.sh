#!/usr/bin/env bash
set -Eeuo pipefail
umask 027

readonly CONFIG_FILE=/etc/celiz-backup.conf
readonly LOCK_FILE=/run/lock/celiz-uploads-backup.lock
readonly UPLOAD_DIR=/srv/celiz/uploads

if [[ ! -r "$CONFIG_FILE" ]]; then
  echo "Backup configuration is missing: $CONFIG_FILE" >&2
  exit 2
fi
# shellcheck disable=SC1090
source "$CONFIG_FILE"
: "${BACKUP_DIR:?BACKUP_DIR must be configured}"
: "${RETENTION_DAYS:?RETENTION_DAYS must be configured}"

mkdir -p -m 0750 "$BACKUP_DIR/uploads"
chgrp celiz-backup "$BACKUP_DIR/uploads"
chmod 0750 "$BACKUP_DIR/uploads"
if [[ ! -d "$UPLOAD_DIR" ]]; then
  echo "Upload directory is missing: $UPLOAD_DIR" >&2
  exit 2
fi

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "Another uploads backup is already running." >&2
  exit 75
fi

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
filename="celiz-uploads-${timestamp}.tar.gz"
final="$BACKUP_DIR/uploads/$filename"
if [[ -e "$final" || -e "$final.complete" ]]; then
  echo "A backup with this timestamp already exists: $filename" >&2
  exit 1
fi
temporary="$(mktemp "$BACKUP_DIR/uploads/.${filename}.XXXXXX")"
chmod 0640 "$temporary"
checksum_temporary="${temporary}.sha256"
complete_temporary="${temporary}.complete"
cleanup() {
  rm -f -- "$temporary" "$checksum_temporary" "$complete_temporary"
}
trap cleanup EXIT

tar -C /srv/celiz -czf "$temporary" uploads
tar -tzf "$temporary" >/dev/null
hash="$(sha256sum "$temporary" | cut -d ' ' -f 1)"
printf '%s  %s\n' "$hash" "$filename" > "$checksum_temporary"
chmod 0640 "$checksum_temporary"
chgrp celiz-backup "$temporary" "$checksum_temporary"
touch "$complete_temporary"
chmod 0640 "$complete_temporary"
chgrp celiz-backup "$complete_temporary"
mv -- "$temporary" "$final"
mv -- "$checksum_temporary" "$final.sha256"
mv -- "$complete_temporary" "$final.complete"
trap - EXIT

echo "Completed uploads backup: $filename"
find "$BACKUP_DIR/uploads" -maxdepth 1 -type f -name 'celiz-uploads-*.tar.gz.complete' \
  -mtime "+$RETENTION_DAYS" -print0 |
while IFS= read -r -d '' marker; do
  old_name="${marker##*/}"
  old_archive="${old_name%.complete}"
  if [[ "$old_archive" =~ ^celiz-uploads-[0-9]{8}T[0-9]{6}Z\.tar\.gz$ ]]; then
    rm -f -- "$BACKUP_DIR/uploads/$old_archive" "$BACKUP_DIR/uploads/$old_archive.sha256" "$marker"
  fi
done
