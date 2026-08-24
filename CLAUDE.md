# CLAUDE.md — Upkeep

Instructions for Claude Code working in this repository. Read this file in full
at the start of every session, then read `docs/HANDOVER.md` — **§19 first for
the session protocol, then §17** — before writing any code.

**Three documents, one job each.** `CLAUDE.md` (this file) holds rules and
conventions and changes rarely. `docs/HANDOVER.md` holds history, decisions and
current state, and is updated at the end of every session — **where the two
disagree, the handover is more current.** `PRIVATE-NOTES.md` is gitignored and
holds personal and legal material; read it only when the funding, public release
or app store question comes up, and never copy its contents into a committed
file.

**Rule zero: the actual file beats the handover, the handover beats this file,
this file beats your memory.** If you are about to state something about the
code, open the file first. This project has a documented history of confident
wrong answers produced by reasoning from documentation instead of reading source.

---

## 1. What this is

**Upkeep** — a personal health-tracking PWA covering nutrition, body weight,
strength training and daily care routines. Local-first: data lives in IndexedDB
on the device and syncs to Postgres when the user is signed in. Installed to the
home screen, works offline.

- **Live:** `upkeepdaily.com` (deployed from `main` automatically)
- **Repo:** `github.com/ash-git010/health-tracker` (public, all-rights-reserved)
- **Released version:** 2.1.1

## 2. Who you are working with

A beginner developer who has built this app with AI assistance over several
weeks. They make the architectural decisions; you write most of the
implementation. They understand *why* the code is shaped the way it is but
cannot write it from scratch.

**How to communicate:**

- **Explain the why, not just the what.** Plain English. If you must use a
  technical term, define it in the same sentence. Assume no prior knowledge of
  database or framework terminology. A short plain-language explanation beats a
  precise dense one.
- **Show the plan and the file tree before writing component code.** What files
  will change, what each change does, then wait for a go-ahead on anything
  larger than a small fix.
- **Always say exactly where something goes** — full repo path, or "Supabase SQL
  Editor", or "terminal". Never leave it ambiguous. If a step touches no repo
  files, say so.
- **Tell them when they are wrong.** Design calls have needed pushing back on
  before, and pushing back is wanted.
- **When they say they are confused, give numbered copy-paste commands**, not
  explanation. Explain afterwards if asked.
- They often read on a phone. Keep prose tight.
- **Flag decisions explicitly before writing code**, never silently inside an
  implementation.

## 3. The rule that has saved this project the most times

**Test the assumption before writing the fix.**

Half a session was once spent "fixing" the food search based on a theory built
from web search results, never tested against the live API. Three consecutive
fixes were wrong, each breaking something that worked, and all of it was rolled
back. The search was never broken.

If a diagnosis rests on inference rather than evidence from the actual system,
say so and go get the evidence first. One command is usually enough.

Corollaries, each learned the hard way:

- **A dev-server symptom is not a bug until it reproduces on the real build.**
- **A console `await import()` proves what is on disk, not what the running app
  is executing.** Those two can differ (see §11, Vite transform cache).
- **Ask which build a symptom came from before theorising about causes.**

---

## 4. Stack and commands

React 19 · TypeScript · Vite · Dexie (IndexedDB) · React Router · Recharts ·
Lucide icons · vite-plugin-pwa (Workbox) · `@supabase/supabase-js`

Node **24** (matches the Cloudflare Pages build environment). Dependencies are
installed with `npm ci`, because Cloudflare uses `npm clean-install` and that
requires `package.json` and `package-lock.json` to agree exactly.

```bash
npm run dev      # local dev server, http://localhost:5173
npm run build    # tsc + vite build — THE verification step
npm ci           # install — NOT `npm install`, see below
```

The dev machine is **Windows with Git Bash**, so prefer POSIX commands
(`ls`, `cat`, `rm -rf`) over PowerShell ones. Install with **`npm ci`**, never
`npm install`: `npm ci` installs exactly what the lockfile says and fails if
`package.json` disagrees, which is what Cloudflare does. `npm install` is
allowed to quietly update things, and that is how local and production drift.

**Phone testing goes through the Cloudflare branch preview**, not the dev
server. Push `phase-1-i18n` and open its `*.upkeep-4wa.pages.dev` URL. A LAN IP
with `--host` will not work for the barcode scanner — camera access needs a
secure context.

