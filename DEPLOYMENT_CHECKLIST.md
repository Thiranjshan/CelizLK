# Deployment Hardening Checklist

## Required environment variables

Set the following values in the deployment environment, never in Git:

- DATABASE_URL
- JWT_ACCESS_SECRET
- ADMIN_JWT_SECRET
- BANK_TRANSFER_BANK_NAME
- BANK_TRANSFER_ACCOUNT_NAME
- BANK_TRANSFER_ACCOUNT_NUMBER
- BANK_TRANSFER_BRANCH
- CORS_ALLOWED_ORIGINS (optional, comma-separated list)

Production values must be unique, long, and strong. Do not reuse local development secrets.

## Database

- Use a managed production database instead of SQLite.
- Enable automated daily backups.
- Test restore operations in staging.
- Keep a retention policy for snapshots.
- Store the database URL in the deployment environment only.

## Authentication

- Use strong JWT secrets with at least 32 characters in production.
- Keep user and admin secrets separate.
- Require strong admin passwords.
- Keep login rate limiting enabled.
- Review all admin routes to ensure they call the shared auth guard.

## Security headers

The app already sets basic headers in next.config.ts:

- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- Content-Security-Policy

## Upload security

- Allow only image/jpeg, image/png, and image/webp for admin uploads.
- Enforce image size limits under 5MB.
- Store uploads outside the app root or inside a controlled media directory.
- Use unique file names.
- Validate file types server-side before writing to disk.

## Admin access

- Keep only trusted super admins able to create or modify admin accounts.
- Prevent self-deactivation of the last admin superuser.
- Log privileged actions with audit entries.
- Review account lockout and password policies regularly.

## Platform deployment notes

### Vercel

- Set env values in the dashboard.
- Separate preview and production environments.
- Keep secrets out of Git and image layers.

### Docker

- Do not copy .env files into image layers.
- Run with runtime env variables only.
- Keep container data volumes separate from app source.

### Railway

- Use managed Postgres or another production database.
- Keep a separate production database URL and secrets.
- Test restart and health-check behavior before launch.

### VPS

- Run behind Nginx/Caddy with TLS.
- Restrict SSH access and use a non-root service user.
- Set up service monitoring and log rotation.
- Keep OS packages patched.
- Persist uploaded media outside the container. For Docker, mount a host directory to `/app/public/uploads` (for example, `-v /srv/celiz/uploads:/app/public/uploads`) and ensure it is writable by UID 1001.

## Final deployment gate

Before production go-live, confirm:

- all env vars are set
- admin account is secure
- DB backups are enabled
- uploads are restricted and validated
- app build passes
- tests pass
- no secret values are committed
