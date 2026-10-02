# Project Memory

Stable facts only.

- Public site: static HTML and vanilla JS in `site3/`; `node tooling/serve.mjs 8090` serves clean routes locally.
- `CBRS_CMS_ORIGIN` selects the CMS used by the local site proxy.
- CMS: Payload 3 / Next.js in `cms/`; scripts: `npm run dev`, `npm run test:int`, `npm run lint`, `npx tsc --noEmit`.
- PostgreSQL in production, SQLite locally, selected by `DATABASE_URL`.
- After admin component changes: `npm run generate:importmap`; after schema changes: `npm run generate:types` and generate a PostgreSQL migration.
- Vercel projects: `cbrs-sites` (repository root) and `cbrs-cms` (`cms/`, production branch `main`).
- Use an isolated worktree for feature changes.
