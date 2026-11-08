#!/bin/sh
set -eu

: "${APP_DB_PASSWORD:?APP_DB_PASSWORD must be set in /srv/celiz/runtime/db.env}"
: "${MIGRATOR_DB_PASSWORD:?MIGRATOR_DB_PASSWORD must be set in /srv/celiz/runtime/db.env}"

psql \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set ON_ERROR_STOP=1 <<'SQL'
\getenv app_password APP_DB_PASSWORD
\getenv migrator_password MIGRATOR_DB_PASSWORD
CREATE ROLE celiz_migrator LOGIN PASSWORD :'migrator_password';
CREATE ROLE celiz_app LOGIN PASSWORD :'app_password';

ALTER DATABASE celizdb OWNER TO celiz_migrator;
ALTER SCHEMA public OWNER TO celiz_migrator;
GRANT CONNECT ON DATABASE celizdb TO celiz_app;
GRANT USAGE ON SCHEMA public TO celiz_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO celiz_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO celiz_app;

ALTER DEFAULT PRIVILEGES FOR ROLE celiz_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO celiz_app;
ALTER DEFAULT PRIVILEGES FOR ROLE celiz_migrator IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO celiz_app;

SQL
