# Disaster Recovery — SupportFlow Backend

This document describes the backup and disaster-recovery (DR) strategy for the
SupportFlow Backend PostgreSQL database. It covers what is backed up, how often,
how long backups are kept, how to restore, and the recovery objectives (RPO/RTO).

> The application source code, infrastructure-as-config, and secrets are managed
> outside this database backup strategy (Git + the hosting provider's secret
> store). This document focuses on **data** stored in PostgreSQL.

---

## 1. Backup strategy

SupportFlow uses a **logical backup** approach based on `pg_dump` in PostgreSQL
**custom format** (`-Fc`):

- Captures the full schema + data of the target database.
- The custom format is **internally compressed** (`--compress=9`) and supports
  selective, parallel restore via `pg_restore`.
- Dumps are written with a UTC timestamp to a configurable local directory and
  are **self-verified** immediately after creation.

Two complementary layers are recommended in production:

| Layer                      | Tool                           | Purpose                                             |
| -------------------------- | ------------------------------ | --------------------------------------------------- |
| Managed provider snapshots | Neon / RDS / Cloud SQL PITR    | Point-in-time recovery, infra-level redundancy      |
| Logical dumps (this repo)  | `scripts/backup/*` + `pg_dump` | Portable, provider-independent, restorable anywhere |

The managed provider's automated backups are the **primary** recovery mechanism.
The logical dumps in this repository are a **portable secondary** copy that can
be restored into any PostgreSQL 16 instance (local, another provider, or DR site).

### What is covered

- All application tables (tickets, users, audit logs, outbox events, etc.).
- Schema definition (tables, indexes, constraints, triggers — including the
  append-only audit-log triggers).

### What is **not** covered by these scripts

- Redis / BullMQ queue state (transient; rebuilt from the Outbox table).
- Uploaded attachments on disk/volume (`storage/attachments`) — back these up
  with the provider's volume snapshots or object-storage replication.
- Environment secrets — stored in the hosting provider's secret manager.

---

## 2. Recommended frequency

| Environment | Logical dump (`pnpm db:backup`) | Provider PITR / snapshots |
| ----------- | ------------------------------- | ------------------------- |
| Production  | Daily (off-peak, automated)     | Continuous (WAL/PITR)     |
| Staging     | Weekly or before migrations     | Provider default          |
| Local/dev   | On demand                       | N/A                       |

Always take a **manual logical dump before running destructive operations**
(major migrations, data backfills, bulk deletes).

