# Deployment Hardening Checklist

## Required environment variables

Set the following values in the deployment environment, never in Git:

- DATABASE_URL
- JWT_ACCESS_SECRET
- ADMIN_JWT_SECRET
- CORS_ALLOWED_ORIGINS (optional, comma-separated list)

Production values must be unique, long, and strong. Do not reuse local development secrets.

## Database

- The prepared AWS target runs PostgreSQL 18 on the same EC2 instance, on encrypted persistent EBS, with no public database port.
- Configure separate least-privilege app and migration database roles.
- Enable the documented daily PostgreSQL and uploads backups; server copies are on the same EBS volume and are not an independent disaster-recovery copy.
- Download and checksum-verify backups to a protected Windows location; test restores in an isolated PostgreSQL 18 instance.
- Keep server and local retention policies explicit and monitor timer failures.
- Store database URLs/passwords only in protected runtime environment files, not Terraform, source, or workflow command arguments.
- Bank transfer instructions are stored in the application's persisted store settings, not separate environment variables. Verify them after the database restore. The current app does not use SMTP/email or PayHere credentials.

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
- Apply Prisma migrations before starting the updated app image. The CI/CD deployment runs the `migrator` image with `docker compose --profile tools run --rm migrate`; do not deploy an app image without its matching migration image.
- The app image defines a Docker health check that calls `/api/health` every 30 seconds. It allows 60 seconds for startup, times out each probe after 5 seconds, and marks the container unhealthy after 3 failed probes. The endpoint checks both the app and database.
- After deploying the rebuilt image, check container health on the VM with `docker compose ps`. For detailed probe results, use `docker inspect --format '{{json .State.Health}}' <container-name-or-id>`.
- Compose inherits the image health check unless a service-level `healthcheck` overrides or disables it. A `healthy` status is monitoring information; Docker Compose does not automatically restart an unhealthy container.

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

### AWS EC2 target

- Follow [`infra/aws/README.md`](infra/aws/README.md) for Terraform state bootstrap, IAM/OIDC, database restore ownership/grants, backup transfer, and staged cutover.
- AWS is not considered live until the database and image restore, app/admin verification, HTTPS, backup download, and owner-approved DNS cutover pass.

## Final deployment gate

Before production go-live, confirm:

- all env vars are set
- admin account is secure
- DB backups are enabled
- uploads are restricted and validated
- app build passes
- tests pass
- no secret values are committed
