# Local Database Recovery

This guide is for local development only. Do not use these steps against production data.

## When to use this guide

Use this when the backend starts throwing SQLite schema errors such as:

- `sqlite3.OperationalError: no such column: event_comments.time_label`
- missing table errors after pulling new backend changes
- support, social, or auth features failing after schema updates

## Normal fix path

Apply Alembic migrations to your local SQLite database:

```powershell
npm run backend:migrate
```

Then verify the schema:

```powershell
npm run backend:verify-schema
```

If you want to inspect the current Alembic revision:

```powershell
npm run backend:migration:current
```

## Reseed demo data

After migrations, you can reseed local demo data:

```powershell
npm run backend:seed
```

## When a reset is acceptable

If your local database is disposable development data and migrations are not enough, you can reset the local SQLite file.

Before deleting anything, stop the backend and optionally back up:

- `backend/eventcapture.db`
- `backend/storage/`
- `backend/debug/`

Then remove the local SQLite file and reseed:

```powershell
Remove-Item .\backend\eventcapture.db -ErrorAction SilentlyContinue
npm run backend:migrate
npm run backend:seed
npm run backend:verify-schema
```

## Why this happens

Older local databases may have been created through automatic `create_all()` calls before newer columns and tables were added or before Alembic was used consistently.

Examples of drift that migrations now repair:

- `event_comments.time_label`
- `support_requests.priority`
- older support status values such as `open` now normalized to `new`

## Recommended local verification

After recovery, run:

```powershell
npm run backend:test
npm run check
```

Then manually verify:

- login works
- event detail loads
- `I'm going` can be toggled
- capture review can post to a going event
- comments, likes, saves, and support submit correctly