**`npm run build` is the only real check.** `npm run dev` skips the full type
check and lets unused imports through, so code that runs in dev can fail the
build. **Always run `npm run build` before any commit or push.** There is no
browser and no Playwright available — the build is the test suite.

Fonts are bundled via `@fontsource/bricolage-grotesque` (wordmark only);
everything else is `system-ui`. **There is no Google Fonts link and must not
be** — the CSP would block it.

**There is no i18n library.** Translation is ~60 lines in `src/data/i18n.ts`
plus two catalogue files.

### Build-size check

The build prints a precache total. It is the cheapest possible proof that an
edit or a merge did what it looked like it did — the two string catalogues weigh
roughly 25 KiB, so a step that moves the number by ~25 KiB unexpectedly means a
catalogue got duplicated or leaked across a branch.

| Branch | Date | Precache |
|---|---|---|
| `main` | 2026-08-23 | 12 entries, 2,475.45 KiB |
| `phase-1-i18n` | 2026-08-23 (2nd), after merging `main` | 12 entries, 2,511.87 KiB |
| `phase-1-i18n` | 2026-08-24, first local build | 12 entries, **2,511.90 KiB** |

**2,511.90 KiB is the baseline for the current work.** The 0.03 gap from the
last Codespaces build is Windows CRLF line endings, not code — the JS bundle
hash was identical (`index-DaGpoujQ.js`). Do not "fix" it with a
`.gitattributes`. Record the new figure in
the handover whenever it moves. Capture it *before* a merge, not only after.

---

## 5. Where everything lives

```
src/
├── App.tsx              stage machine (checking → language → onboarding → auth → name → goals → ready)
├── Layout.tsx           nav shell
├── sections.tsx         section metadata (Meals, Body, Workouts, Routines)
├── index.css            all classes and CSS variables
├── components/          DialogProvider, NumberField, TextField, PasswordField,
│                        OptionSheet, EquipmentIcon, UpdatePrompt, ui.tsx, useDebounced.ts
├── data/                ALL persistence. Screens never import Dexie or Supabase directly.
│   ├── db.ts            Dexie schema (UpkeepDB, currently version 2)
│   ├── types.ts         every row type
│   ├── sync.ts          push/pull mapping (~713 lines)
│   ├── autoSync.ts      the scheduler
│   ├── syncWrites.ts    the re-entrancy guard (asSyncWrite)
│   ├── syncState.ts     the single local settings row — read/merge, never blind put
│   ├── adopt.ts         device adoption (merge / keep-local / keep-account)
│   ├── backup.ts        export/import
│   ├── i18n.ts          t(), useLanguage(), locale(), plural(), tParts()
│   ├── locales/         en.ts, de.ts
│   ├── numbers.ts       parseDecimal() — THE ONLY decimal parser
│   ├── ids.ts           newId(), now(), isLive()
│   ├── seed/            exercises.json — 1,324 bundled exercises, never written to Dexie
│   └── …                foods, log, goals, workouts, routines, careRoutines,
│                        measurements, exercises, exerciseStats, workoutStats,
│                        muscleGroups, overview, profile, auth, supabase, dates,
│                        changelog, feedback, install, search, openfoodfacts,
│                        commonFoods, exercisePopularity, audio
├── features/            one folder per section — about, auth, body, foods, goals,
│                        hub, log, onboarding, routines, settings, workouts
public/
├── _headers             the Content-Security-Policy — live and enforcing
└── icons, manifest assets
supabase/
├── schema.sql           CURRENT shape. Starts with DROP TABLE. NEVER run against live.
└── migrations/          2026-08-10-composite-pk.sql, 2026-08-17-routine-set-targets.sql,
                         2026-08-23-programs.sql
docs/
└── HANDOVER.md          the full project history and reasoning. Read after this file.
```

Gitignored and therefore not in a fresh clone: `.env.local`,
`PRIVATE-NOTES.md`, `.claude/settings.local.json`, `dist/`, `node_modules/`,
`audit.json`.