Automate the daily dump with a scheduler (cron, GitHub Actions, or the
provider's job runner), e.g.:

```cron
# Daily at 03:00 UTC
0 3 * * *  cd /app && BACKUP_ENABLED=true pnpm db:backup >> /var/log/supportflow-backup.log 2>&1
```

---

## 3. Retention

- Controlled by `BACKUP_RETENTION_DAYS` (default **7 days** for local logical dumps).
- After each successful backup the script prunes `supportflow_*.dump` files older
  than the retention window in `BACKUP_OUTPUT_DIR`.
- Recommended production retention:
  - Local/portable logical dumps: **7–14 days**.
  - Provider snapshots: **30 days** (or per compliance requirements).
  - Consider periodic (weekly/monthly) dumps shipped to **off-site object
    storage** (e.g. S3 with versioning + lifecycle rules) for long-term archives.

Backups may contain personal data — store them encrypted at rest and restrict
access according to your data-protection policy.

---

## 4. Restoration

Restores are **destructive** and require explicit confirmation.

1. Identify the dump to restore (newest valid file in `BACKUP_OUTPUT_DIR`).
2. Verify it: `pnpm db:backup:verify -- <file>`.
3. Point the restore target at the correct database via `RESTORE_DATABASE_URL`
   (or `BACKUP_DATABASE_URL` / `DATABASE_URL`).
4. Run `pnpm db:restore -- <file>` and confirm by typing the database name.

The restore uses `pg_restore --clean --if-exists`, which drops and recreates
existing objects before loading data. See [§7](#7-step-by-step-runbook).

> For provider-level Point-in-Time Recovery, follow your provider's console/CLI
> procedure (Neon branch restore, RDS snapshot restore, etc.). Logical restore
> via these scripts is the portable fallback.

---

## 5. RPO (Recovery Point Objective)

**RPO = maximum acceptable data loss.**

| Mechanism                      | RPO                                |
| ------------------------------ | ---------------------------------- |
| Provider PITR (WAL)            | ~Seconds–minutes (continuous)      |
| Daily logical dump (this repo) | Up to **24 hours** since last dump |

- **Target production RPO: ≤ 5 minutes**, achieved by the managed provider's
  continuous/PITR backups.
- The logical dumps provide a **≤ 24h** secondary RPO and protect against
  provider-level loss or the need to migrate providers.

---

## 6. RTO (Recovery Time Objective)

**RTO = maximum acceptable time to restore service.**

| Scenario                                    | Estimated RTO |
| ------------------------------------------- | ------------- |
| Provider PITR / snapshot restore            | ~15–60 min    |
| Logical restore from dump (small/medium DB) | ~5–30 min     |
| Full DR to a new instance + app redeploy    | ~1–2 hours    |

- **Target production RTO: ≤ 1 hour.**
- RTO depends on database size, network throughput, and whether a target
  instance is already provisioned. Keep a warm/standby instance to minimize RTO.

---

## 7. Step-by-step runbook

### Create a backup

```bash
BACKUP_ENABLED=true pnpm db:backup
# Output: backups/supportflow_<db>_<YYYYMMDD_HHMMSSZ>.dump
```

### Verify a backup

```bash
pnpm db:backup:verify -- backups/supportflow_supportflow_20260624_180000Z.dump
```

### Restore a backup

```bash
# Restore into the DB pointed to by RESTORE_DATABASE_URL/BACKUP_DATABASE_URL/DATABASE_URL
pnpm db:restore -- backups/supportflow_supportflow_20260624_180000Z.dump
# Type the database name when prompted to confirm.

# Non-interactive (automation / CI):
FORCE_RESTORE=true pnpm db:restore -- <file>
```

### Disaster recovery (provider loss)

1. Provision a new PostgreSQL 16 instance.
2. Set `RESTORE_DATABASE_URL` to the new instance.
3. Restore the latest verified dump (or use provider PITR if available).
4. Run `pnpm prisma:deploy` to confirm the schema is at the latest migration.
5. Update the application `DATABASE_URL` and redeploy.
6. Validate with `pnpm validate:staging` (or the equivalent smoke checks).

---

## 8. Environment variables

| Variable                | Required | Default        | Description                                                                      |
| ----------------------- | -------- | -------------- | -------------------------------------------------------------------------------- |
| `BACKUP_ENABLED`        | Yes\*    | `false`        | Must be `true` for `backup-postgres.sh` to run (safety gate).                    |
| `BACKUP_DATABASE_URL`   | No       | `DATABASE_URL` | Connection string for `pg_dump`/`pg_restore`. Falls back to `DATABASE_URL`.      |
| `BACKUP_OUTPUT_DIR`     | No       | `backups`      | Local directory where dumps are written and pruned.                              |
| `BACKUP_RETENTION_DAYS` | No       | `7`            | Days to keep dumps; older `supportflow_*.dump` files are removed (0 = keep all). |
| `RESTORE_DATABASE_URL`  | No       | resolved URL   | Overrides the restore target (else `BACKUP_DATABASE_URL`/`DATABASE_URL`).        |
| `FORCE_RESTORE`         | No       | `false`        | Skips the interactive confirmation prompt for restore (automation only).         |

\* Required only to actually execute a backup; the variable is otherwise optional.

These variables are consumed **only by the shell scripts** in `scripts/backup/`
and are intentionally **not** part of the application's runtime config schema.

---

## 9. Risks covered

- **Accidental data loss / corruption** (bad migration, bulk delete, app bug).
- **Provider outage or data loss** — portable dumps restorable elsewhere.
- **Provider migration** — move to a different PostgreSQL host without lock-in.
- **Ransomware / tampering** — combined with the append-only immutable audit log
  and off-site, versioned archive copies.
- **Schema regression** — dumps include the full schema and triggers.

---

## 10. Limitations

- Logical dumps are **point-in-time**; data written after the dump is lost unless
  covered by provider PITR.
- These scripts perform **full** dumps (no incremental logical backups);
  incremental/continuous protection is delegated to the provider's WAL/PITR.
- Restore is **destructive** (`--clean --if-exists`); always restore into a known
  target and verify the URL first.
- Backups are **not encrypted** by the scripts — encrypt at rest at the storage
  layer and control access.
- Requires PostgreSQL client tools (`pg_dump`/`pg_restore`) matching the server
  major version (**16**); version mismatches can cause restore failures.
- Attachments, Redis state, and secrets are **out of scope** for these scripts.
