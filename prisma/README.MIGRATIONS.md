This directory contains a manual SQL migration you can apply directly to your
Postgres database if Prisma's migrate command cannot be used due to connectivity
or credential issues.

How to apply locally (psql):

1. Ensure you have psql installed and can connect to your database.
2. Run:

   psql "$DATABASE_URL" -f prisma/migrations/20260415_init/migration.sql

   Example (PowerShell):
   $env:DATABASE_URL = 'postgresql://myuser:mypassword@localhost:5432/rag-db'
   psql $env:DATABASE_URL -f prisma/migrations/20260415_init/migration.sql

After applying the SQL, re-run the Prisma client generation if needed:

npx prisma generate --schema ./src/prisma/schema

Notes

- This migration is idempotent (uses IF NOT EXISTS) so it is safe to run multiple times
  in most cases.
- For production you should prefer Prisma migrations; this SQL is a fallback to
  get the required tables created when Prisma cannot authenticate from this
  environment.
