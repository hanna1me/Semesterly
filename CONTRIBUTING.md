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

Copy `.env.local` (not committed) and fill in the Supabase keys before running the app.
