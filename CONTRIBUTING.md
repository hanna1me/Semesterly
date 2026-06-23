# Contributing

## Setup

```sh
npm install
npm start
```

Then press `i`, `a`, or `w` to run on iOS, Android, or web (or run `npm run ios` / `npm run android` / `npm run web` directly).

## Workflow

1. Create a branch off `main`.
2. Make your changes.
3. Open a pull request into `main`.

`main` is protected — direct pushes aren't allowed, and all changes must go through a pull request.

## Code style

- TypeScript, strict mode is enabled — run `npx tsc --noEmit` before opening a PR.

## Environment variables

Create a `.env.local` file in the project root (not committed) with:

```
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Both values are found in your Supabase project under Settings > API.

## Database changes

- `supabase/schema.sql` is the full, cumulative schema — run it in the Supabase SQL editor to set up a fresh project.
- `supabase/migrations/` holds incremental migrations for project databases that already have an earlier schema applied.

When you add or change tables, update both: append the change to `schema.sql` so it stays a complete snapshot, and add a new numbered file under `migrations/` (e.g. `003_*.sql`) with just that change.