**`.env.local` holds `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.** Without
it `src/data/supabase.ts` throws at module load and the app renders a blank
screen — and **`npm run build` will not catch this**, because a build never
executes app code. If it goes missing, both values are in the Cloudflare Pages
dashboard under the `upkeep` project's environment variables.

**Temporary files, to be deleted once every tester has migrated:**
`src/data/db-old.ts`, `src/data/types-old.ts`, `src/data/migrate.ts`, and the
`importV1` branch of `backup.ts`. Do not "clean these up" unprompted.

---

## 6. Hard rules

Several of these were learned by breaking them. Treat them as non-negotiable
unless the user explicitly overrides one.

### Data layer

- **All persistence lives behind `src/data/`.** Screens never import Dexie or
  Supabase directly.
- **Dexie migrations are append-only.** New tables or indexes go in a NEW
  `this.version(n).stores({})` block. **Never edit an existing version block** —
  it silently breaks existing installs while working fine on new ones.
- **A non-indexed field needs no version bump.** Dexie stores whole objects.
  Never add an empty version block retrospectively for one — it is a no-op that
  can only break things.
- **Dexie does not downgrade.** A device that has opened a `version(2)` build
  will throw `VersionError` on a build declaring only `version(1)`. Rolling
  forward is safe; reverting a schema commit is not.
- **Dexie can only sort or filter on indexed fields.** Check `.stores()` first.
- **A boolean can never be a Dexie index.** IndexedDB key types are number,
  string, Date, binary and array. An index on a boolean silently holds nothing.
  `Program.isActive` is unindexed for this reason and filtered in JS.
- **Never write to the database inside a `useLiveQuery` callback.** Dexie runs
  those in a read-only transaction and throws `ReadOnlyError`, which blanks the
  screen with an unhelpful `[object Object]`.
- **Dexie hook callbacks must return `undefined`.** A returned value from
  `creating` is treated as the primary key and from `updating` as a
  modifications object. Use block bodies, not expression arrows.
- **Foods store macros per 100 g or 100 ml, never per serving.** Any portion is
  `value * amount / 100`, done in `macrosForAmount`.
- **Log entries snapshot their computed macros.** Editing a food must never
  rewrite historical entries.
- **`undefined` means loading, `null` means genuinely nothing.**

### Numbers and inputs

- **There is exactly one decimal parser: `parseDecimal()` in
  `src/data/numbers.ts`.** It accepts `,` and `.`, returns a `number` for a
  committable value, `''` for empty, and **`null` for mid-typing** (`67,`, `-`,
  `,`) — a `null` means keep the draft on screen and emit nothing. **Never write
  a second one.** Five copies of this rule is how four screens stayed broken for
  twelve days after the fifth was fixed.
- **A number input must be `type="text"` with `inputMode="decimal"`, never
  `type="number"`.** A number input sanitises its value *before* `onChange` sees
  it, so a comma is destroyed beyond recovery. `inputMode` still gets the right
  phone keyboard, which was the only thing `type="number"` was buying.
  Verification: `grep -rn 'type="number"' src/` must return nothing but a
  Recharts `XAxis` prop and comments.
- **Number inputs hold `number | ''` and are never coerced while typing.**
  `Number(raw) || 1` in an `onChange` is the bug pattern: `Number('')` is `0`,
  `0 || 1` is `1`, so clearing the field snaps it to 1.
- **Fixing a shared component does not fix screens that copied it by hand.**
  After changing a component screens might have inlined, grep for the *markup*,
  not just the import.

### Sync

- **Every synced row has a UUID primary key minted on the device** with
  `crypto.randomUUID()` (`newId()`). Never auto-increment.
- **`updatedAt` is stamped on every single write.** Forgetting it on one path
  means those edits never sync, silently.
- **Never hard-delete a synced row.** Set `deletedAt` and `updatedAt`. A hard
  delete leaves no tombstone, so the next pull resurrects the row.
- **`deletedAt` is deliberately not indexed** — IndexedDB omits rows whose field
  is `undefined`, so the index would contain only deleted rows. Filter in JS
  with `isLive`.
- Any "find the existing row for this date" query **must** filter deleted rows.
- **Reconcile, don't wipe-and-recreate.** Update by position, add beyond current
  length, soft-delete the remainder. Wipe-and-recreate assigns new ids each save
  and broke routine streaks once already.
- **Never write to Dexie from sync without wrapping in `asSyncWrite`.**
- **`syncAll` returns errors, it does not throw.** Every caller must check
  `.error`. An unchecked call is indistinguishable from success — a device was
  once claimed by an account it had failed to push a single row into.
- **Push order in the `TABLES` array is load-bearing** — parents before children,
  because of foreign keys. This has broken before.
- **Per-table cursors, not a global one.** `syncState.lastSyncedAt` is
  deprecated and must never be read or reintroduced.
- **A per-exercise value with no per-exercise row is written to every set and
  read from the first.** `restSeconds`, `rpe` and `notes` all work this way.
  Check this pattern before adding a new table for a per-exercise field.

### UI state

- **Do not prop-drill reactive data out of the stage machine.** Screens read
  what they display with `useLiveQuery` so a write from anywhere lands
  immediately.
- **One editable home per piece of data.** Name is edited in Settings only;
  Account shows it read-only and says where to change it.
- **Never put a minimum-length check on a login form.** Login validates against
  what already exists, not against the current policy. Raising it would lock out
  accounts created under the old minimum.
- **`prompt()` and `alert()` are banned.** Use the promise-based
  `DialogProvider` (`useConfirm`, `usePrompt`), which wraps every stage.

### Styling

- Classes live in `src/index.css`; shared components in `src/components/ui.tsx`
  (Button, Fab, Card, ScreenHeader, Empty, InlineRename).
- **Inline styles only for one-off layout — never for colours.** A light theme
  is on the roadmap and depends entirely on this rule having held.
- Dark theme only for now. Background `#0a0a0f`, accent `#7c5cff`.
- Touch targets minimum 44 px. Test layouts at 360 px wide.
- CSS variables: `--accent`, `--radius`, `--radius-sm`, `--warn`, `--success`,
  `--text-muted`, `--surface`, `--border`.

