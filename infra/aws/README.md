# AWS EC2 Deployment and Migration Runbook

## Status and scope

This is prepared configuration; it has not provisioned AWS resources, restored data, or changed DNS. The current Azure production system remains authoritative until the owner schedules and completes cutover. No Azure resource or separate infrastructure repository is modified or required here.

The target keeps the existing application architecture: one Ubuntu EC2 host runs the `ghcr.io/thiranjshan/celizlk` runner and migrator images, PostgreSQL 18, and Caddy using Docker Compose. PostgreSQL is private to the Compose backend network. Caddy is the only service publishing HTTP/HTTPS. The upload bind mount remains `/srv/celiz/uploads:/app/public/uploads`.

## Files and persistence

- `main.tf`, `variables.tf`, `outputs.tf`: VPC/subnet/route, security group, EC2, SSM instance role, encrypted disks, and Elastic IP.
- `github-oidc.tf`: repository- and branch-scoped GitHub OIDC deployment role; Terraform is not run by application pushes.
- `bootstrap-state/`: one-time, separately stateful creation of the versioned/encrypted S3 state bucket. The production backend uses S3 native lock files.
- `runtime/`: Compose topology, Caddy configuration, and first-database initialization script. The runtime examples are placeholders, not ready-to-run secret files.
- `templates/user-data.sh.tftpl`: Docker/Compose installation, persistent disk setup, restricted directories, and UTC backup timers. It contains no application secrets.
- `scripts/aws/`: SSM deployment and server backup operations. `scripts/windows/Get-CelizBackups.ps1` copies complete backups and verifies SHA-256 before accepting them.

| Data | Container replacement | EC2 replacement | Terraform destroy |
| --- | --- | --- | --- |
| PostgreSQL (`/srv/celiz/postgres`) | Survives | Survives on the separate encrypted EBS data disk; reattach only in its original AZ | `prevent_destroy` blocks ordinary destroy. Removing the guard and deleting the volume loses it. Missing EBS is configured to prevent normal boot, avoiding an accidental empty root-disk mount path. |
| Uploads (`/srv/celiz/uploads`) | Survives at the existing `/app/public/uploads` URL/path | Survives on the data disk | Same retention guard and data-loss warning as PostgreSQL. |
| Caddy certificates/config (`/srv/celiz/caddy`, `caddy-config`) | Survives | Survives on the data disk | Same retention guard. |
| Runtime secrets/config (`/srv/celiz/runtime`) | Outside application image | Survives on the data disk | Same retention guard; rotate and securely dispose if intentionally retiring the host. |
| Local backups (`/srv/celiz/backups`) | Outside containers | Survives on the data disk | Same retention guard, but **not** an independent copy. A disk/instance/account loss before download can lose these backups. |
| EC2 root disk, images, OS | Not applicable | Recreated with the instance; image tags can be pulled again from GHCR | Deleted with the instance. |
| Terraform production state | Not applicable | Independent of EC2 | In the separate encrypted/versioned S3 state bucket. The bootstrap stack's own `terraform.tfstate` remains local and must be retained separately. |

EBS and S3 incur AWS charges. No paid snapshot or off-server backup service is enabled. Configure and test an independent destination (for example, a separately controlled encrypted S3 bucket) if the local-copy exposure window is unacceptable.

## Inputs and credentials

Review the defaults before applying. The default region is `ap-south-1`, instance type `t3.medium`, root disk `30 GiB`, persistent disk `100 GiB`, production domain `celizlk.store`, and local server backup retention `14` days. Confirm AWS region, monthly instance/disk/IPv4 budget, production domain, and whether SSH is needed. The instance type and disk sizes are cost/capacity decisions, not a quoted price.

AWS CLI credentials should be supplied locally through an AWS profile/SSO with permission to create the listed EC2, VPC, EBS, IAM, EIP, S3, and OIDC resources. Do not put access keys in Terraform variables. Terraform state has no application secrets.

Required host-only runtime values (never put these in Terraform, Git, GitHub workflow logs, or user data):

