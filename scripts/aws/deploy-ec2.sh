#!/usr/bin/env bash
set -Eeuo pipefail

readonly APP_DIR=/srv/celiz
readonly STATE_DIR="$APP_DIR/state"
readonly IMAGE_TAG="${1:-}"
readonly MODE="${2:-deploy}"

if [[ ! "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Deployment requires a full 40-character commit SHA." >&2
  exit 2
fi
if [[ "$MODE" != deploy && "$MODE" != --prepare ]]; then
  echo "Usage: celiz-deploy <commit-sha> [--prepare]" >&2
  exit 2
fi

if [[ ! -f /root/.config/celiz/ghcr-token ]]; then
  echo "Missing root-only GHCR read token at /root/.config/celiz/ghcr-token." >&2
  exit 2
fi

export DOCKER_CONFIG
DOCKER_CONFIG="$(mktemp -d /run/celiz-docker.XXXXXX)"
release_container=""
cleanup() {
  if [[ -n "$release_container" ]]; then
    docker rm "$release_container" >/dev/null 2>&1 || true
  fi
  docker logout ghcr.io >/dev/null 2>&1 || true
  rm -rf -- "$DOCKER_CONFIG"
}
trap cleanup EXIT

if ! docker login ghcr.io --username Thiranjshan --password-stdin < /root/.config/celiz/ghcr-token; then
  echo "GHCR authentication failed." >&2
  exit 1
fi

install -d -m 0750 "$APP_DIR" "$APP_DIR/runtime/postgres-init" "$STATE_DIR"
release_container="celiz-config-$IMAGE_TAG"
docker rm "$release_container" >/dev/null 2>&1 || true
docker create --name "$release_container" "ghcr.io/thiranjshan/celizlk:$IMAGE_TAG" >/dev/null
for file in compose.yaml Caddyfile init-db.sh; do
  docker cp "$release_container:/opt/celiz/runtime/$file" "$APP_DIR/runtime/$file"
done
docker rm "$release_container" >/dev/null
release_container=""

install -m 0644 "$APP_DIR/runtime/compose.yaml" "$APP_DIR/compose.yaml"
install -m 0755 "$APP_DIR/runtime/init-db.sh" "$APP_DIR/runtime/postgres-init/01-create-roles.sh"
chmod 0600 "$APP_DIR/.env" "$APP_DIR/runtime/db.env" "$APP_DIR/runtime/app.env" "$APP_DIR/runtime/migrator.env"

if [[ ! -f "$APP_DIR/.env" || ! -f "$APP_DIR/runtime/db.env" ||
      ! -f "$APP_DIR/runtime/app.env" || ! -f "$APP_DIR/runtime/migrator.env" ]]; then
  echo "Runtime configuration is incomplete. Prepare /srv/celiz/.env and runtime env files first." >&2
  exit 2
fi

cd "$APP_DIR"
if [[ "$MODE" == --prepare ]]; then
  echo "Runtime files prepared from $IMAGE_TAG; database and application were not started."
  exit 0
fi

previous_tag=""
if [[ -f "$STATE_DIR/last-good-image" ]]; then
  previous_tag="$(cat "$STATE_DIR/last-good-image")"
fi

export IMAGE_TAG
docker compose pull db app migrate caddy
docker compose --profile tools run --rm migrate
if docker compose up -d --remove-orphans; then
  for attempt in $(seq 1 36); do
    status="$(docker inspect --format '{{.State.Health.Status}}' app-app-1 2>/dev/null || true)"
    if [[ "$status" == healthy ]]; then
      printf '%s\n' "$IMAGE_TAG" > "$STATE_DIR/last-good-image.tmp"
      mv -f -- "$STATE_DIR/last-good-image.tmp" "$STATE_DIR/last-good-image"
      awk -F= -v tag="$IMAGE_TAG" '$1 != "IMAGE_TAG" { print } END { print "IMAGE_TAG=" tag }' \
        "$APP_DIR/.env" > "$APP_DIR/.env.tmp"
      chmod 0600 "$APP_DIR/.env.tmp"
      mv -f -- "$APP_DIR/.env.tmp" "$APP_DIR/.env"
      docker image prune -a -f --filter 'until=168h' >/dev/null
      echo "Deployment $IMAGE_TAG is healthy."
      exit 0
    fi
    sleep 5
  done
fi

echo "Deployment $IMAGE_TAG did not become healthy." >&2
if [[ "$previous_tag" =~ ^[0-9a-f]{40}$ && "$previous_tag" != "$IMAGE_TAG" ]]; then
  echo "Restoring previous application image $previous_tag (database migrations are not reversed)." >&2
  export IMAGE_TAG="$previous_tag"
  docker compose pull app caddy
  docker compose up -d app caddy
  for attempt in $(seq 1 36); do
    status="$(docker inspect --format '{{.State.Health.Status}}' app-app-1 2>/dev/null || true)"
    if [[ "$status" == healthy ]]; then
      echo "Previous application image recovered; review migration compatibility before further action." >&2
      exit 1
    fi
    sleep 5
  done
  echo "Previous image recovery did not pass its health check." >&2
else
  echo "No previous known-good image is recorded; no automatic image rollback was possible." >&2
fi
exit 1