### i18n — every new screen must follow these

- **`t()` is a plain importable function, not a hook.** Components stay reactive
  through `useLanguage()`, which is `useSyncExternalStore` over the same
  module-level variable.
- **No module-level `const` may hold a translated string.** A top-level array
  evaluates once at import and freezes whatever language was active then.
  Convert to a function (`RPE_OPTIONS` → `rpeOptions()`). Default parameters are
  fine — they re-evaluate per call.
- **`de.ts` is typed `Record<keyof typeof en, string>`.** A missing or
  misspelled German key is a build error, not a runtime fallback. This is why
  the catalogues are flat dotted keys, not nested objects.
- **"Upkeep" is never translated, anywhere.** It appears verbatim in German
  strings. The wordmark JSX carries no translation key at all.
- **Route segments are not content.** `Section.id` and `SectionTab.path` stay
  English — `/meals/today` is the same URL in both languages.
- **Never pass `undefined` as a locale.** `toLocaleDateString(undefined, …)`
  means the *browser's* language, not the app's. Use `locale()` from `i18n.ts`.
- **`t(key, vars)` interpolates `{name}` placeholders**, so numbers that live in
  code stay in code: `t('auth.minChars', { n: MIN_PASSWORD })`.
- **`tParts(key, slot)` splits a string around one placeholder** so a component
  can wrap that slot in JSX. **Never use two half-sentence keys for this** — two
  halves hard-code English word order into the catalogue.
- **`plural(n, key)` reads one value with both forms separated by `|`**:
  `'{n} entry|{n} entries'`. Use it. Do not add `n === 1 ? … : …` ternaries.
- **Grep every file for a `t` shadow before adding the `t` import.** A
  `forEach((t) => t.stop())` silently makes `t('…')` resolve to the loop
  variable, with **no build error**. This has happened twice.
- **Technical error text stays English deliberately** — `err.message` from
  Supabase is printed verbatim in a `.faint` line because it is useful in a
  tester's screenshot.
- German copy conventions: informal "du" throughout; `Pläne` (not `Routinen`),
  `Einheit`/`Einheiten`, `Essen` (not `Lebensmittel`), `Guten Tag` for "Good
  afternoon", `Max Mustermann` as the name placeholder.
- **Stored data stays English permanently** — food names, meal ids, Dexie index
  keys. A `logEntry.foodName` is a snapshot and cannot be safely rewritten when
  the language changes.