- `POSTGRES_PASSWORD`, `APP_DB_PASSWORD`, `MIGRATOR_DB_PASSWORD`: three independent random hexadecimal values. Hex avoids URL-encoding issues in Prisma connection strings. Keep the PostgreSQL bootstrap password only in the DB env file.
- `DATABASE_URL` in `app.env` using `celiz_app`; `DATABASE_URL` in `migrator.env` using `celiz_migrator`.
- `JWT_ACCESS_SECRET` and `ADMIN_JWT_SECRET`: independent, unique production values, at least 32 characters.
- Optional Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and `APP_URL` as applicable.
- Optional `CORS_ALLOWED_ORIGINS`; `SITE_URL`/`NEXT_PUBLIC_SITE_URL`/`APP_URL` must match the intended public host.
- `GHCR_READ_TOKEN`: a GitHub token with read-only package access, provisioned on EC2 at `/root/.config/celiz/ghcr-token`, root-owned mode `0600`. It is used only for image pulls. Do not pass it in SSM command arguments or workflow output.

Bank-transfer instructions live in persisted store settings and should be checked after restore. The current application code does not configure SMTP/email or PayHere credentials; do not invent runtime secret requirements for those integrations.

The GitHub repository needs these **Actions repository variables** after AWS is ready:

- `AWS_DEPLOY_ENABLED`: set to `true` only after the EC2 host, runtime secrets, GHCR pull token, and initial database/uploads restore are ready for deployment. Until then the CI and GHCR build jobs run but deployment is skipped; the current Azure deployment remains live and is not changed by this repository update. Complete AWS acceptance checks after the first deployment and before DNS cutover.
- `AWS_ROLE_ARN`: Terraform output `github_actions_role_arn`.
- `AWS_REGION`: same region as the EC2 instance.
- `EC2_INSTANCE_ID`: Terraform output `instance_id`.

The GitHub OIDC role is restricted to `Thiranjshan/CelizLK` on `main`; the AWS role session is short-lived. GHCR builds use the automatically provided `GITHUB_TOKEN` with package write permission. No long-lived AWS credential is needed in GitHub.

## Bootstrap state and plan the infrastructure

Run from PowerShell at the repository root. Choose a globally unique bucket name and an AWS profile that can bootstrap resources. Keep the local bootstrap state file safe; it is ignored by Git.

```powershell
Set-Location 'D:\Projects\P008 - celiz\infra\aws\bootstrap-state'
Copy-Item terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars and set a globally unique state_bucket_name.
terraform init -backend=false
terraform fmt -check
terraform validate
terraform plan
```

Only after reviewing the plan, create the state bucket:

```powershell
terraform apply
```

If the AWS account already has the GitHub Actions OIDC provider, import it into the production stack instead of creating a duplicate. Check first:

```powershell
aws iam list-open-id-connect-providers
```

Continue with the production stack:

```powershell
Set-Location 'D:\Projects\P008 - celiz\infra\aws'
Copy-Item backend.hcl.example backend.hcl
Copy-Item terraform.tfvars.example terraform.tfvars
# Edit backend.hcl with the state bucket name and edit terraform.tfvars.
terraform init -backend-config=backend.hcl
terraform fmt -check
terraform validate
terraform plan
```

For an existing GitHub OIDC provider, import its ARN before the plan:

```powershell
terraform import aws_iam_openid_connect_provider.github arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com
```

Review all planned resources, instance/disk cost, role trust, ingress, and retention protections before `terraform apply`. Do not apply as part of normal application deployment. `terraform destroy` is intentionally blocked while the data disk's `prevent_destroy` guard is present. The state bucket is separately protected too.

For optional SSH, set **both** `ssh_ingress_cidr` (a narrow administrator `/32`) and `ssh_public_key`; leaving both empty disables inbound SSH. GitHub deployments use SSM, not SSH. The Windows backup client needs SSH only if that transfer method is selected. Verify an SSH host key out of band and retain it in Windows `known_hosts`; the downloader refuses an unknown host.

## Prepare the EC2 runtime

After an approved apply, wait until EC2 Systems Manager reports the instance online and verify bootstrap before restoring anything. Inspect `/var/log/cloud-init-output.log`, `/var/log/celiz-bootstrap.log`, and `systemctl status celiz-backup-postgres.timer celiz-backup-uploads.timer` using SSM. The timer schedules are 02:15 and 02:45 **UTC**, with persistent catch-up after the host was off; backup jobs fail visibly until the Compose project and database exist.

