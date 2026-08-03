# Upkeep

A personal health tracker — meals and macros, body weight, and strength training.

Built as a progressive web app: it installs to your phone's home screen, works
offline, and stores everything on your own device.

## Status

In active development. Personal project, used daily.

## Features

**Meals**
- Log meals across breakfast, lunch, dinner and snacks, with daily calorie and macro totals
- Add foods by barcode scan, database search, or manually
- All foods stored per 100g or 100ml, so any portion is a single calculation
- Log by weight or by piece — one apple, two slices, three eggs
- Daily calorie target, macro split, and a separate minimum protein floor
- Charts for macro breakdown, calorie and protein trends

**Workouts**
- 1,300+ exercise library with instructions, searchable by name, muscle or equipment
- Custom exercises for anything not in the library
- Set logging with weight, reps, and set types — warm-up, drop, failure
- Last session's numbers shown inline while you log
- Rest timer per exercise, with a sound when it finishes
- Reusable routines, organised into folders
- Per-exercise records: estimated 1RM, max weight, max reps, volume
- Progress view with a training calendar, streaks, sets per muscle group, and volume trends

**Body**
- Weight tracking with a rolling-average trend line
- 7 and 30 day change, and BMI

**Everything else**
- Works offline, installs to the home screen
- All data stored locally — nothing is uploaded anywhere
- Export and restore your data as a backup file
- In-app feedback that files a GitHub issue

## Built with

React · TypeScript · Vite · Dexie (IndexedDB) · React Router · Recharts · Lucide

**Food data** from [Open Food Facts](https://world.openfoodfacts.org), via a
Cloudflare Worker proxy for search.

**Exercise data** from
[hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)
(MIT). Text only — no media.

## Architecture notes

- All persistence lives behind `src/data/`. Screens never touch Dexie directly,
  which keeps a future backend swap contained to one folder.
- Foods are normalised to per-100g at save time, so portion maths is a single
  multiplication everywhere.
- Log entries snapshot their computed macros, so correcting a food never
  rewrites history.
- Dexie migrations are append-only — new tables and indexes go in a new version
  block, never an edit to an existing one.

## Licence

All rights reserved. See LICENSE.