### Other

- **Any new external origin must be added to `connect-src` in `public/_headers`**
  or the request is blocked in production and nowhere else. The CSP does not
  apply on the dev server, so this fails only after deploy, and it surfaces as a
  *network* error rather than a policy error.
- **Changelog entries are for releases, not commits.** `src/data/changelog.ts`
  exports `APP_VERSION` derived from `CHANGELOG[0].version`, so new entries go
  **first** in the array. **A commit is not a release** — a fix once shipped to
  production while About still reported the old version because no changelog
  entry was written. The check is
  `git show main:src/data/changelog.ts | head`, not `git log`.
- Infrastructure-only changes (not user-visible) do not get a changelog entry
  and do not bump the version.

---

## 7. Git rules

- **Never use `git stash`, `git checkout .`, `git reset`, or anything that
  discards uncommitted work.** If work needs to move between branches, commit it
  and cherry-pick. This rule saved the number-field work once already.
  Single-file `git checkout <path>` is acceptable only when the exact diff is
  known.
- **Small commits, conventional messages** (`fix:`, `feat:`, `chore:`,
  `refactor:`, `docs:`).
- **Commit messages carry only *why this change*.** Design rationale goes in
  code comments, project rules in the handover, user-facing changes in the
  changelog. Never write "Untested: X" in a commit message — the log is
  immutable and the claim stays true forever.
- **Run `npm run build` before every commit and before every push.**
- **Build after a clean auto-merge, not only after a resolved conflict.** Git
  auto-merged two files that differed on both sides once and the result compiled
  only by luck. Also run `grep -rn '<<<<<<<\|>>>>>>>' src/` before building.
- **Split work into independently testable chunks.** Verify each build before
  moving on. Large multi-part changes produce diffs too big to review.

### Branches

- **`main`** — production. Every push deploys to `upkeepdaily.com` automatically
  via Cloudflare Pages.
- **`phase-1-i18n`** — the current working branch. All current work happens
  here.
- **`accounts`** — a leftover from the 1.6 accounts work, local and remote.
  Nothing depends on it. Do not work on it and do not delete it without asking.
- Every non-production branch gets a public preview URL under
  `*.upkeep-4wa.pages.dev`. These are real and public — do not hand them out,
  but they are how the phone testing happens.
- **Do not assume a file is identical across the two branches** just because
  neither session meant to change it.

---

## 8. Current state and what is next

**Read `docs/HANDOVER.md` §12.16, §12.17 and §17 before proposing any plan.**

- Released version **2.1.1**, on `main`, deployed.
- **`main`** additionally carries the whole Programs *data layer* — two new
  tables (`programs`, `program_days`), four new columns, the Dexie `version(2)`
  block, sync mappers, `adopt.ts` and `backup.ts` entries. The migration
  `supabase/migrations/2026-08-23-programs.sql` **is applied to the live
  database**. None of it is visible to a user yet: nothing renders a program,
  creates one, sets a rep range, or shows workout notes.
- **`phase-1-i18n`** carries the i18n layer and roughly half the app translated
  — first-run journey, all six auth screens, navigation, hub, sections,
  Settings, and the entire meals section. It has merged `main`, so the two are
  level on data. It carries no version bump; nothing is shippable until the app
  translates end to end.

### The next piece of work

**The workout section is to be finished completely — every screen plus all the
Programs UI — before the remaining translation work.** This deliberately
overrides the earlier "i18n before features" ordering. The reason: the app is
meant to be used daily, and the workout section is the part that is not yet the
way its owner wants it.

**The mitigation matters as much as the decision: do this work on
`phase-1-i18n`, and write every new and rebuilt screen with `t()` from the first
line.** Born translated, arriving in a different order. **Do not start this on
`main`.**

**⚠ The scoping conversation has not happened yet.** Do not open a file or
propose a plan until it has. Ask these six questions first and expect the answer
to be longer than the list:

1. **What is wrong with the workout section today?** The thing noticed on every
   single use. This question has produced three separate backlogs already and is
   the highest-value question in this project.
2. **What does Workouts → Log become when a program is active**, and what when
   there is none?
3. **How does a program get created** — day-by-day editor, JSON import, or
   started from a predone seed? Which one is built *first* decides the shape of
   the first screen.