On the new host, create the secrets directory/file as root without placing secret values in shell arguments, Terraform, SSM parameters, or logs. For example, use an interactive editor over a verified SSH/SSM administrative session:

```bash
sudo install -d -o root -g root -m 0700 /root/.config/celiz
sudo install -o root -g root -m 0600 /dev/null /root/.config/celiz/ghcr-token
sudoedit /root/.config/celiz/ghcr-token
```

Install empty protected files, then use an interactive root editor to populate them from the templates in the repository:

```bash
sudo install -o root -g root -m 0600 /dev/null /srv/celiz/.env
sudo install -o root -g root -m 0600 /dev/null /srv/celiz/runtime/app.env
sudo install -o root -g root -m 0600 /dev/null /srv/celiz/runtime/db.env
sudo install -o root -g root -m 0600 /dev/null /srv/celiz/runtime/migrator.env
sudoedit /srv/celiz/.env
sudoedit /srv/celiz/runtime/db.env
sudoedit /srv/celiz/runtime/app.env
sudoedit /srv/celiz/runtime/migrator.env
```

Set `DOMAIN` in `.env`, choose the canonical site URLs in `app.env`, and replace all placeholders with owner-provided production values. Use three separately generated hexadecimal database passwords. Verify the app and migrator database URLs use different roles and passwords. The runtime config is encrypted at rest by the data EBS volume; access still needs strict host permissions and backups of env files must be managed separately. An SSH administrator with `sudo` is fully trusted and can read runtime secrets; the backup group alone can read completed backup artifacts but not these files.

Create the root-only GHCR token as above. The first successful workflow deployment populates Compose/Caddy/DB initialization files from the exact runner image SHA, runs `prisma migrate deploy` through the separate migrator role, starts services, and checks the app's database-backed Docker health status. The production app must never run as `celiz_admin` or `celiz_migrator`. EC2's `ubuntu` account is not added to the Docker group; use a root SSM session or `sudo` for Docker administration.

## Restore and validate the initial backups

The supplied Azure backups are initial snapshots only; do not treat them as final cutover data. The database file is `C:\Users\ASUS\CelizBackups\celizdb-20261107-145110.dump`; the uploads archive is `C:\Users\ASUS\CelizBackups\celiz-uploads-20261107-094641.tar.gz`. The custom-format PostgreSQL dump includes migration history and `pg_trgm`. Its isolated restore verified 25 tables, `Product` 25, `Brand` 12, `Category` 6, `User` 5, `AdminUser` 1, `Order` 3, `OrderItem` 4, `Payment` 3, and 8 `_prisma_migrations` entries. The database file's SHA-256 was not included in the migration notes; obtain/record a trusted checksum before copying it. The uploads archive checksum is known:

```powershell
Get-FileHash -LiteralPath 'C:\Users\ASUS\CelizBackups\celiz-uploads-20261107-094641.tar.gz' -Algorithm SHA256
```

It must equal `2d6d3949e0ba046eac9330f13c302cdfb18b8cbe0389f1ae6fc3d4e7b8bbb323`. Never run the demo seed, `prisma migrate reset`, or `db push` against this data.

Before any restore, verify the input checksum from the owner-provided manifest and inspect the dump/archive. The archive's expected SHA-256 is `2d6d3949e0ba046eac9330f13c302cdfb18b8cbe0389f1ae6fc3d4e7b8bbb323`. Transfer the files securely to EC2. First extract the Compose/initialization files from a known runner image **without running migrations or starting the app**:

```bash
sudo /usr/local/sbin/celiz-deploy <40-character-commit-sha> --prepare
```

In a root administrative shell (SSM or `sudo -i`), on the *new, empty target only*, start only the database so PostgreSQL creates the empty `celizdb` and roles. If SSH was deliberately enabled, transfer the files from PowerShell after validating the SSH host key and source checksums:

