# Database Production Guide

## Recommended production database

Use PostgreSQL for staging and production.

SQLite is acceptable for:

- local development
- isolated demos
- tightly controlled single-node private beta

SQLite is not ideal for first real SaaS customers because:

- concurrency is limited compared with PostgreSQL
- write contention becomes painful under load
- operational failover is weak
- multi-instance scaling is awkward
- backup and restore discipline matters more because the database is a file

## Connection configuration

EventCapture already supports `EVENTCAPTURE_DATABASE_URL`.

Examples:

- SQLite local:
  - `sqlite+pysqlite:///backend/eventcapture.db`
- PostgreSQL:
  - `postgresql+psycopg://eventcapture_user:strong-password@db-host:5432/eventcapture`

## Environment separation

Use separate databases for:

- local development
- CI/test
- staging
- production

Never share production credentials with staging.

## Migrations

Production should use:

- `EVENTCAPTURE_SCHEMA_MANAGEMENT_MODE=validate`
- Alembic migrations applied before API startup

Recommended commands:

1. Generate a reviewed migration:
   - `backend/.venv/Scripts/python -m alembic revision --autogenerate -m "describe change"`
2. Review the migration manually
3. Apply in staging:
   - `backend/.venv/Scripts/python -m alembic upgrade head`
4. Validate application behavior in staging
5. Apply in production during a controlled deployment

## Backup strategy

For PostgreSQL:

- daily full backups
- WAL or point-in-time recovery if available
- documented retention policy
- backup encryption
- restore drills on a non-production environment

For SQLite if you temporarily stay on it:

- stop writes or place app in maintenance mode before copying the file
- back up the DB file and media storage together
- verify restore procedure regularly

## Restore testing

At minimum:

1. Restore the latest backup into staging or a disposable environment
2. Run migrations if needed
3. Verify login, posts, events, social state, support tickets, and media references
4. Record recovery time and issues

## Multi-instance readiness

For multiple API instances behind a load balancer, use PostgreSQL.

The current first-customer hardening features that depend on shared durable state include:

- logout revocation
- support tickets
- support ticket notes
- rate-limiting buckets
- event social state

These features behave correctly across instances only when all instances share the same database.

