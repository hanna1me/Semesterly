# SemApp

## Phase 1 Setup

### Supabase credentials

Create a `.env.local` file in the project root (not committed) with:

```
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Both values are found in your Supabase project under Settings > API.

### Database schema

Open the Supabase SQL Editor for your project and run the contents of
`supabase/schema.sql`. This creates the `profiles`, `semesters`, and `courses`
tables with Row Level Security enabled.

### Run the app

```sh
npm install
npx expo start
```

Press `i`, `a`, or `w` to launch on iOS, Android, or web.