4. **Which workout-polish items belong in this pass:** floating rest-timer bar,
   the all-time PR crown, swap-exercise, target-muscle breakdown, moving
   Add-exercise left of discard/finish, time-based exercises.
5. **What "making working out like a game" means** — recorded with no detail and
   explicitly flagged as needing detail before anything is built against it.
6. **Anything not written down at all.**

Two decisions are known to be waiting inside this work and need taking, not
re-deriving: what volume means for a time-based exercise like a plank
(`workoutVolume`, `lastSetsFor` and the progress charts all assume weight ×
reps), and where `Routine.notes` is displayed on the active workout screen.

One open decision belongs at the front: whether to finish translating body, care
routines and About — five or six small screens, probably one short session —
before merging to `main`, or to merge partially translated. **Recommendation:
finish them first.** It is the owner's call; the stated priority is speed to a
usable app.

**Files to read before scoping anything:** `ActiveWorkoutScreen.tsx`,
`RoutineListScreen.tsx`, `RoutineFormScreen.tsx`, `WorkoutHistoryScreen.tsx`,
`WorkoutDetailScreen.tsx`, `WorkoutProgressScreen.tsx`,
`FinishWorkoutScreen.tsx`, `routines.ts`, `workouts.ts`, `workoutStats.ts`,
`types.ts`.

### Decided already — do not re-derive

Seven Programs decisions are taken and built. Weeks are an **integer column**,
not a table. Blocks were **dropped**. Days are **1–7 within a week**, anchored on
the date the program was made active. A logged workout links to the day it
satisfied through a **nullable column on `workouts`**. Rep ranges are
**reference only** — `RoutineSet` carries `repsMin`/`repsMax`, `WorkoutSet.reps`
stays one number, and prefill takes **`repsMin`**, never `repsMax`. The PR crown
is an all-time per-exercise record triggered on set completion. `commonFoods.ts`
keeps English names with German `keywords` only.

---

## 9. Infrastructure outside the repo

Changes here happen in a dashboard, not in code. Say so explicitly when a task
needs one.

- **Supabase** — project `upkeep`, Frankfurt, free plan. Postgres + auth + RLS.
  All sixteen tables carry
  `using (auth.uid() = user_id) with check (auth.uid() = user_id)`. RLS is the
  entire defence and it is correct; **omitting `with check` is the classic
  mistake.** Migrations are run by hand in the SQL Editor.
- **`supabase/schema.sql` begins with `drop table` statements. Never run it
  against the live project.** Write an incremental migration in
  `supabase/migrations/` instead, additive and nullable, and update `schema.sql`
  in the same session.
- **Cloudflare Pages** — builds `main` on every push, `npm run build` → `dist`.
  Env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `NODE_VERSION=24`.
  `src/data/supabase.ts` throws at module load if either is missing, so a build
  without them deploys a blank screen.
- **Two Cloudflare Workers:** `upkeep-search` proxies Open Food Facts
  Search-a-licious (that endpoint sends no CORS headers) — **do not "fix" it**;
  `upkeep-feedback` opens GitHub issues via a fine-grained PAT, rate-limited to
  3 requests per 60 seconds.
- **Resend** sends all email over SMTP configured inside Supabase. No email code
  exists in the app. Ceiling is 25/hour, and **Resend's daily cap is the binding
  constraint**, not Supabase's hourly one.
- **⚠ The GitHub PAT expires 29 October 2026.** In-app feedback will start
  failing silently. A calendar reminder for ~15 October is the whole mitigation.

---

## 10. Verification checklist before saying a task is done

1. `npm run build` — clean, no type errors.
2. Precache figure noted and compared to the last recorded one.
3. `grep -rn '<<<<<<<\|>>>>>>>' src/` — nothing (after any merge).
4. If a component with inlined copies changed: grep for the *markup*.
5. If dev-only helpers changed:
   `npm run build && grep -r upkeepSyncTest dist/` — must return nothing.
6. **Run the verification command in the same session as the fix, and paste the
   output.** A grep recorded in the conventions and never run is worth nothing —
   that is exactly how four screens went on corrupting data for twelve days
   after the bug was declared fixed.

---

## 11. Traps that have caught people here before

