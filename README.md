# BizCore SaaS

BizCore SaaS is a TypeScript monorepo for a multi-tenant business management platform.

## Structure

- `client/` - frontend application
- `server/` - Express, TypeScript, Prisma backend
- `docs/` - project documentation

## Server

```bash
cd server
npm install
npm run dev
```

Set `DATABASE_URL` in `server/.env` before running Prisma migrations.