```powershell
scp -i 'C:\path\to\celiz-aws-key' `
  'C:\Users\ASUS\CelizBackups\celizdb-20261107-145110.dump' `
  ubuntu@EC2_PUBLIC_IP:/tmp/celizdb-initial.dump
scp -i 'C:\path\to\celiz-aws-key' `
  'C:\Users\ASUS\CelizBackups\celiz-uploads-20261107-094641.tar.gz' `
  ubuntu@EC2_PUBLIC_IP:/tmp/celiz-uploads-initial.tar.gz
```

Then move the files to a root-only import directory with `sudo install -d -m 0700 /secure/path` and validate them there. If SSH remains disabled, use an owner-approved secure transfer method; do not enable broad SSH access to transfer a backup. Start only the database and restore the dump (substitute the actual verified path; do not copy it into a populated database):

```bash
sudo install -d -m 0700 /secure/path
sudo install -o root -g root -m 0600 /tmp/celizdb-initial.dump /secure/path/celizdb.dump
sudo install -o root -g root -m 0600 /tmp/celiz-uploads-initial.tar.gz /secure/path/celiz-uploads.tar.gz
sha256sum /secure/path/celizdb.dump /secure/path/celiz-uploads.tar.gz
tar -tzf /secure/path/celiz-uploads.tar.gz
cd /srv/celiz
export IMAGE_TAG=<40-character-commit-sha>
docker compose up -d db
docker compose exec -T db pg_isready -U celiz_admin -d celizdb
docker compose exec -T db pg_restore \
  --username=celiz_admin --dbname=celizdb --no-owner --no-acl \
  --single-transaction --exit-on-error < /secure/path/celizdb.dump
```

The import role is the local PostgreSQL superuser inside the private DB container; no DB port is published. Do not pre-create `pg_trgm`: it is present in the dump and is installed by the restore. Then reassign restored objects to the migration role and grant application DML without granting either role superuser:

```bash
docker compose exec -T db psql -U celiz_admin -d celizdb -v ON_ERROR_STOP=1 <<'SQL'
REASSIGN OWNED BY celiz_admin TO celiz_migrator;
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
```

Confirm `pg_trgm`, `_prisma_migrations`, expected row counts, owners/ACLs, and application-role permissions before starting the app. A deployment migration runs only `prisma migrate deploy`; it does not reset or seed. Verify the restored dump's eight migration records and the supplied data counts against the backup verification notes.

For the uploaded-image archive, inspect its entries and ensure it contains only the expected `uploads/` tree. On the new target with an empty upload directory, extract to `/srv/celiz`, then set the container's existing UID ownership:

```bash
tar -tzf /secure/path/celiz-uploads.tar.gz
sudo tar -xzf /secure/path/celiz-uploads.tar.gz -C /srv/celiz --no-same-owner
sudo chown -R 1001:1001 /srv/celiz/uploads
```

Do not extract over a populated production uploads directory without a separately reviewed merge/restore procedure. Verify representative files, sizes, and public `/uploads/...` URLs.

### Isolated restore test

Use a unique disposable volume/container with no production network or host data mounts. Restore a verified copy, run the same ownership/grant checks, and compare the documented table counts and extension/migration history. Remove only the specifically named disposable container and volume after recording the result. Never use a production Compose volume for this test.

## Staged cutover and rollback

1. Provision AWS after input/budget and `terraform plan` review.
2. Prepare runtime secrets and verify bootstrap; keep Azure serving production.
3. Restore the initial database and uploads backups to the new, empty EC2 data disk.
4. Deploy a SHA-tagged build and validate `/api/health`, Caddy, storefront/admin login, image URLs, and safe order/payment test flows without charging a real payment.
5. Before final sync, schedule a maintenance window. Stop writes from the storefront/admin, background workers, and all applicable payment/webhook sources; disable any write-producing integrations as appropriate.
6. While writes remain stopped, take a final coordinated PostgreSQL custom dump and uploads archive. Download/verify their checksums before restoring to the target. Restore only into the intentionally empty target database and upload path; compare migration history, counts, and files.
7. Verify admin/storefront, a safe test order/payment workflow, HTTPS, and application health against the new host. Change the domain's A/IPv4 record to the Terraform EIP only after these checks. Caddy needs public DNS to reach the new host to obtain/renew its certificate.
8. Confirm TLS, orders, login, uploads, scheduled backup results, checksum-verified Windows downloads, and a restore test. Keep Azure resources intact during the agreed rollback window.
9. Retire Azure only after owner approval and successful acceptance checks; that action is outside this preparation.