- **Vite's transform cache serves stale code across a dev-server restart, and it
  looks exactly like a code bug.** The tell: a console
  `await import('/src/data/x.ts')` gets the *new* code while the running app
  executes the *old*. Cure:
  ```bash
  rm -rf node_modules/.vite
  rm -f tsconfig.app.tsbuildinfo tsconfig.node.tsbuildinfo
  npm run dev
  ```
- **A stale service worker** produces an identical symptom. When something seems
  wrong after a deploy, check for one first. Force an update by fully closing
  the installed app and reopening — twice if needed — then check About shows the
  expected version.
- **Unused imports pass `npm run dev` and fail `npm run build`.**
- **`TS1109: Expression expected`** almost always means a bracket problem a few
  lines *above* where it is reported.
- **Red squiggles on imports that build fine** mean a stale TypeScript server
  after a rename. Restart TS Server; trust `npm run build`.
- **A severity label is not a risk assessment.** Read the dependency path before
  ranking an `npm audit` advisory. Three "high severity" items were carried as
  the top security concern for nine days; all three were dev-only.
- **Check the units before changing a number in a dashboard.** An email cap read
  as per-day when the field was per-hour silently inverted which ceiling was
  binding.
- **Adding a second editing surface without checking for an existing one.**
  Duplication of function is invisible to the compiler.
- **A duplicated CSS selector.** `.wordmark` was defined twice; the later block
  silently won, so edits to the earlier one appeared to do nothing.
- **A burst of identical Supabase failures is not necessarily your code
  looping** — supabase-js retries internally. `upkeepAutoSync.log()`
  distinguishes the two and is the single most useful debugging tool here.
- **Logging out leaves all local data on the device** by design, so the UI can
  appear to contain the previous user's data while signed into a different
  account.

### Dev console helpers (stripped from production builds)

```js
upkeepSyncTest.syncAll() / .peek('foods') / .cursors() / .resetCursors()
upkeepAutoSync.log() / .syncNow('manual') / .claimDevice()
upkeepAdopt.preview() / .adopt('merge' | 'keep-local' | 'keep-account')
upkeepAuth.signIn / signOut / isSignedIn
upkeepSync.getSyncState / clearOnboardingSeen
upkeepInstall.canPrompt() / .isInstalled()

const { db } = await import('/src/data/db.ts')   // db is not a global
```

Calling a data function directly in the console is the closest thing this
project has to a unit test. Start something, read the result, **soft**-delete it.

---

## 12. Session protocol

### Starting a session

1. Read this file, then `docs/HANDOVER.md` — at minimum §17 ("How to start"),
   §12.17 and the section covering the area being touched.
2. Run `git status` and `git branch --show-current`. Confirm the working tree is
   clean and the branch is the intended one (`phase-1-i18n` unless told
   otherwise).
3. **Ask what the user wants to work on.** They usually arrive with something
   more current than any list in the docs.
4. **Read the actual files** before proposing anything. Do not estimate from the
   handover.
5. Present a plan — files to change, what each change does, in testable chunks —
   and wait for approval before writing code.

### Ending a session

**When the work is done, commit it, push it, and say so explicitly.** Do not
wait to be asked. The final message should end with something like
*"Committed and pushed to `phase-1-i18n`. Handover updated. Ready to clear."*

If something is intentionally left uncommitted or unpushed — waiting on
approval, a broken build, a decision not yet taken — **say that instead, plainly**,
so it is obvious the session is not in a clean handoff state.

Then:

1. `npm run build` — must be clean.
2. Commit and push.
3. **Update `docs/HANDOVER.md`** with targeted edits, not a rewrite: what was
   done, what was decided and why, what was tested and what was not, the new
   precache figure, and what the next session should do first. Anything left
   untested must be written down as untested. Add a row to §15's session log.
4. Commit the handover update too.

**Do not edit the handover mid-session.** Hold all changes until the end, then
apply them in one pass.

### Handover discipline

`docs/HANDOVER.md` is the project's long-term memory and is more valuable than
any single session. It is the file a fresh Claude Code session reads after
`/clear` to know what is going on. Keep it honest: record what was *not* tested,
mark superseded reasoning rather than deleting it, and never let it claim
something is done that has only been committed.
