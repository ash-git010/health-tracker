# Upkeep

A personal health tracker PWA. Everything is stored locally on the user's device.

## Stack

React 19 · TypeScript · Vite · Dexie (IndexedDB) · React Router · Recharts

Deployed to GitHub Pages at `/health-tracker/`. Note the `base` in vite.config.ts
and `basename` in App.tsx both depend on that path.

## Structure

- `src/data/` — database, types, and all data access functions
- `src/features/<name>/` — screens grouped by feature
- `src/components/` — shared UI (ui.tsx has Button, Card, Fab, ScreenHeader, Empty)
- `src/sections.tsx` — section and tab registry (data only, no components)
- `src/App.tsx` — all routes
- `src/Layout.tsx` — header, tab bar, outlet

## Rules

- **Foods store macros per 100g or 100ml.** Never per serving. Any amount is
  `value * amount / 100`. This is done in `macrosForAmount` — don't duplicate it.
- **Log entries snapshot their computed macros.** Editing a food must not change
  historical entries.
- **Screens never import Dexie directly.** They call functions from `src/data/`.
  This keeps a future backend swap contained to one folder.
- **Dexie migrations are append-only.** New tables or indexes go in a NEW
  `this.version(n).stores({})` block. Never edit an existing version.
- **Dexie can only sort or filter on indexed fields.** Check the `.stores()` string
  before using `orderBy` or `where`.
- **`undefined` means loading, `null` means genuinely nothing.** Data functions that
  can find nothing should return `null`, so `useLiveQuery` can tell the difference.
- Styling uses classes in `index.css` and components from `ui.tsx`. Inline styles
  only for one-off layout, never for colours — use the CSS variables.
- Always run `npm run build` before pushing. `npm run dev` skips the full type check.

## External services

- Open Food Facts for barcode lookup (direct) and search (via a Cloudflare Worker
  proxy at upkeep-search.aswin010pk.workers.dev, needed for CORS)
- Feedback creates GitHub issues via upkeep-feedback.aswin010pk.workers.dev
- Exercise data is bundled MIT-licensed text in `src/data/seed/exercises.json`,
  loaded via dynamic import to keep it out of the main bundle

## Not built yet

Workout routines and templates, rest timer, workout charts, skin and hair routines,
progress overview section, backend and user accounts.