The app deployment script automatically restores the last healthy **application image** if its health check fails. It does not roll back a successful database migration. Use backward-compatible expand/contract migrations; a schema change incompatible with the prior image may prevent image rollback. Do not restore an older database over post-cutover writes without an explicit data reconciliation decision. If writes occur on AWS, returning DNS to Azure can lose those writes unless they are synchronized back.

## Backup, download, restore safety

Systemd runs timestamped PostgreSQL custom dumps and tarred uploads daily at 02:15/02:45 UTC. Each is written to a temporary file, validated (`pg_restore --list` or `tar -tzf`), checksummed, renamed, and marked complete only at the end. A nonblocking lock prevents overlap. Retention defaults to 14 days and runs only after a successful new artifact. Check status and logs:

```bash
systemctl list-timers 'celiz-backup-*'
systemctl status celiz-backup-postgres.service celiz-backup-uploads.service
journalctl -u celiz-backup-postgres.service -u celiz-backup-uploads.service --since today
```

The scheduled DB and upload jobs are separate snapshots, not a transactionally coordinated pair. For a consistency-sensitive recovery/cutover, stop writes and run both backups within the same maintenance window. The server continues backing up while the Windows PC is offline, but those copies remain on the same EBS volume/account until downloaded. Disk, instance, account, ransomware, or operator loss in that window can destroy the only backup; use an independently controlled off-server destination if that risk is not acceptable. No paid external backup is silently enabled.

The Windows downloader `scripts/windows/Get-CelizBackups.ps1` requires Windows OpenSSH `ssh`/`scp`, a key, and a host key already verified in `known_hosts`. EC2 adds the SSH user to a read-only backup group for the backup paths; the root-only database/application runtime configuration remains inaccessible to that account. The downloader enumerates only `.complete` files, downloads to `.partial`, checks SHA-256, then marks local files complete. It accepts paths with spaces. Configure Task Scheduler to run it daily with **Run task as soon as possible after a scheduled start is missed**; on next run, all still-retained server backups are enumerated and downloaded. Local retention defaults to 90 days; server retention defaults to 14 days and is configured separately. Keep the local destination on a protected disk with restricted Windows ACLs.

Example Task Scheduler action (replace the values, and protect the private key/local folder):

```text
Program: powershell.exe
Arguments: -NoProfile -ExecutionPolicy Bypass -File "C:\Celiz Backups\Get-CelizBackups.ps1" -HostName 203.0.113.10 -SshUser ubuntu -IdentityFile "C:\Users\Owner\.ssh\celiz-aws" -LocalDirectory "C:\Celiz Backups"
```

Set the task trigger daily, enable catch-up after a missed schedule, run as the Windows owner, and do not store database credentials in the task. Before restore, verify the local `.complete` marker and `.sha256` file. Restore a dump only into a new empty isolated PostgreSQL 18 database first; never drop/overwrite a populated production database as a routine restore step.

## Verification checklist

- [ ] `terraform fmt -check`, `terraform validate`, reviewed plan, remote state and locking.
- [ ] `docker compose config` with safe example env files; no published database port.
- [ ] PostgreSQL restore, `pg_trgm`, migration-history/row counts, object ownership, app-versus-migrator privileges.
- [ ] Upload files owned by UID 1001, preserve `/srv/celiz/uploads` path and image URLs.
- [ ] Container restart and EC2 replacement retain data; test only in staging/approved window.
- [ ] Storefront/admin authentication and authorization.
- [ ] Safe order/payment tests; no real charge without approval.
- [ ] GitHub CI, package SHA tags, OIDC/SSM deployment, serialization, DB-backed health, rollback limitation.
- [ ] Server backup success, checksum transfer, isolated restore, and scheduled Windows catch-up.
- [ ] DNS/TLS only changed at approved cutover; Azure retained until acceptance.
