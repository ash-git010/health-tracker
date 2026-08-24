# Upkeep — project handover

**This file is `docs/HANDOVER.md` in the repository.** It is the project's
long-term memory: everything needed to continue without prior context, plus the
reasoning behind decisions so nobody re-derives them.

**It is no longer pasted into a chat.** As of 2026-08-24 the work happens in
**Claude Code**, which reads this file off disk. `CLAUDE.md` at the repo root
holds the rules and conventions; this file holds the history, the decisions and
the current state. Read `CLAUDE.md` first, then this.

**The version number in the filename is gone.** It used to be
`UPKEEP-HANDOVER-17.md`; git now provides the history, so the file is edited in
place and committed. Update it at the **end** of every session, never during
one — see §19.

**Newest session first: 2026-08-24 moved the whole project off GitHub Codespaces
onto a local machine and out of the claude.ai chat into Claude Code.** No
application code changed. What changed is where the work happens and how a
session is run — see the new **§19**, which is now the first thing to read after
§1. The dev environment section (§2) and the toolchain notes (§3) were corrected
to match. **`CLAUDE.md` exists again at the repo root**, deleted during the
2026-08-10 cutover and now deliberately restored, because Claude Code reads it
automatically at the start of every session.

**The personal and legal research that used to sit inside §12.11 has moved to
`PRIVATE-NOTES.md`, which is gitignored**, because this repository is public.
Nothing was lost; §12.11 carries a pointer.

---

Previous update: 2026-08-23 (2nd), which **translated the entire meals section in
five tested chunks** and then **deliberately reordered the roadmap**. Meals is
done — Today, Foods, Goals, Charts, the food form and the barcode scanner.
Decision 17 is answered. And the priority changed at the end of the session:
**the workout section is to be finished completely, UI and all, before the
remaining translation work.** See §12.17 for that decision and what it costs.

**⚠ §18's first "non-negotiable" ordering has been consciously overridden.**
i18n-before-features was correct as engineering and is being set aside for a
reason it did not anticipate: the app is not usable the way its owner wants it
yet, and Programs UI is what closes that. This is a decision, not a mistake, and
§12.17 records the cost so nobody re-derives it as an oversight.

**The previous session, on 2026-08-23, took every open Programs decision and
built the entire data layer for them** — two new tables, four new columns, a
live migration, and the routine-notes bug from §12.16 closed. All of it is on
`main` and none of it is visible to a user yet. **§12.16 is now decisions rather
than scoping**, and §18's Phase 3 is unblocked.

**The database moved on 2026-08-23 and the migration is applied.**
`supabase/migrations/2026-08-23-programs.sql` created `programs` and
`program_days`, added `workouts.program_day_id`, `workout_sets.notes` and the
program columns, and both RLS policies. Verified by re-running §10's constraint
query — `program_days_program_id_fkey` spans `(user_id, program_id)` and not
`program_id` alone, which is the check that separates a composite foreign key
from a merely-present one — and by a
`pg_policies` check, because the project's event trigger enables RLS without
creating a policy and a table locked to its own owner looks identical to one
that works.

**The whole data layer was round-tripped, not just built.** A program row with
a jsonb `week_notes`, a `date` column and two booleans was pushed, peeked at
server-side, then pulled back with the cursors cleared. `week_notes` survived as
an object, `started_on` did not shift a day despite the connection doing
timezone work on the columns beside it, and `is_active` came back `false` rather
than `undefined` — which would have been invisible until a program silently
refused to activate.

**A bug §12.16 found is fixed and shipped: routine notes now reach a workout.**
`WorkoutSet.notes` exists, `startWorkoutFromRoutine` writes `ex.notes` to every
set of an exercise, and `setNotesForExercise` reads and rewrites it the way
`restSeconds` and `rpe` already do. This had been broken since notes shipped in
2.1 — the field had nowhere to land.

**Finding the reason it *looked* broken cost most of the session, and §14 now
has two new entries about it.** Vite's transform cache in `node_modules/.vite`
was serving the app pre-edit `routines.ts` across a dev-server restart, while
every console `await import()` got the real file. Four causes were proposed
from reasoning before anyone measured; the one command that settled it ran the
UI path and the direct call side by side and compared them.

**⚠ 2.1.1 was never a released version until 2026-08-22 (2nd), and this document
said it was.** The `NumberField` fix was committed to `main` on the morning of
2026-08-22 (`6d5d9ce`) and deployed — but **no changelog entry was ever
written**. §5 records that `APP_VERSION` derives from `CHANGELOG[0].version`,
so the About screen went on reporting **2.1** while this document's opening line
claimed 2.1.1 for the rest of the day. Caught by reading `changelog.ts` on both
branches, not by anything failing. The 2.1.1 entry now exists and covers the
comma fix as one thing. **The lesson is §5's own rule read backwards: a commit
is not a release, and the changelog entry is the only thing that bumps the
version.**

**The decimal-comma bug was only one-fifth fixed, for twelve days.** The morning
session fixed `NumberField.tsx` and stopped. §5 already said
`grep -rn 'type="number"' src/` finds the remaining candidates and **nobody ran
it**. Four screens hand-rolled their own inputs and were still silently
destroying data: `ActiveWorkoutScreen` (set weight), `RoutineFormScreen` (target
weight and reps), `WorkoutDetailScreen` (editing a past set) and `AddEntry`
(food amount). The workout one is the worst of them — a corrupted set weight
also poisons `workoutVolume`, the Epley 1RM, the PR list and the volume trend,
all of which stay wrong after the row itself is corrected. All four are fixed
and the parser now lives once, in `src/data/numbers.ts`. Full detail in §13.

**The morning session of the same day started Phase 1 and took its three
blocking decisions.** The i18n layer is built and about half the app is now
translated: the whole first-run journey, the entire account and recovery
journey, the navigation, the hub, the section metadata and Settings. It sits on
a branch, `phase-1-i18n`, not on `main`. **Decisions 1, 2 and 3 are answered** —
hand-rolled, enum-only, bilingual emails; see §12.13.

**The session before it, on 2026-08-19 (second session), cleared Phase 0 of §18**
and closed the open file-read question. Two latent bugs fixed, three `npm audit`
advisories patched, GitHub Pages switched off, email ceilings raised and read off
both dashboards. One Phase 0 item survives and it is a calendar entry rather than
work: the PAT expires 29 October. **Decision 6 is answered** — see §12.15. The
exercise seed *does* carry primary and secondary muscles, and the normalisation
layer for them already exists and is verified correct, so the muscle heatmap and
smart exercise-swap are display jobs, not data jobs.

The session before *that*, on 2026-08-19, wrote **no code at all**. It produced §18,
the roadmap: ten ordered phases covering everything I want built, plus the
conflicts between those things. It also added one genuinely new requirement —
**the app is to be bilingual, English and German** (§12.13).

The session before that, on 2026-08-18, shipped a Content-Security-Policy and
spent the rest of the time on research: what to build next, what a public
release would cost, and what it would require legally. None of that research
was a decision — see §12.11, and `PRIVATE-NOTES.md` for the legal and funding
half of it, which is gitignored because this repo is public.

**Current released version: 2.1.1.** Everything below is on `main` and deployed.
Accounts, automatic sync and adoption went out in 1.6 and are verified on a real
phone. 1.7 added the onboarding slideshow, the install guide and the new icon.
1.8 added password changing and made the hub greeting reactive. 1.9 fixed the
composite primary key bug and strengthened the account copy. 2.0 released the
domain cutover to testers and closed the account-recovery gap. 2.1 rebuilt
routines around per-set targets and fixed the workout screen. **2.1.1 is the
decimal-comma patch plus the set `×` removal** — deliberately released on its own
rather than waiting for Phase 1, because a silent ten-times data error should not
sit unreleased for a fortnight. It covers **five** files' worth of that bug, not
the one the morning session fixed; see the ⚠ above and §13.

~~**Verify where 2.1.1 actually landed before doing anything else.**~~
**ANSWERED 2026-08-22 (2nd): it was on `main`** as `6d5d9ce`, at the tip, not
swept onto the branch. One `git log main --oneline` settled it, exactly as this
paragraph predicted. What that command could *not* show — and what nobody
thought to check — was whether the version had actually been *released*. It had
not. See the ⚠ above.

**There is no known correctness bug as of the end of 2026-08-22**, and this time
that claim has been checked rather than assumed: `grep -rn 'type="number"' src/`
returns only a Recharts `XAxis` prop and two code comments. The previous version
of this document made the same claim while four screens were actively corrupting
data. §11 is a record of a different fixed one, kept because the reasoning still
explains the schema. **§18 is now the plan**; §17 tells you how to start a
session against it.

**A CSP is live and enforcing** as of 2026-08-18. `public/_headers` exists — a
file this document previously said had never been committed. §16's largest named
gap is closed. Read §12.12 before adding any new external origin, because a
blocked request looks like a network error, not a policy error.

**Hosting moved on 2026-08-10, and the old origin is now gone.**
`upkeepdaily.com` is the app, served from `main` by Cloudflare Pages. **GitHub
Pages was switched off on 2026-08-19** once every tester confirmed they had
migrated. The farewell page and its rescue export no longer exist and cannot be
brought back. See §12.3.

**The gate on new testers is lifted.** Since 2026-08-10 the app was not being
shared with new people until password recovery existed. It now does (§12.4), so
onboarding testers is unblocked.

**The workout questions have been asked and answered.** The first 2026-08-18
session worked through the list that used to live only in my head. What survives
from it is written down in §12.10 — one deferred feature and a handful of
smaller things. There is no longer a hidden backlog to ask about.

**A new, larger hidden list has replaced it, and it is now written down too.**
§12.11 holds everything from the second 2026-08-18 session: feature ideas
scraped from Reddit, what an AI feature would actually cost, how a free public
release could be funded, and the legal position of doing that. **The funding and
legal part now lives in `PRIVATE-NOTES.md`** (gitignored, 2026-08-24) and
§12.11 points at it. **Nothing in either is decided.** It is a menu, not a plan,
and it was explicitly recorded that way.

**§18 is the first thing in this document that is actually a plan.** On
2026-08-19 I went through eighteen screenshots of a paid competitor app, said
which of it I wanted, and that was combined with §12.11's menu and §17's
leftovers into ten ordered phases. §12.14 records the screenshot audit itself —
what they have, what I already had, and what I ruled out. Unlike §12.11, §18
commits to an *order*; it does not commit to shipping every item in it.

**The app is to be bilingual — English and German, user-chosen.** Not machine
translation. This is new as of 2026-08-19 and it is a build constraint rather
than a feature, in the same way the CSP was: every screen written from now on
either carries translatable strings or gets retrofitted later. §12.13 has the
detail, and it is why it sits at the front of the roadmap.

**Two things reorder the whole plan, and they are the reason §18 exists.**
i18n has to go in before the feature work, and **Programs** has to go in before
the dashboard, the checklist, the weekly schedule and any workout streak,
because all four read program state. Building those first means building them
twice. Everything else in §18 can be reshuffled.

**Programs was scoped on 2026-08-22 (2nd) and decided and built on 2026-08-23.**
§12.16 holds both: what the model looks like, and every decision that was open
at the end of the scoping. Weeks are an **integer column**, not a table. Blocks
were **dropped entirely**. Days are **Day 1–7 within a week**, anchored on the
date the program was made active. A logged workout links to the day it satisfied
through a **nullable column on `workouts`**. Rep ranges are **reference only** —
a logged set still carries one number. The schema-shaped bug it found is fixed.

**What is left of Programs is all UI, and it is deliberately not written yet.**
Nothing renders a program, nothing creates one, nothing sets a rep range, and
`ActiveWorkoutScreen` has no notes area — so two of the new fields are written
by code nobody can reach. That is on purpose: those screens should be **born
translated**, which means they come after Phase 1 merges rather than before.

---

## 1. Who I am and how I want to work

I'm a beginner learning to code. I've built this app over roughly three weeks
with Claude's help, making the architectural decisions myself and having Claude
write most of the implementation. I understand *why* the code is structured the
way it is, but I can't write it from scratch.

**How to work with me:**

- Explain the *why*, not just the *what*. I want to understand before moving on.
- **Show the plan and the file tree before writing component code.** Which
  files change, what each change does, then wait for a go-ahead on anything
  bigger than a small fix.
- **Explain things simply.** Skip jargon; if a technical term is unavoidable,
  say what it means in plain English in the same sentence. Assume I don't
  already know database or framework terminology. A short plain-language
  explanation beats a precise dense one.
- ~~**Give me complete files, not partial diffs.**~~ **SUPERSEDED 2026-08-24.**
  This rule existed because files were being pasted into a chat window and
  retyped. **Claude Code edits files on disk**, so the whole question is gone —
  make targeted edits and let me read the diff. *The reasoning underneath it
  still matters:* the risk was always a swapped `carbs`/`fat` in a block I'd
  skim past, so **keep edits small and reviewable**, and say what changed rather
  than assuming I'll spot it.
- **Always tell me exactly where something goes** — full repo path, or "Supabase
  SQL Editor", or "terminal". Never leave it ambiguous. If a step touches no
  repo files, say so explicitly.
- **Read the file before writing about it.** In Claude Code there is no excuse
  for reasoning from this document about code — the file is right there.
- Tell me when I'm wrong. I've made design calls that needed pushing back on.
- One session at a time, testable at the end of each.
- **Small commits, conventional messages** (`fix:`, `feat:`, `chore:`,
  `refactor:`, `docs:`).
- **When a session's work is done, commit it, push it, and say so explicitly**
  — e.g. "Committed and pushed. Ready to clear." Don't make me ask each time.
  If something is intentionally left uncommitted or unpushed — waiting on
  approval, broken build, decision not taken — **say that instead, plainly**, so
  it's clear the session isn't in a clean handoff state.
- **Update this document at the end of each session** so the next Claude Code
  session knows what to do after `/clear`. See §19.
- Real tester feedback (friends on Android and iPhone) drives priorities.
- When I say I'm confused, give me numbered commands to copy-paste, not
  explanation. Explain afterwards if I ask.
- I read these on my phone during commutes. Keep explanations mobile-friendly.

**A hard-won lesson from 2026-08-06, worth reading before you start:**

Claude spent half a session "fixing" the food search based on a theory built
from web search results, never testing against the live API. Three consecutive
fixes were wrong, each one breaking something that already worked, and the whole
thing was rolled back. The search was never broken.

The rule that came out of it: **test the assumption before writing the fix.**
One curl command would have saved hours. If a diagnosis rests on inference
rather than evidence from my actual system, say so and get the evidence first.

This rule earned its keep again on 2026-08-09. Two bugs were diagnosed correctly
only after console or SQL output contradicted the reasoning from code, and one
"bug" turned out to be supabase-js retrying internally. See §14.

It earned its keep a third time the same day, in the opposite direction. A 2–3
second startup delay and an unexplained Brave permission prompt were both
reported on the **dev server only**. Rather than theorise, the answer was to
check the deployed build — both vanished. Vite serves hundreds of unbundled
modules through the Codespaces tunnel, so slow first paint there is normal and
says nothing about production. **Reproduce on the real build before diagnosing
anything.**

---

## 2. What Upkeep is

A personal health tracking PWA covering nutrition, body weight, strength
training, and daily care routines. Installed to the home screen, works offline,
data stored locally and synced to a server when signed in.

- **Repo:** `github.com/ash-git010/health-tracker` (public, all-rights-reserved
  licence)
- **Live, from `main`:** `upkeepdaily.com`, also `upkeep-4wa.pages.dev`.
  `www.upkeepdaily.com` 301-redirects to the apex via a Cloudflare single
  redirect rule — deliberately a redirect, not a second custom domain, because
  two origins would mean two IndexedDBs and an app that looks like it lost the
  user's data.
- **Gone:** `ash-git010.github.io/health-tracker/` was switched off on
  2026-08-19. It previously served a frozen farewell page with a rescue export.
  **That origin no longer resolves and the rescue export cannot be recovered.**
  See §12.3.
- **Dev environment, since 2026-08-24:** a **local machine** — Windows, Git Bash,
  VS Code, Node 24 — with **Claude Code** as the assistant. The repo lives at
  `D:\dev\Projects\upkeep`. Dev server on `http://localhost:5173`.
- **~~GitHub Codespaces~~ — retired 2026-08-24.** It is no longer the dev
  environment and any instruction in this document saying "Codespaces terminal"
  means the local terminal. Everything was committed and pushed on both
  `main` and `phase-1-i18n` before the move, and the local clone was verified
  byte-identical by building it — same bundle hash, `index-DaGpoujQ.js`.
- **Phone testing changed with it, and this matters.** Codespaces forwarded port
  5173 as a public HTTPS URL. `localhost` is not that, and **`--host` plus a LAN
  IP will not work for the barcode scanner**, because camera access requires a
  secure context (HTTPS or localhost, not a plain-http LAN address).
  **Use the Cloudflare branch preview instead**: push `phase-1-i18n` and open
  its `*.upkeep-4wa.pages.dev` URL on the phone. Real HTTPS, real service
  worker, real production build — strictly closer to what testers see than
  Codespaces ever was.
- **A third branch exists and this document never mentioned it: `accounts`.**
  Almost certainly a leftover from the 1.6 accounts work, both local and remote.
  Nothing depends on it. Confirm it holds nothing unique and delete it, or leave
  it; either is fine, but don't be surprised by it.
- **Supabase project:** `upkeep`, org `Upkeep`, Free plan, Frankfurt region
  - URL: `https://xpgvjvtluljbqyywnenl.supabase.co`
  - Publishable key is in `.env.local` and in GitHub repository variables

---

## 3. Stack

React 19 · TypeScript · Vite · Dexie (IndexedDB) · React Router ·
Recharts · Lucide icons · vite-plugin-pwa (Workbox) · `@supabase/supabase-js`

Email is sent by **Resend** over SMTP, configured inside Supabase (§12.4). No
email code exists in the app — Supabase composes and sends every message.

Fonts: system-ui throughout, Bricolage Grotesque for the wordmark only
(via `@fontsource/bricolage-grotesque`).

Deployed to `upkeepdaily.com` by Cloudflare Pages from `main`. The bundle is ~1.67 MB raw / ~464 KB gzipped,
plus a separate ~840 KB chunk for the exercise dataset (~98 KB gzipped) loaded
on demand.

**Precache figures, worth keeping accurate, because the difference between them
is the only cheap check that a merge or an edit did what you thought it did:**

| Branch | Date | Precache | Main bundle |
|---|---|---|---|
| `main` | 2026-08-22 (2nd) | 12 entries, 2,473.50 KiB | `index-CzOQzMN3.js`, 1,665.11 KiB |
| `phase-1-i18n` | 2026-08-22 (2nd) | 12 entries, **2,498.66 KiB** | `index-CbTrzluQ.js`, 1,690.87 KiB |
| `main` | 2026-08-23 | 12 entries, **2,475.45 KiB** | `index-D-bwUiwk.js`, 1,667.10 KiB |
| `phase-1-i18n` | 2026-08-23 (2nd), **after merging `main`** | 12 entries, **2,511.87 KiB** | `index-DaGpoujQ.js`, 1,704.40 KiB |
| `phase-1-i18n` | 2026-08-24, **first local build** | 12 entries, **2,511.90 KiB** | `index-DaGpoujQ.js`, 1,704.40 KiB |

**The 0.03 KiB difference on the first local build is line endings, not code.**
`git config core.autocrlf` is `true` on the Windows machine, so text files are
checked out with CRLF — one extra byte per line, and `index.html` is about
thirty lines. **The JS bundle hash is identical (`index-DaGpoujQ.js`)**, which
is far stronger evidence than the total: the same hash means the same bytes went
into the same bundle, so nothing was lost or altered in the move. **Do not
"fix" this with a `.gitattributes`** — that can trigger a one-time rewrite of
every file in the repo, which is a much larger mess than thirty bytes.
**2,511.90 is the local baseline from here on.**

**2,511.87 is the baseline to measure the workout work against.** It is the
first build in which the i18n layer and the Programs data layer have existed in
one tree.

**The meals block was measured chunk by chunk and the first figure is the one
to reason from:** the branch built at **2,501.17 KiB** after the Today and Add
Entry screens, up 2.51 from 2,498.66. Roughly fifty keys in two languages plus
the code changes. Every later chunk moved it by a similar amount. **A step that
moved it by ~25 KiB would have meant a catalogue had been duplicated**, which is
the whole reason the number is checked per chunk rather than once at the end.

**One honest caveat about the merge arithmetic.** The branch's figure was not
captured between the last meals chunk and the merge, so 2,511.87 was only
*reconciled* — back out Programs' ~1.95 KiB and the two new adopt keys and the
pre-merge branch lands near 2,509.7, which is 2,501.17 plus about 2 KiB for each
of the four remaining chunks. That is enough to rule out a duplicated
catalogue, which is what the number is for, but it is reconstruction rather than
measurement. **Capture the figure before a merge next time, not after.**

The ~25 KiB gap between the two branches is both string catalogues. This was
used as evidence during the 2.1.1 cherry-pick: `main` building at 2,473.50
against the 2,473.13 recorded before the patch proved that **no i18n work had
leaked across with it**, which a reading of the diff alone would not have
established as firmly.

**The 2026-08-23 Programs work cost 1.95 KiB in three measured steps** — 1.52
for the sync mappers and coercion, 0.26 for the adopt and backup entries, 0.17
for the routines and workouts edits. Each build was checked against the last,
and each matched the prediction. That is not a vanity metric: a step that moved
the number by ~25 KiB would have meant a catalogue had leaked in from the
branch.

**There is no i18n library.** Translation is ~60 lines in `src/data/i18n.ts`
plus two catalogue files. See §12.13 for why, and for why the catalogues are
static imports rather than dynamic ones.

**Correction, 2026-08-10.** This section previously said the Workbox 2 MB limit
"is raised in `vite.config.ts`" and warned "don't lower it". There is no such
setting in `vite.config.ts` and there never needed to be: **the Workbox limit is
per file, while the ~2,455 KiB figure is the total across all entries.** The
largest single file is the 840 kB exercise chunk, comfortably under. The warning
was guarding a setting that does not exist. Claude nearly added one back on the
strength of this paragraph, against a file that had already been pasted showing
otherwise — trust the file, not this document.

(Entries dropped from 13 to 12 when `public/404.html` was deleted for the
Cloudflare migration.)

**Local database is `UpkeepDB`, not `HealthTrackerDB`.** See §6.

---

## 4. File structure

One addition on `main` since the last handover:
**`supabase/migrations/2026-08-23-programs.sql`** (§8). `src/data/numbers.ts`,
`public/_headers` (the CSP, §12.12) and `Suggestions.md` (the Reddit scrape
behind §12.11) were the previous three.

**Three additions on 2026-08-24, none of them code:** **`CLAUDE.md`** at the
repo root (Claude Code reads it automatically every session — rules,
conventions, verification checklist), **`docs/HANDOVER.md`** which is this file,
and **`PRIVATE-NOTES.md`** which is **gitignored** and holds the personal and
legal research moved out of §12.11. `.claude/settings.local.json` and
`.env.local` also exist and are gitignored. `dist/` is build output and is
deliberately not listed below.

**`.env.local` is the one file a fresh clone cannot produce**, and the app dies
without it — `src/data/supabase.ts` throws at module load, which renders a blank
screen with the reason only in the browser console. It holds
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; if it is ever lost, both are
readable from the Cloudflare Pages dashboard (project `upkeep` → Settings →
Environment variables) or from Supabase → Project Settings → API.

**`CLAUDE.md` existed once before and was deleted on 2026-08-10** during the
Cloudflare cutover, alongside `deploy.yml` and the `cloudflare-pages` branch
(§15). Its return is deliberate and it is not the same file — the old one was a
leftover, this one is the entry point for every session.

~~**⚠ `audit.json` is sitting in the repo root and nobody put it there on
purpose.**~~ **RESOLVED 2026-08-23. It was tracked** — `git ls-files audit.json`
returned it, so it needed a commit rather than only a `.gitignore` line. Both
were done: `git rm --cached` plus an entry in `.gitignore`, so a future
`npm audit --json > audit.json` cannot put it back into a commit. Its contents
were the 2026-08-19 Phase 0 run, exactly as predicted — the three build-time
advisories §16 records, with `"prod": 65, "dev": 474` in the metadata, which is
itself the evidence for that section's claim about which dependencies matter.

```
.
├── LICENSE
├── README.md
├── Suggestions.md
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── public
│   ├── _headers
│   ├── apple-touch-icon-v3.png
│   ├── favicon.svg
│   ├── icon-192-v2.png
│   ├── icon-192-v3.png
│   ├── icon-192.svg
│   ├── icon-512-v2.png
│   ├── icon-512-v3.png
│   ├── icon-512.svg
│   ├── icon-maskable-192-v3.png
│   ├── icon-maskable-512-v3.png
│   ├── icon.svg
│   └── icons.svg
├── scripts
│   └── fetch-exercises.mjs
├── src
│   ├── App.tsx
│   ├── Layout.tsx
│   ├── assets
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── components
│   │   ├── DialogProvider.tsx
│   │   ├── EquipmentIcon.tsx
│   │   ├── NumberField.tsx
│   │   ├── OptionSheet.tsx
│   │   ├── PasswordField.tsx
│   │   ├── TextField.tsx
│   │   ├── UpdatePrompt.tsx
│   │   ├── ui.tsx
│   │   └── useDebounced.ts
│   ├── data
│   │   ├── adopt.ts
│   │   ├── audio.ts
│   │   ├── auth.ts
│   │   ├── autoSync.ts
│   │   ├── backup.ts
│   │   ├── careRoutines.ts
│   │   ├── changelog.ts
│   │   ├── commonFoods.ts
│   │   ├── dates.ts
│   │   ├── db-old.ts
│   │   ├── db.ts
│   │   ├── exercisePopularity.ts
│   │   ├── exerciseStats.ts
│   │   ├── exercises.ts
│   │   ├── feedback.ts
│   │   ├── foods.ts
│   │   ├── goals.ts
│   │   ├── i18n.ts
│   │   ├── ids.ts
│   │   ├── install.ts
│   │   ├── locales
│   │   │   ├── de.ts
│   │   │   └── en.ts
│   │   ├── log.ts
│   │   ├── measurements.ts
│   │   ├── migrate.ts
│   │   ├── muscleGroups.ts
│   │   ├── numbers.ts
│   │   ├── openfoodfacts.ts
│   │   ├── overview.ts
│   │   ├── profile.ts
│   │   ├── routines.ts
│   │   ├── search.ts
│   │   ├── seed
│   │   │   ├── ATTRIBUTION.md
│   │   │   └── exercises.json
│   │   ├── supabase.ts
│   │   ├── sync.ts
│   │   ├── syncState.ts
│   │   ├── syncWrites.ts
│   │   ├── types-old.ts
│   │   ├── types.ts
│   │   ├── workoutStats.ts
│   │   └── workouts.ts
│   ├── features
│   │   ├── about
│   │   │   ├── AboutScreen.tsx
│   │   │   ├── FeedbackScreen.tsx
│   │   │   └── InstallScreen.tsx
│   │   ├── auth
│   │   │   ├── AccountScreen.tsx
│   │   │   ├── AdoptScreen.tsx
│   │   │   ├── AuthGateScreen.tsx
│   │   │   ├── ForgotPasswordScreen.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── body
│   │   │   ├── BodyScreen.tsx
│   │   │   └── MeasurementFormScreen.tsx
│   │   ├── foods
│   │   │   ├── BarcodeScanScreen.tsx
│   │   │   ├── BarcodeScanner.tsx
│   │   │   ├── FoodForm.tsx
│   │   │   ├── FoodFormScreen.tsx
│   │   │   ├── FoodListScreen.tsx
│   │   │   ├── FoodSearch.tsx
│   │   │   └── FoodSearchScreen.tsx
│   │   ├── goals
│   │   │   └── GoalsScreen.tsx
│   │   ├── hub
│   │   │   └── HubScreen.tsx
│   │   ├── log
│   │   │   ├── AddEntry.tsx
│   │   │   ├── AddEntryScreen.tsx
│   │   │   ├── ChartsScreen.tsx
│   │   │   └── TodayScreen.tsx
│   │   ├── onboarding
│   │   │   ├── LanguageScreen.tsx
│   │   │   ├── NameScreen.tsx
│   │   │   └── OnboardingScreen.tsx
│   │   ├── routines
│   │   │   ├── CareRoutineFormScreen.tsx
│   │   │   ├── RoutineManageScreen.tsx
│   │   │   └── RoutineTodayScreen.tsx
│   │   ├── settings
│   │   │   └── SettingsScreen.tsx
│   │   └── workouts
│   │       ├── ActiveWorkoutScreen.tsx
│   │       ├── ExerciseDetailScreen.tsx
│   │       ├── ExerciseFormScreen.tsx
│   │       ├── ExerciseLibraryScreen.tsx
│   │       ├── ExercisePicker.tsx
│   │       ├── FinishWorkoutScreen.tsx
│   │       ├── FolderPicker.tsx
│   │       ├── RoutineFormScreen.tsx
│   │       ├── RoutineListScreen.tsx
│   │       ├── SaveAsRoutineScreen.tsx
│   │       ├── WorkoutDetailScreen.tsx
│   │       ├── WorkoutHistoryScreen.tsx
│   │       ├── WorkoutProgressScreen.tsx
│   │       ├── rest.ts
│   │       └── rpe.ts
│   ├── index.css
│   ├── main.tsx
│   ├── sections.tsx
│   └── vite-env.d.ts
├── supabase
│   ├── migrations
│   │   ├── 2026-08-10-composite-pk.sql
│   │   ├── 2026-08-17-routine-set-targets.sql
│   │   └── 2026-08-23-programs.sql
│   └── schema.sql
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts

23 directories, 130 files
```

(Plus the untracked-or-not `audit.json` noted above, which is not counted here.)

**On the `phase-1-i18n` branch, add:** `src/data/i18n.ts`,
`src/data/locales/en.ts`, `src/data/locales/de.ts` and
`src/features/onboarding/LanguageScreen.tsx` — one new directory, four new
files. Everything else in Phase 1 so far is edits to files that already existed.

**The branch was up to date with `main` as of 2026-08-22 (2nd)**, but `main` has
moved since. 2.1.1 was cherry-picked onto `main` and then `main` was merged back
in, so both carry the number-field work. `ActiveWorkoutScreen.tsx` and
`RoutineFormScreen.tsx` exist in two slightly different versions — the branch's
use `rpeOptions()`, `main`'s still use `RPE_OPTIONS` — and git auto-merged both
without a conflict. **Do not assume a file is identical across the two branches
just because neither session meant to change it.**

~~**⚠ `main` gained the whole Programs data layer on 2026-08-23 and the branch has
not seen it.**~~ **MERGED 2026-08-23 (2nd). The two are level on data.** It went
exactly as this paragraph predicted: **one conflict, in `adopt.ts` and nothing
else**, with `db.ts` auto-merging silently to carry the Dexie `version(2)` block
across. `TABLE_LABELS` was resolved to the branch's **function** form with
`programs` and `program_days` added in `LOCAL_BY_SERVER`'s order, plus two new
catalogue keys — `adopt.table.programs` ("Programs" / "Programme") and
`adopt.table.programDays` ("Scheduled days" / "Geplante Tage"). Built clean
afterwards at 2,511.87 KiB, per §14's rule that a clean auto-merge still needs a
build. **`grep -rn '<<<<<<<\|>>>>>>>' src/` returned nothing** before the build,
which is the cheap check that no marker survived somewhere unexamined.

---

## 5. Architecture and conventions

These are hard rules. Several were learned by breaking them.

### Data layer

- **All persistence lives behind `src/data/`.** Screens never import Dexie or
  Supabase directly.
- **Foods store macros per 100g or 100ml.** Never per serving. Any portion is
  `value * amount / 100`, done in `macrosForAmount`.
- **Log entries snapshot their computed macros.** Editing a food must never
  rewrite historical entries.
- **Dexie migrations are append-only.** New tables or indexes go in a NEW
  `this.version(n).stores({})` block. Never edit an existing version block.
  Non-indexed fields can be added to a type without a version bump.
- **Dexie can only sort or filter on indexed fields.** Check `.stores()` first.
- **Never write to the database inside a `useLiveQuery` callback.** Dexie runs
  those in a read-only transaction and throws `ReadOnlyError`.
- **`undefined` means loading, `null` means genuinely nothing.**
- **Number inputs hold `number | ''` and are never coerced while typing.**
  Clearing a field must leave it empty. Validate on save and name the offending
  field in the message. `Number(raw) || 1` wired to an `onChange` is the bug
  pattern — `Number('')` is `0` and `0 || 1` is `1`, so clearing snaps to 1.
  `src/components/NumberField.tsx` was always correct; the screens that
  hand-rolled `<input type="number">` were not. `grep -rn 'type="number"' src/`
  finds the remaining candidates.
- **There is exactly one decimal parser and it lives in `src/data/numbers.ts`.**
  `parseDecimal()` accepts `,` and `.`, returns `number` for a committable
  value, `''` for empty and **`null` for mid-typing** (`67,`, `-`, `,`). A
  `null` means keep the draft on screen and emit nothing. Never write a second
  one: five copies of this rule is how four screens stayed broken for twelve
  days after the fifth was fixed (§13).
- **A number input must be `type="text"` with `inputMode`, never
  `type="number"`.** The browser sanitises a number input's value *before* your
  `onChange` ever sees it, so a comma is destroyed beyond recovery. `inputMode`
  still gets the right phone keyboard, which was the only thing `type="number"`
  was buying.
- **Fixing a shared component does not fix the screens that copied it by hand.**
  This is the general form of the 2.1.1 failure. After changing a component that
  screens might have inlined, grep for the *markup*, not just the import.
- **A per-exercise value with no per-exercise row is written to every set and
  read from the first.** An exercise inside a workout is only a group of
  `workoutSets`; there is no row to hang shared state on. `restSeconds` has
  always worked this way, `rpe` followed, and **`notes` joined them on
  2026-08-23** (`setNotesForExercise`). Same trick in a routine, where the
  per-exercise RPE is stored on every element of the `sets` array. Before adding
  a per-exercise field, check this pattern first — it needs no new table and it
  has now been used three times.
- **A rep range is a reference, never a second input.** `RoutineSet` carries
  `repsMin`/`repsMax`; `WorkoutSet.reps` stays one number. Hitting the top of a
  range is the signal to add weight, not reps, which is why prefill takes
  **`repsMin`** — the achievable end — via
  `targets[i].repsMin ?? targets[i].reps ?? 0`. Never prefill `repsMax`: handing
  someone the progression trigger at set 1 inverts the whole point.
- **Anything rebuilt from logged sets must restore what a logged set cannot
  carry.** `workoutExercises` in `routines.ts` turns a workout back into routine
  targets, and a logged set has no RPE target and no rep range — so a naive
  write-back silently flattens both. The restoration loop at the foot of
  `diffWorkoutAgainstRoutine` puts them back by position. **Any new
  target-only field on `RoutineSet` must be added to that loop**, or the first
  write-back destroys it with no error and no visible symptom.
- **Fields added inside a jsonb blob cost no migration and no Dexie version
  block.** `RoutineSet` lives in `routine_exercises.sets`, so `repsMin`/`repsMax`
  needed only a `routineSets()` coercion. §18 costed this as "a real shape
  change"; it was UI and logic only. Check whether a field's home is already
  opaque before pricing it as schema work.
- **Dexie hook callbacks must return `undefined`.** Dexie treats a returned
  value from `creating` as the primary key and from `updating` as a
  modifications object. Use block bodies, not expression arrows.

### Sync-readiness rules

- **Every synced row has a UUID primary key, minted on the device** with
  `crypto.randomUUID()`. Never auto-increment. Helpers in `src/data/ids.ts`:
  `newId()`, `now()`, `isLive()`.
- `Goals` and `Profile` are singletons — one row, fixed numeric id `1` locally,
  `user_id` as the primary key server-side.
- **`updatedAt` is stamped on every single write.** Forgetting it on one write
  path means those edits never sync, silently.
- **Never hard-delete a synced row.** Set `deletedAt` and `updatedAt`. A hard
  delete leaves no tombstone, so the next pull resurrects the row.
- **`deletedAt` is deliberately NOT indexed.** IndexedDB omits rows from an
  index when the field is `undefined`, so the index would contain only deleted
  rows. Filtering happens in JS via `isLive`.
- **A boolean can never be a Dexie index.** IndexedDB's valid key types are
  number, string, Date, binary and array — booleans are not among them, so an
  index on one silently holds nothing rather than erroring. `Program.isActive`
  is unindexed for this reason and filtered in JS, the same shape as `deletedAt`
  one line up. **The same reasoning forbids a Postgres partial unique index on
  it**: "one active program per user" enforced server-side would be violated
  transiently by a pull under last-write-wins and would fail the entire sync,
  which is precisely how the `care_done_log` unique index bit this project in
  §11. The client enforces it; the database does not police it.
- Any "find the existing row for this date" query **must** filter deleted rows.
- **Reconcile, don't wipe-and-recreate.** `setSteps` and `setRoutineExercises`
  update by position, add beyond current length, soft-delete the remainder.
  Wipe-and-recreate assigned new ids each save, which broke routine streaks.
- **Never write to Dexie from sync without wrapping in `asSyncWrite`.** See §8.
- **`syncAll` returns errors, it does not throw.** Every caller must check
  `.error`. Ignoring it is how a device got claimed by an account it had failed
  to push a single row into, while the app looked completely normal.

### UI state

- **Do not prop-drill reactive data out of the stage machine.** `App.tsx` holds
  `name` in state, set inside `resolveStage`, which runs on mount and on auth
  changes only. Passing it to `HubScreen` meant renaming from Settings left the
  greeting stale until the next login. Screens read what they display with
  `useLiveQuery` so any write from anywhere lands immediately. `App.tsx` still
  keeps `name` for the goals-stage greeting and `RegisterScreen`'s
  `existingName` — both pre-router screens rendered right after `resolveStage`,
  where staleness cannot bite.
- **One editable home per piece of data.** Name is edited in Settings only;
  Account shows it read-only and says where to change it. Name lives in
  `profile`, works with no account, and is set before any login screen exists —
  so Settings is the right home and Account is not.
- **Never put a minimum length check on a login form.** Login validates against
  what already exists, not against the current policy. `LoginScreen` checks
  `password.length > 0` deliberately. Raising it to match the registration
  minimum would lock out every account created under the old one.

### Styling

- Classes in `src/index.css`, shared components in `src/components/ui.tsx`
  (Button, Fab, Card, ScreenHeader, Empty, InlineRename).
- Inline styles only for one-off layout — never for colours.
- Dark theme only. Background `#0a0a0f`, accent `#7c5cff`.
- Touch targets minimum 44px.
- Key classes: `.stat` / `.stat-sm`, `.num`, `.card`, `.chip`, `.sheet`,
  `.form-actions`, `.hub-tile`, `.hub-nudge`, `.care-step`, `.field`,
  `.field-label`, `.warn`.
- CSS variables: `--accent`, `--radius`, `--radius-sm`, `--warn`, `--success`,
  `--text-muted`, `--surface`, `--border`.

### Other

- **Any new external origin must be added to `connect-src` in `public/_headers`**
  or the request is blocked in production and nowhere else. The CSP does not
  apply on the dev server, so this fails only after deploy, and it surfaces as a
  network error rather than a policy error. See §12.12.
- Always run `npm run build` before pushing. `npm run dev` skips the full type
  check and lets unused imports through.
- Changelog entries are for releases, not commits. `src/data/changelog.ts`
  exports `APP_VERSION` derived from `CHANGELOG[0].version`, so new entries go
  **first** in the array.
- No browser or Playwright in the container. Verify with `npm run build` only.
- Never use `git stash`, `git checkout .`, `git reset`, or anything that
  discards uncommitted work. Single-file `git checkout <path>` is acceptable
  only when the exact diff is known.
- `prompt()` and `alert()` were replaced app-wide with a promise-based
  `DialogProvider` (`useConfirm`, `usePrompt`). Don't reintroduce them.
- **`DialogProvider` wraps every stage, not just the routed app.** It used to
  wrap only the `ready` branch of `App.tsx`, so `AdoptScreen`'s `useConfirm`
  threw and rendered a blank screen. Any first-run screen needing a dialog would
  hit the same wall.

### i18n rules (from 2026-08-22, see §12.13)

- **`t()` is a plain importable function, not a hook.** `dates.ts` formats
  "Today", `rpe.ts` labels "Off" and `sections.tsx` names every section — all
  plain modules where a hook cannot be called. Components stay reactive through
  `useLanguage()`, which is `useSyncExternalStore` over the same module-level
  variable.
- **No module-level `const` may hold a translated string.** A top-level array
  evaluates once at import and freezes whatever language was active then;
  switching later does not touch it. Three were converted to functions —
  `OnboardingScreen`'s `CONTENT` → `contentSlides()`, `RPE_OPTIONS` →
  `rpeOptions()`, `SECTIONS` → `sections()`. **Default parameters are fine**
  (`label = t('common.add')` re-evaluates per call); only module-level consts
  freeze.
- **"Upkeep" is never translated, anywhere, in any string.** It appears verbatim
  inside German values. The wordmark in `OnboardingScreen` and `Layout` stays
  hardcoded JSX with no key at all — a key that does not exist cannot be filled
  in wrong.
- **Route segments are not content.** `Section.id` and `SectionTab.path` stay
  English: `/meals/today` is the same URL in both languages. Only `title`,
  `blurb` and `label` translate.
- **`de.ts` is typed `Record<TKey, string>` against `en.ts`.** A missing or
  misspelled German key is a build error, which is the whole reason the
  catalogues are flat dotted keys rather than nested objects.
- **Never pass `undefined` as a locale.** `toLocaleDateString(undefined, …)`
  means the *browser's* language, not the app's. Use `locale()` from `i18n.ts`.
  `AdoptScreen`'s `formatDate` was doing exactly this and was fixed on
  2026-08-22 (2nd) while it was being translated.
- **`t(key, vars)` interpolates `{name}` placeholders.** So a number that lives
  in code stays in code: `t('auth.minChars', { n: MIN_PASSWORD })`, never a
  German string with `8` baked into it. Baking it in would undo the whole reason
  `MIN_PASSWORD` was moved into `auth.ts` in 2.0.
- **`tParts(key, slot)` splits a string around one placeholder** and returns the
  two halves, so a component can wrap that slot in JSX — a bolded email address
  inside a sentence. **Do not use two half-sentence keys for this.** Two halves
  hard-code English word order into the catalogue and are the classic way to
  make a translation unfixable; a placeholder can sit anywhere in either
  language's sentence.
- **`plural(n, key)` reads a single value with the two forms separated by `|`**:
  `'{n} entry|{n} entries'`. One value, not two keys, so a translator can never
  see one half without the other. Both languages here share the same
  one-versus-many rule. Written on 2026-08-22 (2nd) ahead of the workout screens,
  where §17 warned it would otherwise arrive after the thirtieth ternary.
- **Technical error text stays English, deliberately.** `AdoptScreen` prints
  `err.message` from Supabase or `adopt.ts` verbatim in a `.faint` line; §13
  records that as useful in a tester's screenshot. Only the surrounding copy and
  the app's own fallback are translated. A half-German Postgres error reads worse
  than an obviously-technical one.

---

## 6. Local database — Dexie `UpkeepDB` version 2

The old `HealthTrackerDB` (v1–v5, integer keys) was replaced wholesale rather
than migrated with a v6 block, because Dexie cannot change a primary key
definition in place — going from `++id` to `id` deletes the object store and
takes the data with it.

```
UpkeepDB v1
  goals             id                                          (singleton, numeric)
  profile           id                                          (singleton, numeric)
  foods             id, name, createdAt, updatedAt
  logEntries        id, date, foodId, [date+meal], updatedAt
  measurements      id, date, updatedAt
  exercises         id, name, bodyPart, equipment, updatedAt
  workouts          id, date, routineId, updatedAt
  workoutSets       id, workoutId, exerciseKey, [exerciseKey+createdAt], updatedAt
  routines          id, name, folder, createdAt, updatedAt
  routineExercises  id, routineId, [routineId+order], updatedAt
  careRoutines      id, kind, timeOfDay, updatedAt
  careSteps         id, careRoutineId, [careRoutineId+order], updatedAt
  careDoneLog       id, date, careRoutineId, [date+careRoutineId], updatedAt
  careStepDone      id, date, careRoutineId, stepId, [date+careRoutineId], updatedAt
  syncState         key                                         (local only)

UpkeepDB v2 — added 2026-08-23
  programs          id, name, createdAt, updatedAt
  programDays       id, programId, [programId+week+dayIndex], updatedAt
```

**Version 1 stood from launch until 2026-08-23**, deliberately. The 2026-08-17
additions — `RoutineExercise.sets`, `RoutineExercise.notes`, `Routine.notes` and
`WorkoutSet.rpe` — are all non-indexed, and Dexie stores whole objects, so none
of them needed a version block. **Never add one retrospectively for a
non-indexed field**: an empty version block is a no-op that could only break
existing installs.

**Version 2 exists because two genuinely new object stores do.** Only the new
stores are declared; everything in v1 carries forward untouched, which is the
whole reason v1 must never be edited. Three fields shipped in the same session
without appearing here at all — `Workout.programDayId`, `WorkoutSet.notes` and
everything inside `RoutineSet` — because none of them is indexed and restating
their stores would have added risk for nothing.

**`Program.isActive` is deliberately absent from the index list.** IndexedDB
does not accept booleans as keys, so an index on it would silently contain
nothing. See §5.

**⚠ Dexie does not downgrade.** Once a device has opened the app on a build
carrying `version(2)`, reverting to a build that declares only `version(1)`
makes Dexie throw `VersionError` rather than opening. This is the first schema
version bump since launch, so it is the first time that has been true. Rolling
*forward* is always safe; pushing v2 and then reverting the commit is not.

`syncState` is a single row keyed `'main'`. As of 1.6 it holds:

| Field | Purpose |
|---|---|
| `key` | Always `'main'` |
| `cursors` | `Record<serverTableName, isoTimestamp>` — per-table sync cursors |
| `userId` | Which account last successfully synced on this device |
| `migratedAt` | One-time migration flag |
| `authSkippedAt` | User chose to carry on without an account |
| `onboardingSeenAt` | Intro slideshow finished, skipped, or backfilled |
| `language` | `'en' \| 'de'`. Added 2026-08-22. `undefined` means never chosen, which is what puts the language screen in front of a new user |
| `lastSyncedAt` | **Deprecated.** The old global cursor. Never read. Do not reintroduce. |

**`language` needed no new Dexie version block**, for the same reason as the
2026-08-17 additions: `syncState` indexes only `key`, and a non-indexed field
rides along inside the stored object. The same reasoning applies to anything
added here in future.

**It is deliberately not mirrored into `profile` and does not sync.** §12.13
originally called for the mirror. It was dropped on 2026-08-22 because it buys
one narrow case — changing language on device A and wanting device B to follow —
at the cost of a `types.ts` change, a Postgres column, a `schema.sql` update and
a `sync.ts` edit, plus a new question nothing currently answers: what a pull
should do when it flips the UI language mid-session under last-write-wins. A new
device asks at first run regardless. Revisit when Phase 4 opens the profile
shape anyway.

Access it through `src/data/syncState.ts`, never directly — that module
reads-then-merges, and a blind `put` would wipe `migratedAt` and cause the
one-time migration to re-run.

**`db.exercises` holds only user-created exercises.** The 1,324 bundled ones
live in `src/data/seed/exercises.json`, are loaded via `loadSeed()` with a
module-level cache, and are never written to Dexie. This is why sync can't
accidentally push them.

`WorkoutSet.exerciseKey` and `RoutineExercise.exerciseKey` are strings, not
foreign keys. Bundled exercises use their seed id; custom use `custom:<uuid>`.

### `careDoneLog.stepIds` was split out

Previously one row per routine per day holding `stepIds: number[]`. Now
`careDoneLog` holds `skipped` only, and `careStepDone` holds one row per ticked
step per day. An array of foreign keys inside a row is the worst case for
last-write-wins sync — two devices ticking different steps would lose one.

---

## 7. Temporary files, to be deleted later

These exist solely to move existing users across and should be removed once
every tester has run the migration (realistically a few months):

- `src/data/db-old.ts`, `src/data/types-old.ts`, `src/data/migrate.ts`
- The `importV1` branch of `src/data/backup.ts`
- The `HealthTrackerDB` database itself, deliberately left on disk

`migrateIfNeeded()` runs in `src/main.tsx` **before React renders**, not in an
effect — `StrictMode` double-invokes effects and would fire it twice. It builds
old-id → new-UUID maps for every table before transforming any row, then writes
everything in a single transaction along with the `migratedAt` flag.

Backup format v2 (`exportAll`) covers all 14 tables. v1 only covered goals,
foods, logEntries and measurements.

---

## 8. Server, auth and sync

### Schema

`supabase/schema.sql` in the repo describes the **current** shape of the
database, and was rewritten on 2026-08-10 to match the composite key migration.
It is wrapped in `begin; … commit;` so it is all-or-nothing. **It begins with
`drop table` statements — never run it against the live project.** Write
incremental migrations in `supabase/migrations/` instead. Two exist:

- `2026-08-10-composite-pk.sql` — see §11.
- `2026-08-17-routine-set-targets.sql` — adds `routines.notes`,
  `routine_exercises.notes`, `routine_exercises.sets` (jsonb) and
  `workout_sets.rpe`. Additive only: every column is nullable or defaulted, so
  an older client running against this schema keeps working and simply ignores
  them. Applied to the live project on 2026-08-17 and verified by round-tripping
  real data.
- `2026-08-23-programs.sql` — creates `programs` and `program_days`, and adds
  `workouts.program_day_id` and `workout_sets.notes`. Also additive: both new
  columns are nullable, so a client running 2.1.1 against this schema keeps
  working. Applied to the live project on 2026-08-23 and verified by the
  constraint query below plus a `pg_policies` check, then by a full push-and-pull
  round trip from a real device. **The file is worth reading before the next
  Programs session** — it argues every schema decision in place, which is where
  those arguments belong rather than only here.

`schema.sql` is documentation plus a way to build a fresh project; it is not a
history. When a migration changes the shape, update it in the same session or
it starts lying.

**Primary keys are `(user_id, id)` on the fourteen non-singleton tables**, not
`id` alone. See §11 for why. The seven child foreign keys are composite for the
same reason, and are **named explicitly** in `schema.sql` — left implicit,
Postgres would name a composite key `<table>_<col1>_<col2>_fkey`, which would not
match the live names inherited from the migration.

Sixteen tables, each with RLS enabled and one `"own rows"` policy:

```
goals            profile          foods            log_entries
measurements     custom_exercises workouts         workout_sets
routines         routine_exercises programs        program_days
care_routines    care_steps       care_done_log    care_step_done
```

**Counts in this document that used to say "fourteen tables" now mean sixteen**,
and "twelve composite keys" means fourteen. §11 describes the twelve as they
were migrated on 2026-08-10 and is correct as history; the two 2026-08-23 tables
were created with composite keys from the start rather than migrated onto them.

**Naming changes from the local types** (handled in `sync.ts`, nowhere else):

| Local | Server | Why |
|---|---|---|
| `camelCase` | `snake_case` | SQL convention |
| `date` | `logged_on` / `measured_on` / `performed_on` / `done_on` | `date` is a Postgres type name |
| `order` | `sort_order` | `order` is a reserved word |
| `sortOrder` | `sort_order` | consistency |
| `undefined` | `null` | Postgres has no undefined; omitting a key on update means "leave alone" |

**Deliberate design decisions:**

- `log_entries.food_id` and `workouts.routine_id` have **no** foreign key. A log
  entry snapshots its macros and must survive its food being deleted.
- `workout_sets.workout_id`, `routine_exercises.routine_id`,
  `care_steps.care_routine_id`, `care_done_log.care_routine_id`,
  `care_step_done.care_routine_id`, `care_step_done.step_id` **do** have foreign
  keys with cascade. A set without its workout is meaningless.
- `custom_exercises` has **no `custom` column** — every row is custom by
  definition. `custom: true` is added back on pull.
- `goals` and `profile` use `user_id` as the primary key, no separate `id`,
  no `deleted_at`. Unaffected by the composite key change — they were already
  keyed on the user.
- **The two unique indexes on `care_done_log` and `care_step_done` lead with
  `user_id`**: `(user_id, care_routine_id, done_on)` and
  `(user_id, step_id, done_on)`. They were table-wide until 2026-08-10, which
  was the same bug as the primary keys one table further down. See §11.
- `updated_at` has **no `default now()`**, deliberately. The pull cursor
  compares against a device clock; a server-stamped clock drifting from it
  would silently drop rows from future pulls.
- Every table has an index on `(user_id, updated_at)` — the sync index.
- **`routine_exercises.sets` is `jsonb`, not a `routine_sets` table.** Chosen
  on 2026-08-17. Routine sets are only ever read as a group with their parent
  exercise and are never queried individually, so a table would have bought
  nothing and cost a composite primary key, an RLS policy, a foreign key, a sync
  cursor and a Dexie version block — five places this project has already been
  bitten. Guarded by `check (jsonb_typeof(sets) = 'array')`; the element shape
  is not checked in Postgres and is coerced field by field in `sync.ts`
  (`routineSets()`), because jsonb from the server is untyped.
- **Keys inside that jsonb are camelCase**, unlike every column. The
  camel/snake rule applies to columns; inside an opaque blob there is no SQL
  convention to satisfy and converting would double the mapping code.
- `workout_sets.rpe` is `numeric`, not `integer` — half-point RPE is normal
  usage — and is range-checked 1–10. It stays nullable: RPE is optional and an
  empty value must never block a set from being completed.
- **`routine_exercises.target_sets` is derived, not entered.** It means working
  sets, so warm-up entries in `sets` do not count towards it. It is recomputed
  on every save from the non-warmup set count. Before 2026-08-17 it was stored
  and never read by anything except the routine form.
- **`program_days.week` is an integer column, not a `program_weeks` table.**
  Decided 2026-08-23. A week-less repeating program is every day at `week = 1`
  with `programs.repeats = true`; a periodised one uses `week = 1..12`. The
  argument is the same list that produced jsonb on 2026-08-17: a table costs a
  composite primary key, an RLS policy, a composite foreign key, a `TABLES`
  position, a sync cursor and a Dexie version block. A column costs none.
- **`programs.week_notes` is jsonb keyed by week number as a string** —
  `{"1": "Intro week", "5": "Deload"}`. A week's one property, without giving a
  week a row. JSON object keys are always strings, which is why the TypeScript
  type is `Record<string, string>` even though the keys look numeric in a
  console. Coerced by `weekNotes()` in `sync.ts`, the same way `routineSets()`
  handles the other blob.
- **`programs.started_on` is a `date`, and that matters.** It anchors day 1, and
  a `date` column takes no part in timezone conversion — the `created_at`
  beside it arrives as `+00:00` while `started_on` comes back exactly as sent.
  Verified from Lisbon at UTC+1 on 2026-08-23, which is the setup where an
  off-by-one would have hidden.
- **`program_days.day_index` is 1–7 and is NOT a weekday.** Day 1 is whatever
  calendar day the program was made active. That keeps a program portable
  between two people who start it on different days, and it is why the column is
  `day_index` rather than being folded into the `order` → `sort_order` rename:
  it is a semantic position inside a week, not generic ordering.
- **`program_days.routine_id` has no foreign key**, matching
  `workouts.routine_id`. Null means a rest day. With a cascade FK, tidying up
  your routine list would silently punch holes in a schedule; without one, a day
  whose routine is gone renders as needing one.
- **`workouts.program_day_id` has no foreign key either**, same reasoning one
  level up, and it is stamped **only** when a workout is started from the
  schedule. An empty workout that happens to resemble Pull day does not claim to
  be it. Completion is "at least one workout referencing that day", so repeating
  a day is legal and both appear in history.
- **There is deliberately no unique index on
  `(user_id, program_id, week, day_index)`.** Two reasons, both learned here:
  soft-deleted rows would keep occupying their slot and block recreation, and
  reordering two days swaps their `day_index` values, which a unique index would
  refuse mid-batch.

**RLS pattern**, identical on all sixteen:

```sql
create policy "own rows" on <table>
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

`using` filters reads and modifications; `with check` validates writes. Without
the second clause a user could insert rows tagged with someone else's `user_id`.

The project has an **event trigger that auto-enables RLS on new tables** in the
`public` schema. It enables RLS only — it creates no policy, so a new table is
locked to everyone until a policy is written. Safe failure mode.

**Locked to everyone includes you, and it looks identical to working.** A table
with RLS on and no policy accepts the migration, appears in the dashboard, and
returns zero rows to its own owner. The 2026-08-23 migration enables RLS
explicitly anyway rather than relying on the trigger to do half the job, and the
verification step is a separate query:

```sql
select tablename, policyname from pg_policies
where schemaname = 'public' and tablename in ('programs', 'program_days');
```

Two rows, both `own rows`. Zero rows means the tables exist and nothing can read
them. **Run this after creating any table**, not just these two.

### Auth

Email + password. **Email confirmation is ON since 2.0** (Authentication →
Sign In / Providers → Email). It was off until 2026-08-11 because Supabase's
built-in mailer is capped at 2 messages per hour project-wide and refuses
addresses not on the project team. Custom SMTP (§12.4) removed both limits.

Signup therefore **no longer returns a live session**. `signUp` creates the
user; `confirmSignUp` verifies the 8-digit code and creates the session.

Login identity is the **email address**. Username login is not supported without
a lookup table that leaks which usernames exist. The user's name is a display
field stored in `profile.name`, collected at registration.

`src/data/auth.ts` returns result objects rather than throwing, so screens can
distinguish `email-taken` from `invalid-credentials` from `offline`. Its full
surface: `signUp`, `confirmSignUp`, `resendSignUpCode`, `signIn`, `signOut`,
`changePassword`, `requestPasswordReset`, `resetPasswordWithCode`,
`getCurrentUser`, `isSignedIn`, `onAuthChange`, plus the `MIN_PASSWORD` and
`RESET_CODE_LENGTH` constants.

**`classify()` order is load-bearing.** Rate-limit and token checks run *before*
the loose `password` / `email` substring matches. Supabase's rate-limit message
is "email rate limit exceeded", which contains "email" and would otherwise be
reported as a malformed address; the expired-token message contains neither word
and would fall through to `unknown`. Adding a new branch means putting it in the
right place, not appending it.

**The user-without-session guard was deleted in 2.0** and must not come back —
see §12.4. With confirmation on it fires on every legitimate signup.

**`signOut` deliberately leaves local Dexie alone.** Wiping a phone on logout
would be catastrophic for a local-first app. See §14 for the illusion this
creates.

**supabase-js holds an internal lock while running `onAuthStateChange`
subscribers.** Calling back into `supabase.auth` from inside one can deadlock.
Both `App.tsx` and `autoSync.ts` defer their work with `setTimeout(0)`.

### Sync — `src/data/sync.ts`

`syncAll()` pushes then pulls all sixteen tables. It knows nothing about *when*
it runs — that is `autoSync.ts`.

**`programs` and `program_days` sit between `routineExercises` and `workouts`**
in the `TABLES` array, added 2026-08-23. `programs` must precede `program_days`
because of the composite foreign key. Neither needs to precede `workouts` today,
since `program_day_id` carries no FK — they are placed there anyway so the
parents-before-children reading of the array stays true if one is ever added.

- **Per-table cursors**, stored in `syncState.cursors`, keyed by **server** table
  name. A missing key means "this table has never synced".
- Push sends rows where `updatedAt > cursor`; pull fetches rows where
  `updated_at > cursor`. Both call sites guard on truthiness, so an empty-string
  cursor behaves identically to `undefined`.
- The cursor is captured **before** the work, not after. Anything written during
  a sync must still look newer than the cursor.
- **A table's cursor advances only after that table's *pull* completes**, and all
  pushes run before any pull. So a cursor can never move past rows that failed
  to reach the server. This is the invariant that fixes the old FK failures.
- Cursors are accumulated in memory and written once in a `finally`, so a
  failure halfway through keeps the progress of tables that finished.
- Push order is load-bearing: parents before children, because of the foreign
  keys. Reordering the `TABLES` array will break it.
- Pushes are batched at 500 rows.
- Soft-deleted rows are pushed too — the tombstone is how other devices learn.
- `upsert` makes re-running safe after an interrupted sync.

**Why per-table and not one global cursor:** one timestamp can't express "foods
are current, care routines have never synced". On a partially-synced account the
parents were filtered out as already-sent while the children weren't, and the
children were rejected for violating their foreign keys. This was a real
failure, not theoretical.

**Verified 2026-08-09.** Clearing only `care_steps`' cursor pushed and pulled 6
rows for that table and 0 for all thirteen others — a child resyncing with its
parent's cursor untouched, no FK error. Also verified by a real partial failure:
a pull that died at `care_routines` after 80 rows recovered by pulling only the
remaining 42, not all 122.

### Automatic sync — `src/data/autoSync.ts`

| Trigger | Behaviour |
|---|---|
| `startup` | Once, after the Dexie migration settles, from `main.tsx` |
| `write` | Dexie hooks, 5-second debounce, restarts on each write |
| `visible` | `visibilitychange` to visible, 30-second floor |
| `online` | `window.online`, no floor — reconnecting is a real event |
| `auth` | Login, deferred with `setTimeout(0)` |

**`visibilitychange` matters more than `startup`.** On a phone the PWA is almost
never cold-started; it's woken from the app switcher days later.

**Concurrency:** a module-level `inFlight` promise means a second trigger joins
the running sync rather than starting its own. Two concurrent `syncAll()` calls
would both capture `startedAt`, both push, and race on the cursor write.

**Failure:** no retry, no backoff, deliberately. A failure is usually Supabase
paused after 7 days idle, or no connection — both resolve themselves, and the
next natural trigger picks up the same range because the cursors didn't advance.

**`startAutoSync()` is idempotent and never torn down.** StrictMode
double-invokes effects in dev and the app never unmounts in production, so a
`started` guard is simpler and safer than unsubscribing.

### The re-entrancy guard — `src/data/syncWrites.ts`

Sync's pull writes to Dexie via `bulkPut`, which fires the same hooks as a user
edit. Without a guard, every pull schedules another sync, which pulls, which
schedules another — forever, burning the Supabase free tier while the tab is open.

`isSyncWriting()` is a **depth counter**, not a boolean: writes nest, and a
boolean would be cleared by the inner one while the outer was still running.
`asSyncWrite()` wraps every write sync makes (`pullTable`, `pullGoals`,
`pullProfile`, and `adopt.ts`'s `clearLocalTables`).

Separate module from `sync.ts` because `autoSync` imports `sync`, and `sync`
importing `autoSync` back would be circular.

**The first attempt was wrong and the failure is instructive.** It *remembered*
writes that occurred during sync and replayed them afterwards. Every sync that
pulled a row scheduled another five seconds later, indefinitely. The evidence
was in the timestamps: 11:59:24, 11:59:31, 12:00:35, 12:00:42, 12:00:50,
12:00:56.

### Device ownership and adoption

`syncState.userId` records which account this device last **successfully** synced
with.

**Only adoption claims a device.** `autoSync` refuses to run when
`owner !== user.id`, which includes `owner === undefined`. An unclaimed device is
refused as firmly as one belonging to someone else — at login the `auth` trigger
fires while the adoption screen is still rendering, and letting it through would
merge two people's data before the user chose anything.

Seeing `[autoSync] This device has not been claimed…` once immediately after
login is **correct behaviour**, not a bug.

Four situations when a signed-in user's device is unclaimed:

| Device has | Account has | What happens |
|---|---|---|
| nothing | nothing | Silent `keep-account`. New user, new account. |
| nothing | data | Silent `keep-account`. Pull it down. |
| data | nothing | Silent `merge`. It's just a push; nothing can be lost. |
| data | data | **Ask.** The decision screen. |

Only the fourth shows UI. Asking a brand-new user to arbitrate between two empty
datasets is noise.

**`previewAdoption()`** reads both sides without changing anything: live row
counts per table plus which singleton would win. Server counts use
`count: 'exact', head: true` so no rows transfer. RLS scopes them, so no
`user_id` filter is needed.

**The three modes:**

- **`merge`** (default) — pulls the singletons *first*, then clears cursors and
  syncs. Both sides end with the union. Duplicates possible and permanent; the
  screen says so.
- **`keep-local`** — tombstones every live server row, *then* pushes. Order
  matters: tombstoning after the push would kill the rows just sent.
- **`keep-account`** — clears all sixteen local tables, then pulls. **The only
  path in the app that destroys local data.** Confirm dialog on top of the choice.

**Why merge pulls singletons first:** `syncAll` pushes before it pulls, and
`pushGoals` upserts unconditionally when the cursor is empty. Without the early
pull, the account's goals would be overwritten by this device's regardless of
which was newer, and the comparison inside `pullGoals` would never run.

**`exportAll()` runs and downloads before any destructive mode.** Skipped via
`{ backup: false }` only where there is provably nothing to lose. The default is
to back up — the check is `options.backup !== false`, not `options.backup`.

**`adoptAccount` throws if `syncAll` reports an error**, and claims the device
only *after* a clean sync.

**After `keep-local`**, the pull brings tombstones down into Dexie as
soft-deleted rows with unfamiliar UUIDs. Invisible everywhere because every query
filters on `isLive`. Not a bug — that's how another device learns those rows are
gone.

---

## 9. Current state — what's built

### Sections

Hub screen with four tiles, each opening a section with its own tab bar. Header
shows back chevron, section name, **account icon**, and settings gear. When
signed out, a muted `.hub-nudge` line sits at the foot of the hub linking to
`/account`.

**Meals** — Today, Foods, Goals, Charts. Daily log across
breakfast/lunch/dinner/snack, food list with barcode scan / database search /
manual entry, log by weight or piece, macro goals, charts.

**Body** — weight with 7-entry rolling average, 7 and 30 day change, optional
height and BMI.

**Workouts** — Log, Routines, Progress. 1,324-exercise library plus custom, set
logging with types and rest timer, routines with folders, per-exercise
About/History/Progress/Records with Epley 1RM, calendar with streaks, radar
balance chart, volume trend, PRs.

**Routines** — Today, Manage. Care routines with named steps, product notes,
morning/evening/anytime grouping, streaks with non-breaking skip days.

**Account** — `/account` route, reachable from the person icon. Signed out:
warning card plus register/login. Signed in: name and email read-only, change
password, log out.

**Global** — settings gear: name, data export/restore, install guide, About with
changelog, in-app feedback filing a GitHub issue.

### Onboarding — `src/features/onboarding/OnboardingScreen.tsx`

Six content slides plus a conditional seventh for installing. Runs **before the
gate**, so a stranger sees what the app does before being asked for an email.

- **Who sees it:** anyone reaching the stage machine with no local profile and
  no account. Not tied to registering — someone who taps *skip* is exactly the
  person who needs it.
- **Who does not:** anyone with a profile already. `resolveStage` stamps
  `onboardingSeenAt` silently for them, so existing testers never saw it appear
  after the 1.7 update. Also skipped when a session is already restored.
- **The log-in shortcut is load-bearing.** Running before the gate means the app
  cannot yet tell a new user from a returning one installing on a second phone,
  so every slide carries "Already have an account? Log in", which jumps straight
  to `login` and stamps the flag.
- **The install slide is decided once, at mount** (`useState(() => !isInstalled())`).
  Reactive would let slides appear or vanish mid-tour and leave `index` pointing
  past the end.
- **Animation is CSS transforms only**, no new dependency — Framer Motion is
  ~35 KB gzipped against an already-large bundle. Slides carry a fractional
  position (`index - drag / width`) so neighbours dim and scale smoothly during
  a drag instead of snapping on release. Transitions are disabled while
  dragging. The global `prefers-reduced-motion` block already neutralises it.
- **Swipe was silently dead on touch devices until 2026-08-10.** The pointer
  handlers were correct all along; the browser was claiming the gesture before
  they ran. `.onb-viewport` had `touch-action: pan-y`, but `.onb-slide` has
  `overflow-y: auto`, making each slide its own scroll container — and
  `touch-action` does not inherit. Adding `touch-action: pan-y` to `.onb-slide`
  fixed it. See §14 for why the symptom was so misleading.
- Reuses `.wordmark`, not a second copy of the brand styling.
- **Known, unfixed:** `dragging` is derived from `startX.current`, a ref, so the
  first frame of a drag still carries the 0.42s transition and the slide lags
  the finger slightly before catching up. Make it state to fix.

### Install — `src/data/install.ts`, `src/features/about/InstallScreen.tsx`

- **Android gets a real one-tap button.** `beforeinstallprompt` is captured at
  startup and held; tapping fires the browser's own install sheet.
- **iOS cannot, ever.** Safari has never implemented `beforeinstallprompt` and
  every iOS browser is WebKit underneath. Instructions are the only option.
- The event fires **before React mounts** and is unrecoverable once the browser
  consumes it, hence a module-level listener started from `main.tsx`.
- **Called explicitly, not via a bare side-effect import** — see §14 for the
  import that survived only because Vite stripped it.
- The event is **single use**; Chrome rejects a second `prompt()` on the same
  object, so it is cleared before use and the button hides itself.
- Platform is detected but not enforced — chips switch between iPhone, Android
  and Computer so the iOS steps can be screenshotted from an Android phone.
  iPadOS 13+ reports as a Mac, so `maxTouchPoints` is the tell.
- Reachable from Settings and from About.

### App icon

Three concentric 270° arcs, violet gradient on near-black, soft glow behind.
Outer edge sits at radius 177 of 512, inside the 205px maskable safe zone, so
the same artwork works masked or unmasked.

- `icon-192-v3.png` / `icon-512-v3.png` — rounded, `purpose: 'any'`
- `icon-maskable-192-v3.png` / `icon-maskable-512-v3.png` — full-bleed square,
  no corners, because Android crops to the launcher's own shape and a
  pre-rounded icon gets its corners shaved twice
- `apple-touch-icon-v3.png` — 180px, square, opaque. **iOS ignores the manifest
  entirely** and reads only the `<link rel="apple-touch-icon">` tag
- `favicon.svg` — no glow, heavier strokes; a soft gradient turns to mud at 16px
- Rendered at 512 and downsampled with Lanczos, never rasterised small
- The `-v3` suffix is deliberate. Service workers and Android WebAPKs cache
  icons hard; a new filename is the only reliable way to force a refresh
- **An installed WebAPK keeps its old icon forever.** Testing a new icon means
  uninstalling and reinstalling, not just redeploying

The mark is also `<Mark />` in `ui.tsx`, used on the first onboarding slide and
nowhere else. Not in the header — the wordmark is already there, and two brand
elements in a 44px bar reads as trying too hard.

### First-run flow

`App.tsx` is a stage machine that runs **before** the router mounts:

```
checking → language → onboarding → gate → register / login → adopt → syncing → name → goals → ready
```

`resolveStage()` reads profile, goals, current user, the skip flag, the device
owner and the stored language, and picks a stage. Called on mount, after
register/login/skip, and from an `onAuthChange` subscription (deferred with
`setTimeout(0)`).

Order matters:

0. **No language chosen** → `language`, added 2026-08-22 and ahead of everything
   else, because the intro is content and cannot render before the language is
   known. An existing tester — anyone with a profile already — is stamped `'en'`
   silently rather than being switched under them by detection; the switch is in
   Settings. `LanguageScreen` is itself untranslated and shows both languages at
   once, which sidesteps the chicken-and-egg problem of a language picker
   needing a language. Detection is `navigator.language`, **not IP** — IP says
   where someone is, the browser says what they read, and an English-speaking
   resident of Germany is exactly the case IP gets wrong.
1. **Not signed in and haven't skipped** → `gate`. First, because a returning
   tester with a full profile still needs offering an account, but only once.
2. **Signed in but device unclaimed** → `adopt`.
3. **Signed in, claimed, but no local profile** → `syncing`, then re-check.
   Adoption's pull didn't finish; retry bounded rather than asking for a name
   the account already has.
4. No profile → `name`. No goals → `goals`. Otherwise `ready`.

**`App` remounts `AppStages` on a language change**, via `key={language}`.
Blunt, but `t()` is read during render across the whole app and this guarantees
nothing keeps a stale string. It happens once, on a deliberate user action.
`applyLanguage` returns early when the value is unchanged, so a cold start does
not remount for nothing.

**One accepted flaw:** the `checking` stage renders before Dexie has been read,
so `t('app.loading')` shows English for a sub-second flash even for German
users. Unavoidable while the language lives in IndexedDB, which is async. A
`localStorage` mirror would fix it and was rejected as a second source of truth
for the same fact — but it is a real option if the flash ever annoys anyone.

**`syncBeforeFirstRun()` has an 8-second ceiling.** A Supabase project paused
after 7 days idle takes ~30 seconds to wake, and blocking that long on a loading
screen reads as a crash. On timeout it falls through and asks for the name as
before — nothing is lost, because `pullProfile`'s last-write-wins means the name
just typed is newer and survives.

### Infrastructure

Two Cloudflare Workers on the free tier:

1. **`upkeep-search.aswin010pk.workers.dev`** — proxies Open Food Facts
   Search-a-licious (no CORS headers on that endpoint). Detects country from
   `request.cf.country`, filters to products sold there, falls back worldwide.
   **Do not "fix" this. See §13.**
2. **`upkeep-feedback.aswin010pk.workers.dev`** — creates GitHub issues from
   in-app feedback via a fine-grained PAT (`GITHUB_TOKEN` secret).

Barcode lookup hits `world.openfoodfacts.org` directly — that endpoint does send
CORS headers.

### Deployment

**Cloudflare Pages**, project `upkeep`, since the cutover on 2026-08-10. It
builds `main` on every push and publishes to `upkeepdaily.com`. GitHub Actions
no longer deploys anything.

Settings, all in the Pages dashboard:

- Build command `npm run build`, output directory `dist`, root directory empty
- Production branch **`main`**, automatic deployments enabled
- Preview branch: *all non-production branches*
- Build system version 3; build cache disabled
- Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `NODE_VERSION=24`

`VITE_SUPABASE_*` are plain variables, not secrets: the publishable key ships in
the bundle anyway, so masking it in logs buys nothing. **`src/data/supabase.ts`
throws at module load if either is missing**, so a build without them deploys a
blank screen.

**Cloudflare installs with `npm clean-install`** — confirmed in the build log,
not inferred. That is stricter than `npm install`: `package.json` and
`package-lock.json` must agree. This is why `package.json` still says
`"name": "health-tracker"` and was deliberately left alone during the cutover —
renaming it means regenerating the lockfile in the same commit, and it was not
worth risking the one build that mattered. Rename it separately, with a local
`npm install` and `npm run build` to prove it.

**Every branch gets a public preview URL** under `*.upkeep-4wa.pages.dev`.
Harmless, but they are real and public — including, currently, a preview of the
farewell build whose service worker self-destructs. Don't hand those URLs out.

**Changing the production branch does not promote anything.** The setting only
affects future builds; the live deployment stays until a build is retried or
created. This cost a confused minute on 2026-08-10 — the dashboard showed
`main` as production branch while `upkeepdaily.com` still served a
nine-hour-old `cloudflare-pages` build.

GitHub Pages is still switched **on** but frozen and serving a farewell page.
See §12.3 for the one dated task remaining.

---

## 10. Console helpers (dev only)

All stripped from production builds by `import.meta.env.DEV`. Verify with
`npm run build && grep -r upkeepSyncTest dist/` — must return nothing.

```js
// Sync
upkeepSyncTest.syncAll()
upkeepSyncTest.peek('foods')          // raw server rows
upkeepSyncTest.cursors()              // all sixteen cursors
upkeepSyncTest.resetCursor('foods')   // force one table to resync
upkeepSyncTest.resetCursors()         // force everything

// Scheduler
upkeepAutoSync.log()                  // console.table of every sync this page load
upkeepAutoSync.count() / .reset() / .state()
upkeepAutoSync.syncNow('manual')
upkeepAutoSync.claimDevice()          // release the device, clears cursors

// Adoption
upkeepAdopt.preview()
upkeepAdopt.adopt('merge' | 'keep-local' | 'keep-account')

// Auth
upkeepAuth.signUp / signIn / signOut / getCurrentUser / isSignedIn

// Sync state
upkeepSync.getSyncState / setSkippedAuth / clearSkippedAuth / clearOnboardingSeen

// Install
upkeepInstall.canPrompt()   // false on dev — the SW is not registered there
upkeepInstall.supported()   // 'onbeforeinstallprompt' in window
upkeepInstall.isInstalled() / .platform()
```

`upkeepSync.clearOnboardingSeen()` alone will **not** show the tour again on a
device that has a profile — `resolveStage` re-stamps the flag. Use a fresh
browser profile for the real first-run path.

`upkeepAutoSync.log()` is the single most useful debugging tool built this
session — it distinguishes "our code looped" from "supabase-js retried
internally", which is otherwise invisible.

**⚠ CORRECTED 2026-08-23: `/src/data/db.ts` resolves fine.** This section used to
say the dev server serves under a base path and that you needed
`/health-tracker/src/data/db.ts`. That was true on GitHub Pages; `base` was
removed from `vite.config.ts` during the 2026-08-10 cutover and nobody updated
this paragraph. **The plain path is correct**, and importing modules in the
console is the single most useful debugging tool this project has:

```js
const { db } = await import('/src/data/db.ts')
const r  = await import('/src/data/routines.ts')
const wk = await import('/src/data/workouts.ts')
```

`db` is not exposed as a global — only the `upkeep*` helpers are — so this is
how you reach it. The `const` is lost on reload and has to be pasted again.

**Calling a data function directly is the closest thing this project has to a
unit test**, and it found the answer on 2026-08-23 when four rounds of reasoning
had not. Start something, read the result, soft-delete it:

```js
const t = await r.startWorkoutFromRoutine(routineId)
const probe = (await db.workoutSets.where('workoutId').equals(t).toArray())
  .map(s => ({ ex: s.exerciseName, notes: s.notes, reps: s.reps }))
await wk.deleteWorkout(t)     // soft delete — §5 forbids the hard kind
probe
```

**⚠ But a console `await import()` does NOT tell you what the running app is
executing.** Vite serves a fresh copy on request; the app has its own module
instance loaded at mount. The two can differ, and on 2026-08-23 they did. See
§14 — this asymmetry is diagnostic, not a nuisance.

**Reading local Dexie without modules at all**, if imports are misbehaving:

```js
await new Promise((res, rej) => {
  const r = indexedDB.open('UpkeepDB')
  r.onsuccess = () => {
    const req = r.result.transaction('foods').objectStore('foods').getAll()
    req.onsuccess = () => res(req.result.slice(0, 3).map(f => ({ id: f.id, name: f.name })))
    req.onerror = () => rej(req.error)
  }
})
```

### Useful SQL

**Row counts per account:**

```sql
select
  u.email,
  (select count(*) from public.profile        where user_id = u.id) as profile,
  (select count(*) from public.goals          where user_id = u.id) as goals,
  (select count(*) from public.foods          where user_id = u.id and deleted_at is null) as foods,
  (select count(*) from public.log_entries    where user_id = u.id and deleted_at is null) as log_entries,
  (select count(*) from public.measurements   where user_id = u.id and deleted_at is null) as measurements,
  (select count(*) from public.workouts       where user_id = u.id and deleted_at is null) as workouts,
  (select count(*) from public.workout_sets   where user_id = u.id and deleted_at is null) as workout_sets,
  (select count(*) from public.routines       where user_id = u.id and deleted_at is null) as routines,
  (select count(*) from public.care_routines  where user_id = u.id and deleted_at is null) as care_routines,
  (select count(*) from public.care_steps     where user_id = u.id and deleted_at is null) as care_steps
from auth.users u
order by u.created_at;
```

**Constraints (PKs and FKs):**

```sql
select tc.table_name, tc.constraint_name, tc.constraint_type,
       string_agg(kcu.column_name, ', ' order by kcu.ordinal_position) as columns
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on kcu.constraint_name = tc.constraint_name
where tc.table_schema = 'public'
  and tc.constraint_type in ('PRIMARY KEY', 'FOREIGN KEY')
group by tc.table_name, tc.constraint_name, tc.constraint_type
order by tc.table_name, tc.constraint_type;
```

**Full foreign key definitions, including `on delete`** — read the database
rather than `schema.sql`, which can drift:

```sql
select c.conrelid::regclass as child_table, c.conname,
       pg_get_constraintdef(c.oid) as definition
from pg_constraint c
where c.contype = 'f' and c.connamespace = 'public'::regnamespace
order by child_table, c.conname;
```

**Do the policies exist?** RLS enabled with no policy is indistinguishable from
a working table until you try to read it. Run this after creating any table:

```sql
select tablename, policyname from pg_policies
where schemaname = 'public'
order by tablename;
```

Sixteen rows, every one named `own rows`. A table missing from this list is
locked to its own owner.

**Every index** — the constraints query above does not show them, and a unique
index can carry the same scoping bug as a primary key:

```sql
select tablename, indexname, indexdef
from pg_indexes where schemaname = 'public'
order by tablename, indexname;
```

**Is a UUID shared across accounts?** The check that proves the composite key
migration worked. Rows here are expected now, impossible before 2026-08-10:

```sql
select id, count(distinct user_id) as accounts
from public.foods group by id having count(distinct user_id) > 1 limit 5;
```

⚠ Queries that don't filter `deleted_at` count tombstones; `previewAdoption()`
filters them. Both are right, measuring different things. This caused a false
alarm once, and produced a wrong prediction again on 2026-08-10.

---

## 11. FIXED 2026-08-10 — the composite primary key bug

Kept because the reasoning still explains why the schema looks the way it does,
and because the *second* half of the bug was not in any document before it was
found.

### The problem

Server primary keys were `id` alone. Local rows carry the same UUIDs that were
pushed to whichever account they first synced with. When a **second** account
upserted those rows, Postgres matched on `id`, found an existing row, and turned
the insert into an **UPDATE of a row owned by someone else**. RLS refused:

```
403: new row violates row-level security policy (USING expression) for table "foods"
```

`USING` governs updates; `WITH CHECK` governs inserts. The `USING` wording is the
tell that this became an update.

### The half that §11 did not know about

Two unique indexes had exactly the same flaw one table further down:

```
care_done_log_care_routine_id_done_on_idx   unique (care_routine_id, done_on)
care_step_done_step_id_done_on_idx          unique (step_id, done_on)
```

Once two accounts can each hold the same `care_routine_id`, they can each hold a
row for that routine on the same date — and a table-wide unique index refuses the
second. Fixing the primary keys alone would have swapped a `403` for a `23505`
and the second-account push would still have failed.

**Confirmed before the fix**, by inserting a second user's row for the same
routine and date inside a transaction ending in `rollback`:

```
23505: duplicate key value violates unique constraint
       "care_done_log_care_routine_id_done_on_idx"
```

Worth noting: index enforcement sits *below* RLS, so that error reported the
existence of a row the querying user's own policy would not let them see.

### What was done

`supabase/migrations/2026-08-10-composite-pk.sql`, one transaction:

1. Drop the six child foreign keys (explicitly, not via `cascade` — so the file
   states everything it destroys).
2. Drop the two table-wide unique indexes.
3. Twelve `drop constraint <t>_pkey` / `add primary key (user_id, id)` pairs.
4. Recreate both unique indexes leading with `user_id`.
5. Recreate the six foreign keys as composite, e.g.
   `foreign key (user_id, workout_id) references workouts (user_id, id)
   on delete cascade`. Cascade preserved exactly as read from the live database.

Order is forced: foreign keys depend on the primary keys they reference.

Plus one client change, `sync.ts` `pushTable`:
`upsert(batch, { onConflict: 'user_id,id' })`.

**Be honest about that line: the migration alone fixed the bug.** The merge test
passed on unmodified `sync.ts`, because PostgREST infers the primary key. The
option is there because the inference is silent and a future key change would
otherwise break pushes with nothing pointing at why.

### How it was verified

Not by the migration appearing to succeed:

- The constraints query (§10) re-run: twelve `PRIMARY KEY (user_id, id)`, six
  composite child FKs, `goals`/`profile` untouched.
- The index query re-run: both unique indexes leading with `user_id`.
- **The proof:** `select id, count(distinct user_id) from public.foods group by id
  having count(distinct user_id) > 1` returned rows. One food UUID existing under
  two accounts at once — structurally impossible an hour earlier.
- A device already synced with one account pushed 127 rows into a second and
  pulled 125 back, no error on any of the fourteen tables.

### The adoption decision screen — tested 2026-08-10

All three modes, with data built to detect failure rather than data that happened
to agree. `AdoptScreen` had never rendered with real data on both sides before
this; it renders correctly.

- **Keep both (merge)** — planted `LOCAL-ONLY-A` on the device only and
  `ACCOUNT-ONLY-B` on the account only. Afterwards both live, locally and
  server-side. Union confirmed in both directions.
- **Keep only this device's** — planted `ACCOUNT-ONLY-C` server-side with a
  **2020 `updated_at`**, so no cursor could ever pull it. It was tombstoned
  anyway, proving `softDeleteAccountRows` sweeps by `user_id` and live-ness
  rather than by cursor. No confirm dialog on this path; a backup does download.
- **Keep only the account's** — confirm dialog appeared, backup downloaded, then
  local was replaced. Verified by a row the account had never held disappearing
  locally.

A trap worth repeating: all three datasets were identical after the first merge,
and a test against identical data detects nothing. Every one of these needed a
deliberately planted difference first.

## 12. What I want to build next

### 12.1 Onboarding slideshow — SHIPPED 1.7

See §9. Kept here only as a pointer.

### 12.2 Profile editing — email change is the last piece

Name and password are done. Password **reset** shipped in 2.0. **Email change is
still not built**, and is now the only remaining item — see 12.4's deferral note
for the reasoning and the recovery gap it carries.

SMTP is no longer the blocker; the flow itself is. Supabase's
`updateUser({ email })` sends a token to **both** the old and the new address by
default, so in code mode the user enters two codes on one screen. `AccountScreen`
still says email change is not available, and that copy stays until it is.

Password changing **re-authenticates first**. `updateUser({ password })` needs
only a live session, so without it a borrowed unlocked phone is enough to take
the account permanently. `changePassword` signs in with the current password,
then updates. A failed re-auth leaves the existing session untouched.

Registration requires 8 characters, above Supabase's own floor of 6. **Login
checks presence only** — see §5.

### 12.3 Connect the domain — FULLY DONE, closed 2026-08-19

**`upkeepdaily.com` is the app.** It serves from `main` via Cloudflare Pages.
**GitHub Pages is off.** Nothing in this section is outstanding; it is kept
because the cutover order and the reasoning behind it are still the best record
of how the app is hosted and why.

**Setup (done earlier, on the now-deleted `cloudflare-pages` branch):**
- `base` removed from `vite.config.ts`; `start_url` and `scope` now `/`
- `basename` removed from `BrowserRouter` in `App.tsx`
- `public/404.html` deleted, and the `sessionStorage.redirect` restore block
  removed from `main.tsx`
- Cloudflare Pages project `upkeep` — see §9 for full settings
- `upkeepdaily.com` attached as a custom domain; `www` CNAME (proxied) plus a
  single redirect rule sending `https://www.*` → `https://${1}`, 301
- Supabase Site URL set to `https://upkeepdaily.com`

**The cutover, in the order it was done.** The order was load-bearing and got
corrected twice while planning it:

1. Tester warning sent — export a backup, make an account, reply to confirm
2. **Farewell build pushed to `main` while `deploy.yml` still existed**, so
   GitHub Actions published it. `selfDestroying: true` on `VitePWA` plus a
   static `index.html` notice. `base` deliberately kept — this build is served
   from `/health-tracker/` and dropping it would 404 every asset
3. `deploy.yml` deleted and pushed. This unhooks GitHub Pages: no run fires,
   and it keeps serving the last build it made, frozen, forever
4. Farewell commit **reverted** — mandatory, because `selfDestroying: true`
   reaching Cloudflare would make the live app kill its own service worker
5. `cloudflare-pages` merged into `main` (clean, no conflict — the revert put
   `main` back to a state git could merge), then the branch deleted
6. Cloudflare production branch switched to `main`, then a deployment
   **retried** to actually promote it
7. `CLAUDE.md` deleted

**Why the farewell build exists.** `selfDestroying` alone leaves testers with a
working-looking cached app until GitHub Pages goes dark, then a bare browser
error — a silent ghost, which is the thing the whole exercise was meant to
avoid. So `index.html` was replaced with a themed notice page carrying a link to
`upkeepdaily.com` and, crucially, **a standalone rescue export**: vanilla JS
that opens `UpkeepDB` directly, reads the fourteen exported stores, and emits a
`version: 2` file the real importer accepts.

The rescue export was written against `backup.ts` rather than from memory, and
three details mattered:
- `importAll` throws on any `version` that is not 1 or 2 — the file must say 2
- `importV2` clears every table before adding, so a tester must import
  **before** logging anything on the new site
- **`syncState` is deliberately excluded.** It holds `userId` and the per-table
  cursors; carrying those onto a different install would claim tables were
  already synced when they had never been pushed
- A zero-row guard refuses to download rather than hand over a valid-looking
  empty file. Tested on a real phone with real data before anyone was told it
  worked

**DONE 2026-08-19. GitHub Pages is switched off** — repo Settings → Pages →
Source → None. The condition for doing it was met: **every tester confirmed they
had migrated.** That confirmation was the whole point of waiting, not the
calendar date.

**This is irreversible, and it removed a recovery path.** The rescue export
lived on that origin and is gone. Anyone who used the old site, never made an
account, and never opened the app after the farewell deploy has lost that data
with no way back and no notification. That was the accepted trade, taken
knowingly. Two grace windows existed by design and both were used: exports
before the farewell deploy, and time afterwards for each device to open the app
once so the self-destructing worker actually ran.

**Do not look for GitHub Pages in this project again.** No `deploy.yml`, no
`base` path, no farewell build. If a future session finds a reference to any of
them, it is stale.

**Learned doing the setup, kept from the earlier draft:**

- **Deleting `public/404.html` is required, not cleanup.** With no top-level
  `404.html`, Pages assumes a single-page application and serves `index.html`
  for unmatched routes. Leave the file in and Pages serves that 404 on every
  deep link. This is also why **no `_redirects` file is needed** — re-verified
  live on 2026-08-10 by typing `upkeepdaily.com/settings` into a fresh browser:
  the onboarding ran and the route survived to `/settings`.
- **Node 24, not 22.** Codespaces runs 24.14; Cloudflare resolved
  `NODE_VERSION=24` to 24.13.1 and built clean. Match the environment that
  actually builds.
- **Supabase's Site URL was `http://localhost:3000`**, the untouched default.
  Inert until §12.4, when reset and confirmation emails carry a link built from
  it. Redirect URLs list is empty.
- **`www` must redirect, never serve.** Two origins means two IndexedDBs, two
  service workers, two localStorage buckets — a tester landing on the wrong one
  sees an empty app and is logged out.

**From now on, avoid GitHub-Pages-specific solutions.**

### 12.4 Release 2.0 — SHIPPED 2026-08-11

Password reset and signup confirmation are live, both as **emailed codes**.
Custom SMTP is configured. What follows is what was actually done and what was
learned, not a plan.

**Provider: Resend**, sending from the apex `upkeepdaily.com`.

**Both numbers were read off both dashboards on 2026-08-19 and are correct as
written. Do not restate them from memory — this document got them wrong twice
before.**

- **Resend free plan: 3,000/month, capped at 100/day**, one domain. Confirmed on
  the Usage tab. Actual consumption at the time of reading was 15/3,000 for the
  month and 2/100 for the day, so real demand is nowhere near either.
  The earlier note claiming Mailtrap does 150/hour and 4,000/month "and Resend
  is similar" was wrong on the *shape* of the limit — the daily cap is what binds.
- **Supabase's limit is per HOUR, not per day.** Authentication → Rate Limits →
  "Rate limit for sending emails", in `emails/h`. This is the field to change,
  and the units are the thing people get wrong.
- **⚠ Which ceiling binds has now flipped, and it flipped because of a change
  made in this document's own name.** §18's Phase 0 said "Supabase's 10/hour is
  the binding one, not Resend's 100/day" — true at 10/h. Raising Supabase to
  100/h made **Resend the binding ceiling**, because 100/h authorises up to
  2,400 sends a day against a budget of 100. **It is set to 25/hour.** See the
  reasoning below; it is not a round number chosen for tidiness.
- **Why 25 and not 100.** The risk is not tester demand, it is a cheap
  denial-of-service. Sign-ups and sign-ins allow 30 per 5 minutes per IP — 360
  an hour — so a single IP can drive the email limit to whatever ceiling is set.
  At 100/h **one abusive hour exhausts the entire day's Resend quota**, after
  which nobody can register or reset a password for the rest of that day. And
  because email enumeration protection returns a generic message either way
  (§13), the failure is close to invisible: a tester sees "something went wrong"
  and nothing surfaces the cause. At 25/h the same attack takes four sustained
  hours and each bad hour costs a quarter of the budget rather than all of it.
  **It is the ratio between the hourly ceiling and the daily quota that matters,
  not the absolute number.** Legitimate demand has never exceeded 15 in a month.
- The 3,000/month figure is effectively irrelevant. **Design against the daily
  100.**
- **Minimum interval per user is 60 seconds** — a separate per-address throttle.
  Both code screens' resend buttons use a 60-second cooldown to match it exactly,
  so the button is disabled precisely when a resend would be refused.
- Brevo (300/day) was compared and rejected: more headroom, no benefit under
  a low hourly ceiling. SendGrid no longer has a free plan.

**DNS, on Cloudflare, added by hand:** DKIM `resend._domainkey`, SPF and a
bounce MX both on `send`, and DMARC `_dmarc` at `v=DMARC1; p=none;`. All four
DNS-only, never proxied. Verified in seven minutes.

- **Auto configure was declined deliberately.** It takes an OAuth token with
  write access to the whole Cloudflare DNS zone — the same zone that points the
  apex at Pages. Permanent write access to production DNS to save one manual
  setup is a bad trade.
- Cloudflare appends the zone to the Name field: type `send`, not
  `send.upkeepdaily.com`. The confirmation line above the fields is the check.
- **DMARC does not appear in Resend's records list** because Resend marks it
  optional and only tracks what it requires. Cloudflare is the source of truth.
- **Click and open tracking are off.** Tracking rewrites every link through
  Resend's domain, which looks like phishing to filters and users, and corporate
  scanners fetch links before the user clicks — consuming a single-use token and
  leaving them with an error.

**SMTP settings in Supabase:** host `smtp.resend.com`, port 465, username the
literal string **`resend`** (not the project name — this is fixed for all Resend
accounts), password the API key, sender `no-reply@upkeepdaily.com`. The API key
is scoped to **sending access only** and lives **only** in Supabase. It is not
in the repo, not in `.env`.

**The token question is answered: `{{ .Token }}` renders as 8 digits.**

This document previously recorded "6-digit OTP codes" as an unverified design
constraint. It is eight. Both guesses on the table — six digits, or a long
random string — were wrong, which is why it was tested before any UI was built.
`RESET_CODE_LENGTH` in `auth.ts` is the single source of truth.

Eight digits is why the code input is **one field, not eight boxes**: eight 44px
targets need 352px before gaps, against a 360px phone viewport.

**Template variables render in the subject line**, tested. Both code emails put
the code in the subject (`{{ .Token }} is your Upkeep reset code`) so a
locked-out user can read it from the notification without opening anything. The
preheader then deliberately does *not* repeat it.

**All four templates are custom HTML**, matching the app: `#0a0a0f` ground,
`#14141c` card, violet accent, two-tone "Up|keep" wordmark, logo from
`https://upkeepdaily.com/icon-192-v3.png`. Code emails carry a violet top rule;
the two security notifications carry an **amber** one, so an account alert is
distinguishable from a code at a glance.

- Tables and inline styles throughout — Outlook ignores modern CSS, and
  border-radius will not render there. Accepted.
- Bricolage Grotesque cannot load in email; the two-tone split carries the brand
  instead. Bundled via `@fontsource`, not a CDN, so there is nothing to link.
- **Supabase's template preview substitutes nothing and blocks external images.**
  A broken image and a literal `{{ .Token }}` in the preview are both normal.
  Only a real send tells you anything.
- Gmail caches images hard. Replacing the PNG at the same filename may not take —
  same lesson as the Android WebAPK icons in §14.

**Security notifications are enabled** under Authentication → Emails: *Password
changed* and *Email address changed*. This document previously implied a Worker
calling Resend would be needed for these; that was wrong, they are built in.
`{{ .Email }}` and `{{ .OldEmail }}` are available in them. Each one costs a
send against the rate limit, so a reset now sends two emails.

**Link-based flows were removed entirely, not just deprioritised.** A link opens
the system browser, not the installed PWA: Supabase creates the session in that
tab while the app on the home screen knows nothing about it. The reset template
carries no link at all. This also means no deep-link route, no hash-token
parsing and no `emailRedirectTo` to get wrong.

**Email enumeration is not our choice.** `resetPasswordForEmail` reports success
whether or not the address exists, and with confirmation on, signup does the same
for an already-registered address. Supabase does this deliberately so the
endpoints cannot be used to test whether a given person uses Upkeep. Two
consequences, both handled in the UI and neither optional:

- The reset screen says *"If that address has an account, a code is on its
  way"*. Anything more definite would leak. A typo'd address is caught by showing
  it in full with a "Wrong address? Change it" link, not by validating it.
- **"That email already has an account" is now unreachable at signup.** A
  returning user who forgot they registered gets no code and no error. The code
  screen carries **"Already have an account? Log in"** as their only exit. This
  is the flow most likely to confuse a real tester.

**The `signUp` guard had to be deleted, and it was load-bearing in reverse.** It
read `if (data.user && !data.session) return 'email-taken'`, with a comment
saying it was harmless insurance should confirmation ever be switched on. The
logic inverts: with confirmation **on**, *every* signup returns a user and no
session, so it would have told every new tester their email was already taken.
Deploy the code before flipping the dashboard setting — dev and production share
one Supabase project, so enabling it strands whatever is live.

**`RegisterScreen` must not call `onDone()` until the code is verified.**
`resolveStage()` in `App.tsx` keys on being signed in, and with confirmation on
there is no session until `verifyOtp`. Handing control back after `signUp` would
bounce the user to the gate. The name write and `clearSkippedAuth()` are both
deferred to the confirm step for the same reason. **No `App.tsx` change was
needed** because of this.

**`MIN_PASSWORD` moved to `auth.ts`** and is imported by the three screens that
set a password. It was previously duplicated in `RegisterScreen` and
`AccountScreen`. `LoginScreen` still deliberately does not apply it (§5).

**Password visibility toggles** shipped across all seven password inputs via
`components/PasswordField.tsx`, alongside the existing `NumberField.tsx` and
`TextField.tsx`. The toggle's `onMouseDown` calls `preventDefault()` — without
it, tapping the eye blurs the input and the phone keyboard closes.

**Tested end to end on a real phone:** fresh signup with code, log out and back
in, repeat signup on a registered address (no code, log-in exit works), wrong
code, resend cooldown, full password reset, password change.

**Deferred, still unbuilt as of 2.1: email change.** It was in 2.0's original
scope and was pulled
deliberately — it was never the tester gate, and it is the fiddliest of the four
flows. **The recovery gap it carries needs deciding before it ships:** if an
attacker changes the email, password reset then sends codes to *their* address
and the real owner has no self-service route back. The notification email points
them at in-app Feedback, which means recovery is manual, by hand, in the Supabase
dashboard. Requiring the current password before an email change — matching
`changePassword` — would make the attack need two things instead of one.

### 12.5 Distribution

**Android:** downloadable APK via Capacitor, or Play Store ($25 once plus a
12-tester closed test for 14 days). Also a real install button using
`beforeinstallprompt`.

**iOS:** no sideloading; App Store is $99/year. The PWA may always be the only
version. Instead: **detect iOS and show an install prompt** with step-by-step
instructions (Share → Add to Home Screen), since Safari never offers it. This
also helps session persistence — see §13.

A proper install guide page covering both platforms.

### 12.6 AI voice assistant

**Scheduled last, in §18's Phase 10, and deliberately so.** On 2026-08-19 the
scope widened from voice logging to a chat assistant that could also build
routines and meal plans — and the cost model in §12.11 is unchanged by that.
Everything below still applies; the regex-first plan is still the right first
move, and it gained the offline argument.

**Costed and reconsidered on 2026-08-18 — read §12.11 alongside this.** This
section used to open by calling the assistant "the paid-tier differentiator
eventually, but wanted working for personal use first." That framing predates
the idea of keeping everything free, and §12.11's numbers show AI is the only
cost that scales without bound. The local-parser-first instinct recorded below
was right, and gained a second argument nobody had noticed: **a local parser
works offline**, which matters a great deal for a local-first app.

Target: press a mic button, say *"add 60g of oats with 300ml milk and 30g peanut
butter for breakfast"*, it confirms and logs all three. Same for workouts.

- **Speech-to-text is free** — Web Speech API uses the phone's own engine
- **Parsing the transcript** is the paid part; Claude Haiku is a fraction of a
  cent per command
- A **regex/pattern-matching parser** could handle ~80% of commands for free,
  with the LLM as fallback. Explore this first.
- ~~The API key must be server-side~~ — **superseded 2026-08-18.** True only if
  *we* pay for the tokens. Under BYOK the user's own key lives in Dexie and the
  browser calls the API directly, with no Function and no key of ours anywhere
  (§12.11). Both models are still open. What is *not* open: storing users' keys
  server-side to proxy for them.
- Hands-free wake-word listening is native-only, so push-to-talk in the PWA
- **Either AI path needs `api.anthropic.com` added to `connect-src`** in
  `public/_headers`, or every call fails in production only (§12.12)

### 12.7 Larger food database

Wanted: more German discounter products (Netto, Kaufland, Lidl, Aldi) and fast
food. **Read §13 first** — the coverage is already there and the search is not
broken. The genuine gaps are:

- **Fast food** — Open Food Facts is packaged-goods-shaped and patchy on
  restaurant meals. Best answer is a small curated bundled set (~150–250 items)
  in `commonFoods.ts` style: McDonald's DE, Burger King, Subway, KFC, Nordsee,
  plus döner and Currywurst. Compiled from chains' published nutrition tables.
  No ODbL entanglement, tiny file.
- **English search terms against German products.** The `keywords` field in
  `commonFoods.ts` already handles this (`magerquark`, `haferflocken`,
  `hackfleisch`) and is the right pattern to extend.

**Do not bundle a large Open Food Facts extract.** The German slice is hundreds
of thousands of products (the full JSONL dump is 43 GB decompressed), it would
blow the Workbox precache limit, and OFF data is ODbL — share-alike terms attach
to a redistributed derivative database, which conflicts with an
all-rights-reserved repo and a future paid tier. Querying the live API is fine.

### 12.8 Smaller things, whenever

- ~~Fix `pullGoals` / `pullProfile`'s string timestamp comparison (§14)~~ —
  **DONE 2026-08-19**
- ~~Fix `downloadBackup`'s premature `revokeObjectURL` (§13)~~ — **DONE
  2026-08-19**
- Routine polish: weekly view, completion rates, step notes UI
  (`CareStep.notes` exists, no UI)
- Body measurements beyond weight — neck, chest, arms, waist, thighs, calves,
  body fat percentage, each with a sparkline
- Progress overview section — deferred, the hub summary covers most of it
- Batch `hubSummary`'s per-routine `getSteps` queries at ~20 routines

### 12.10 Workout section — mostly SHIPPED 2.1

**Everything still open below is now scheduled in §18's Phase 7**, alongside the
floating rest-timer bar, the swap-exercise feature and the target-muscle
breakdown. Time-based exercises still need their "what does volume mean for a
plank" decision before any code, and that has not been taken.

The list I had been carrying in my head, worked through on 2026-08-18. Shipped:
column alignment, the delete button, header opacity, the rest chime, empty
number fields in the routine editor, bodyweight sets, the wall-clock rest timer,
the update-routine prompt, per-set routine targets and target RPE.

**Deferred — time-based exercises.** Planks, stretches, holds: a duration
column replacing kg and reps. Parked deliberately on 2026-08-18 as the largest
remaining item. It is not just a column — `workoutVolume`, `lastSetsFor` and the
progress charts all assume weight × reps, and a plank has neither. Decide what
"volume" means for a timed exercise before writing any of it.

**Smaller, still open:**

- Number-field coercion elsewhere in the app. Only `RoutineFormScreen` was
  fixed. `FoodForm`, `GoalsScreen` and `MeasurementFormScreen` were checked and
  are fine because they use `NumberField`. Anything hand-rolling
  `<input type="number">` is a candidate — see §5.
- The rest timer survives backgrounding but not the app being killed. Fixing
  that needs the end timestamp persisted to Dexie and rehydrated on mount, plus
  a "your rest ended 4 minutes ago" state rather than a stale countdown.
- The RPE row sits under the rest row, so every exercise card is two lines
  taller. If it feels bloated at four or five exercises, merge them onto one
  line when the timer is not running.
- Supersets, replace-exercise, per-exercise weight units and exercise
  thumbnails were all deliberately left out of the 2.1 routine editor.
  Supersets in particular are a data model change of their own.

### 12.9 Feedback Worker rate limit — SHIPPED 2026-08-10

`upkeep-feedback` now calls a Cloudflare rate limiting binding before doing
anything else. **The Worker source lives only in the Cloudflare dashboard
editor, not in this repo** — both Workers are edited and deployed there.

Binding: `FEEDBACK_LIMITER`, namespace `1001`, limit 3, period 60.

Three things worth knowing before touching it:

- **It is a burst control, not a flood control.** Cloudflare's period must be
  either 10 or 60 seconds — "five per hour" is not expressible. A patient script
  that reads the 429 and slows down still gets through. It stops a naive loop.
  Given the PAT scoping in §16, that was judged enough; Turnstile was considered
  and rejected as disproportionate.
- **Limits are per Cloudflare location and eventually consistent.** The API is
  documented as permissive and explicitly not an accounting system. Four
  requests got through against a limit of 3 in testing. Expected; do not tune it
  to try to make the number exact.
- **Keyed on IP, against Cloudflare's own advice.** The docs recommend stable
  identifiers and warn IPs are shared. Anonymous feedback has no user to key on,
  and the tester group is tiny. Deliberate, with the tradeoff understood.

The client changed with it. `sendFeedback` in `src/data/feedback.ts` now wraps
the `fetch` and the `res.json()` separately, so "could not reach the server"
and "the server said no" are distinguishable — previously a non-JSON response
threw a `SyntaxError` that surfaced as a connection problem. **All user-facing
error wording lives in `feedback.ts`;** `FeedbackScreen` displays whatever it is
given rather than deciding messages from status codes. One fact, one home.

### 12.11 Public release — research, not decisions (2026-08-18)

**Read this framing first.** Everything in this section is a menu. Nothing here
is chosen, costed to the euro, or scheduled. It exists so the next session does
not have to rediscover it, and so I stop carrying it in my head. When one of
these is actually picked, it gets its own section and this one gets a pointer.

**Pointer added 2026-08-19.** Several items below are now *sequenced* in §18:
progressive overload and swap-exercise in Phase 7, the muscle heatmap in Phase 7
(still gated on the unverified seed question), progress photos in Phase 9 as a
**local-only** feature that sidesteps the storage blocker entirely, program and
mesocycle structure in Phase 3, and AI in Phase 10. Sequenced is not the same as
decided — the costs, the legal position and the funding question below are all
unchanged, and the two documents that will be needed regardless (§12.11's
Datenschutzerklärung and Impressum) have not been started.

The trigger was a file, `Suggestions.md`, in the repo root: scraped Reddit
comments about what people want from fitness apps. Worth knowing when reading
it that several entries are developers plugging their own apps, and one long
ranked list is a single person's taste. The signal is what repeats across
strangers.

**The strongest finding is that the thing people keep asking for is already
built.** Multiple unrelated commenters describe juggling four or five apps —
one for lifting, one for macros, one for cardio, one for progress photos. The
tandemfit developer lists his five by name. Meals, workouts, body weight and
routines in one local-first app, free, with no account required and data that
exports, is an unusual position. Do not dilute it chasing features that break it.

**Already shipped, against their wishlists:** progress charts, PRs, Epley 1RM,
volume trend, calendar with streaks, warmup/working set labelling, bodyweight
sets, a rest timer that survives a locked phone, a 1,324-exercise library
(JEFIT's 1,400 is described in the scrape as "biggest out there"), export and
import, no account required, dark UI, macro tracking in the same app.

**Cheap and plausible, roughly in order of value for effort:**

- **Progressive overload prompt** — show last session's numbers and suggest the
  next. Requested directly, and Setgraph scores 8.5 in the scrape largely for
  this. `lastSetsFor` and the history already exist; this is display plus a
  suggestion rule.
- **Swap an exercise mid-workout** — "planned equipment is in use or I'm just
  feeling something else." §12.10 records this as deliberately left out of 2.1.
  Reuses `ExercisePicker`.
- **Muscle heatmap** per planned and completed session. `muscleGroups.ts` and
  the radar balance chart mean some of the data plumbing exists. **Unverified:**
  whether the bundled dataset carries primary/secondary muscles or only
  `bodyPart`. Read `exercises.ts`, `muscleGroups.ts` and the seed file before
  estimating — that answer decides whether this is a display job or a data job.
- **Time-based exercises** — already §12.10's deferred item. Still needs the
  decision about what volume means for a plank before any code.

**Larger, possible, not costed:**

- **Progress photos.** Recurring in the scrape. The blocker is architectural,
  not visual: sync moves rows, not blobs, and Supabase's free tier gives 1 GB of
  file storage against 100 GB on Pro. Photos are also the one thing that would
  make egress a real cost.
- **AI workout generation.** Fitbod's whole pitch. Note two commenters
  independently say the AI suggestions get annoying and produce "hot garbage."
- **Program and mesocycle structure.** RepMD and Ladder both sell this. Big.

**Cannot be done on the current architecture, and worth being clear about:**

- **Watch integration.** Named by at least four commenters and the deciding
  factor for two of them. A PWA cannot talk to a Garmin or an Apple Watch.
  Capacitor closes part of this on Android; Apple Watch specifically needs a
  real WatchOS app and the $99/year account. **This is the one genuine
  capability gap that money and effort cannot close from where the app stands.**
- **Heart rate and calorie burn.** Same reason.
- **Social feeds, shared programs, competitions.** Technically possible but it
  inverts the security model — every RLS policy on all sixteen tables is
  `auth.uid() = user_id`, and sharing means rows readable by non-owners. This
  project has already been bitten twice by key scoping (§11). Also worth noting
  the most detailed reviewer in the scrape explicitly does not want it.

#### What an AI feature would cost

This was the actual question behind the session. Numbers checked 2026-08-18;
API pricing changes, so re-check rather than trusting these.

Everything in the stack is a step function except AI, which is a straight line.

- **Fixed:** Apple Developer $99/year recurring, Google Play $25 once, domain
  ~$10/year. Roughly $110/year regardless of users.
- **Infrastructure:** Supabase free tier is 500 MB database, 1 GB file storage,
  5 GB egress, 50,000 MAU. Health rows are tiny — a heavy user generates maybe
  3–5 MB/year — so 500 MB is roughly 150 heavy users or several hundred typical
  ones. Pro is $25/month for 8 GB database, 100 GB storage, 250 GB egress,
  100,000 MAU. Cloudflare Pages bandwidth is free. Add Workers paid ($5/month)
  once food search exceeds 100k requests/day, and a Resend paid tier (~$20/month).
- **Realistic: $0/month to a few hundred users, ~$50/month to a few thousand.**
  The local-first architecture is what makes this cheap, and it is worth
  recognising that as an asset rather than an accident.
- **AI, at Haiku 4.5 rates ($1 per million input tokens, $5 per million
  output):** a voice-parsing command is roughly $0.001–0.002 with prompt
  caching. That is ~$150–240/month at 1,000 active users, ~$1,500–2,400 at
  10,000, ~$15,000–24,000 at 100,000. **This is the only unbounded line item**,
  and it cannot be capped without breaking a promise of "free for everyone."

**Three ways out, all still open:**

1. **A local parser first.** §12.6 already proposed regex/pattern matching for
   ~80% of commands. Beyond cost there is a second argument that only became
   obvious in this session: **a local parser works offline.** For an app whose
   whole identity is local-first, "voice logging works with no signal" is a
   better feature than "voice logging works only online." Most commands are
   shaped like `60g oats` or `3x8 at 80kg`.
2. **Bring your own key (BYOK).** Anthropic's API blocks browser calls by
   default but supports them via an `anthropic-dangerous-direct-browser-access:
   true` header, and names BYOK as an intended use case. Cost becomes exactly
   zero. Fits the architecture: **the key lives in Dexie, never syncs, never
   touches Supabase or a Worker.** Do NOT build the variant where keys are
   stored server-side for a proxy to use — that makes this project the custodian
   of live billing credentials, which is worse liability than the health data.
   Two caveats: it puts a billing credential in the same origin as the Supabase
   session (§16), which is part of why the CSP mattered; and realistically only
   a small fraction of users will create an Anthropic account, add a card and
   paste a key, so BYOK serves power users rather than everyone.
3. **A capped free allowance on our own key**, later, if affordable. Optional
   and reversible. Never announce before it exists.

**Running our own model** was considered and is not viable: in-browser
(WebLLM/transformers.js) means a 1–2 GB download onto a phone against a 2.4 MB
precache; self-hosted means a GPU running 24/7, which costs more than Haiku at
this scale and breaks the no-self-managed-backend rule. Free tiers from other
providers have rate limits a public app would exhaust and terms that do not
contemplate reselling access.

#### Funding it, and the legal position — MOVED OUT OF THIS FILE

**This subsection now lives in `PRIVATE-NOTES.md`, which is gitignored**, because
this repository is public and the content is personal: German tax treatment of
donations, VAT and the small-business scheme, app store payment rules, and the
residence-permit position that governs whether any of it is possible at all.

Nothing was cut or summarised — the whole subsection moved verbatim on
2026-08-24. **Read `PRIVATE-NOTES.md` before any donation link, public release
or app store listing.** The one-line version, so this file is not silently
misleading: **pure donations with nothing given in return are the only shape
that avoids all three of the tax, VAT and in-app-purchase problems at once**,
and the first action is reading a document rather than writing any code.

Two documents will be needed regardless of how the funding question lands, and
neither has been started: a **Datenschutzerklärung** (the more urgent — GDPR
applies to a hobby project too, and both app stores make a privacy policy URL a
mandatory submission field) and an **Impressum**. Details, including which
processors have to be named, are in `PRIVATE-NOTES.md`.

#### Hard blockers for an app store release

Independent of everything above, and both currently unbuilt:

- **Account deletion.** Apple requires in-app account deletion for any app with
  account creation. §13 records that deleting a tester currently needs manual
  SQL plus a dashboard action. **This is a hard submission blocker**, and it is
  real work: cascading server deletes across sixteen tables, a local wipe, and
  a decision about whether the auth user goes with it.
- **The email ceiling. Raised on 2026-08-19, but the constraint did not go
  away — it moved.** Supabase is now 25/hour (§12.4). **Resend's free 100/day
  is the binding ceiling now**, and it is a hard wall: a public launch bringing
  200 people in an evening means over half never receive a confirmation code,
  and no dashboard setting fixes that. Raising the Supabase number further makes
  it worse, not better, because it lets a burst drain the daily quota faster.
  **A public release means paying Resend, or accepting that signup throttles
  at 100 people a day.** That is a funding question, not a settings question,
  and it belongs with the rest of §12.11's cost modelling.

### 12.12 Content-Security-Policy — SHIPPED 2026-08-18

**`public/_headers` exists and the CSP is enforcing on `upkeepdaily.com`.** This
closes the gap §16 named as the largest remaining one, and it retires §17's
first item. Note that previous versions of this document described `_headers` as
a file that would "merge cleanly" during the cutover — it had never been
committed until now (§14 records that mistake).

The file goes in `public/` so Vite copies it into `dist/`, which is what
Cloudflare Pages reads. It is not referenced from anywhere in the app.

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.openfoodfacts.org; font-src 'self'; connect-src 'self' https://xpgvjvtluljbqyywnenl.supabase.co wss://xpgvjvtluljbqyywnenl.supabase.co https://world.openfoodfacts.org https://upkeep-search.aswin010pk.workers.dev https://upkeep-feedback.aswin010pk.workers.dev; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(self), microphone=(self), geolocation=(), payment=()
```

**What it actually buys, stated precisely so it is not overrated.** §16 notes
the Supabase session lives in localStorage, so any JavaScript on the origin can
become the user permanently, and names supply chain as the realistic vector. A
CSP does not stop a compromised npm package from running. It stops it from
*phoning home*: `connect-src` blocks the exfiltration request before it leaves
the device. **Damage limitation, not prevention.** That is the correct mental
model.

**Decisions taken, recorded so a future session does not silently undo them:**

- **`style-src` carries `'unsafe-inline'` deliberately.** §5 uses inline
  `style={{}}` for one-off layout, and CSP counts those. This is a genuine
  weakening and was accepted knowingly: style injection is defacement, whereas
  `script-src` stays strict and that is the directive guarding the session
  token. **Do not remove it without removing every inline style first.**
- **`wss://` on the Supabase host** — supabase-js can open a websocket even when
  realtime is unused. Same host already trusted over https, so it costs nothing
  and prevents a false alarm.
- **`camera=(self)`** in Permissions-Policy is the barcode scanner. Removing it
  breaks scanning. `microphone=(self)` is there for the eventual voice work.
- **`images.openfoodfacts.org`** was added defensively without evidence it is
  needed. Harmless if unused; flagged here rather than left to be discovered.
- **`frame-ancestors 'none'`** — nothing can iframe Upkeep. No downside for a PWA.

**How it was verified, which is the part worth copying next time.** The first
deploy used `Content-Security-Policy-Report-Only`, which logs violations and
blocks nothing, so no tester could be affected by a wrong policy. Testing was
done in an **incognito window** specifically because a normal window has the
service worker installed and can serve a cached response that never carried the
header (§14's recurring stale-worker trap).

Two checks mattered more than the absence of errors:

- **`console.log('test')` was run first**, to prove the console was reporting at
  all. An empty console because everything passed and an empty console because
  nothing was being shown look identical — the same failure shape as §14's
  vacuous `keep-local` test and the `care_step_done` query that could not
  distinguish its two outcomes.
- **The food search was exercised and returned results.** That is the only path
  hitting `upkeep-search…workers.dev` and the one most likely to break under a
  bad `connect-src`. A clean console during a page load that never made a
  cross-origin request would have proved nothing.

`curl -sI https://upkeepdaily.com | grep -i content-security` confirmed the
header on the real origin, before and after the flip to enforcing.

**Rollback is one word** — rename the header back to
`Content-Security-Policy-Report-Only` and push.

**The trap for future sessions:** the CSP does not apply on the dev server, so a
new external origin works locally and fails only in production, surfacing as a
network error rather than a policy error. `api.anthropic.com` will need adding
for any AI work, and Supabase Storage for progress photos. This is now also a
rule in §5.

**No changelog entry.** Nothing user-visible changed, and §5 reserves changelog
entries for releases. If it ends up bundled into a later release, one plain line
is enough — nobody needs the acronym.

### 12.13 English and German — IN PROGRESS, ~1/2 translated 2026-08-22 (2nd)

**The requirement:** the app ships in English and German, with a dedicated
switch. **Not browser auto-translation** — that produces bad German and mangles
the layout. The user picks a language at the very start and everything is
accurate in it.

**Why it sits at the front of §18 rather than at the end.** This is a build
constraint of exactly the same shape as the CSP (§12.12). Every screen written
from now on either carries translatable strings or gets retrofitted later. There
are roughly 40 screens today. Doing this after the ten phases means retrofitting
an app close to twice this size. The infrastructure goes in first; translating
the *existing* screens can then happen gradually while new ones are born
translated.

**What is built, as of 2026-08-22, on branch `phase-1-i18n`:**

- `src/data/i18n.ts` — module-level `current` language, `t()`, `locale()`,
  `detectLanguage()`, `applyLanguage()`, `onLanguageChange()` and a
  `useLanguage()` hook over `useSyncExternalStore`
- `src/data/locales/en.ts` and `de.ts` — flat dotted keys, `de` typed
  `Record<TKey, string>` against `en` so a missing string fails the build
- `language` on `syncState` (§6), local-only, **not mirrored into `profile`**
- The `language` stage in `App.tsx`, before `onboarding` (§9)
- `LanguageScreen`, deliberately bilingual and untranslated
- A switch in Settings, applying immediately with no save button
- `NumberField` rewritten to accept both `,` and `.` — shipped separately as
  2.1.1, see §13

**Translated so far:** the entire first-run journey (language → onboarding →
gate → name → goals), `Layout`, `HubScreen`, `sections.tsx`, `SettingsScreen`,
the three shared modules `ui.tsx`, `dates.ts` and `rpe.ts`, **all six auth
screens plus `auth.ts` and `adopt.ts`** (2026-08-22, 2nd), and — as of
2026-08-23 (2nd) — **the entire meals section**.

**Not yet translated:** workouts, body, care routines, and About / Feedback /
Install.

#### The meals block, done 2026-08-23 (2nd) in five tested chunks

`TodayScreen` + `AddEntry` · `FoodListScreen` + `FoodSearch` · `FoodForm` ·
the barcode scanner pair · `GoalsScreen` + `ChartsScreen`. Each was built,
built clean, tested in both languages at 360px, and committed before the next
was written. **No German string needed shortening**, which the auth block could
not manage — worth knowing before assuming §12.13 item 4 always bites.

Three files in the section turned out to have **no user-facing strings at all**
and are recorded here so they are not read again: `overview.ts` (returns
numbers), `goals.ts` (arithmetic and Dexie), `AddEntryScreen.tsx` and
`FoodSearchScreen.tsx` (pure routing).

**`MEAL_KEYS` and `mealLabel()` live in `log.ts`**, beside `MEALS`. Meal ids are
stored data — the `[date+meal]` Dexie index and a Postgres column — so they stay
English forever and only the label translates. A `Record<Meal, TKey>` at module
level is safe; a `Record` of `t()` *results* would freeze its language at import
(§5). Same shape as `tableLabels()` in `adopt.ts`.

**`textTransform: 'capitalize'` came off the meal `<select>`** in `AddEntry`.
The catalogue supplies display-cased strings, so it was a hack sitting on top of
a translated value.

**Two things were fixed in passing, neither of them i18n:**

- `FoodSearch`'s common-food subtitle hardcoded `= ${food.pieceGrams}g` where
  every other screen uses `food.unit`. Correct today only because no piece-based
  common food is `ml`. Fixed for free by reusing the `add.perPiece` key.
- **`BarcodeScanner.tsx` carried the `t()` shadow twice** —
  `stream.getTracks().forEach((t) => t.stop())` in `startNative` and again in
  the cleanup. Both renamed to `track` before the import went in. §14 already
  records this trap from `Layout.tsx`, and it is worth repeating that it
  **produces no error**: `t('…')` inside those blocks would have resolved to a
  `MediaStreamTrack`.

**Catalogue prefixes established, and they matter for the phases after this
one.** `macro.*` (`protein`, `carbs`, `fat`, plus `pShort`/`cShort`/`fShort` for
the `P 12 · C 30 · F 5` rows) is scoped separately from `meals.*` precisely so
Goals and Charts could reuse it — which they now do, three screens sharing one
set of keys rather than four near-duplicates. `meals.*`, `add.*`, `foods.*`,
`search.*`, `form.*`, `scan.*`, `goals.*` and `charts.*` are the section's own.

**`plural()` earned its keep exactly where §17 predicted it would not.** Meals
had almost no counting, but `ChartsScreen` has three: the 7/14/30 range chips,
and two summary rows. `charts.ofNDays` pluralises on the *total*, not the
numerator — "0 of 1 day", "3 of 5 days" — because the noun being counted is days
in the period.

**Recharts formatters are safe for `t()`.** They are props, but they are called
at render time, so they are not the module-level freeze hazard §5 warns about.
The x-axis needed nothing at all: `tickFormatter={shortDay}` already goes
through `locale()` in `dates.ts`. `macroData` was moved inside the component,
because as a module-level array it would have frozen its labels.

**Technical error text stayed English, deliberately, in two more places** —
extending the `AdoptScreen` rule in §5. The barcode scanner prints the browser's
own `err.name` in parentheses inside a translated sentence, and
`BarcodeScanScreen` shows `openfoodfacts.ts`'s `Lookup failed (404)` verbatim.
Only the surrounding copy and the app's own fallback translate.

**One accepted regression, recorded so it is not "fixed" back:** the piece-mode
toggle in `AddEntry` showed `` `${pieceLabel}s` `` and now shows the label
as-is. English loses a plural ("apple", not "apples"); German avoids
"Scheibes". `pieceLabel` is stored user data and stays untranslated, so English
grammar cannot be bolted onto it. `FoodForm` sidesteps the same problem with
**`Gewicht pro {label}`** — `pro` is the one German preposition that reads
naturally with no article, and no article can be correct for a free-text noun of
unknown gender.

#### Decision 17 — ANSWERED 2026-08-23 (2nd): keywords only, names stay English

**`commonFoods.ts` keeps English `name` values. German goes in `keywords`.**

**The exercise-seed argument does not apply here at all**, and §17 was right to
say so. `searchCommonFoods` already indexes `` `${f.name} ${f.keywords ?? ''}` ``
and `keywords` already holds German — `magerquark`, `haferflocken`,
`hackfleisch`, `linsen`, `mandeln`, `erdnussbutter`, `vollmilch`, `olivenöl`.
The mechanism exists, is half-populated, and costs nothing to extend. A German
user typing "Haferflocken" already gets a hit.

**The deciding argument is persistence, and it is stronger than the search one.**
A common food has no id; a UUID is minted only when one is copied into the
user's food list. So its `name` becomes a `Food` row, which is synced, and is
then snapshotted into `logEntry.foodName` on every entry — and §5 forbids
rewriting those. A German name would not *render*, it would **persist**: pick
Haferflocken, switch to English, and the food list and the entire meal history
still say Haferflocken, permanently, with no safe way back. A translated screen
follows the switch; a translated row does not.

Two smaller supports: `pieceLabel` would have to be translated too, and it is
displayed with naive English pluralisation in two places; and `nameDe` remains
available later with no schema change, the same escape hatch decision 2 kept.

**Extending `keywords` with more German terms is a data job, available any
time, and needs no decision.**

**The auth block, done in three testable chunks on 2026-08-22 (2nd).** Login and
recovery first, then register and account, then adoption. Each was built and
tested on the branch preview before the next was written, per §14's rule about
diffs too big to review.

- **`friendly()` in `auth.ts` is now translated in place.** It was already the
  single home for auth error wording — the §12.9 pattern — so no new helper was
  needed. It is a **function called at failure time**, not a lookup table, which
  is what stops it freezing its language at import (§5).
- **`adopt.ts`'s `TABLE_LABELS` became `tableLabels()`** for the same reason. It
  was a module-level object of English strings, which is the exact freeze hazard
  §5 names. Note the dev console helper changed signature with it:
  **`upkeepAdopt.labels()` now, not `upkeepAdopt.labels`** — the old form still
  evaluates to something truthy and prints the function source, which is a
  silent trap of precisely the kind §14 already records.
- **`i18n.ts` gained `plural()` and `tParts()`** — see §5 for what they are for.
- **Two real bugs were found by reading the screens, neither of them i18n:**
  `AccountScreen` declared its own `const MIN_PASSWORD = 8` instead of importing
  the one 2.0 deliberately moved into `auth.ts`, so raising the policy would have
  silently left that screen enforcing the old value; and `AdoptScreen`'s
  `formatDate` called `toLocaleDateString()` with no locale, breaking §5's rule
  verbatim. Both fixed in the same commits.
- **Some English copy was consolidated rather than translated twice.** "The two
  *new* passwords do not match" lost the word "new" and now shares
  `auth.pwMismatch` with the reset screen — both sit directly under two password
  fields, so the word was doing no work and one string beats two that drift.
  Headings reuse existing keys (`layout.account`, `auth.password`,
  `settings.name`) rather than minting near-duplicates.
- **German copy checked at 360px on the branch preview.** Two strings were
  shortened to fit a block button: `register.haveAccount` is
  **"Schon ein Konto? Anmelden"**, not the literal "Du hast schon ein Konto?",
  which wraps to two lines. This is §12.13 item 4 biting exactly where it was
  predicted to.

**Decision taken: hand-rolled.** `react-i18next` is ~40 KB of machinery for two
languages that share the same one-versus-many plural rule. §16 names supply
chain as the realistic XSS vector. The whole layer came to ~60 lines.

**A related decision was taken and then reversed inside the same session, and
the reversal is the right one.** Hand-rolling was initially argued for partly on
the grounds that it allows loading only the active language's catalogue by
dynamic import, the `exercises.json` pattern. Once the scale was actually
estimated — ~40 screens, maybe 1,000 strings, both catalogues together roughly
50 KB raw against a 1.65 MB bundle — that argument collapsed. **The catalogues
are plain static imports and `t()` is synchronous.** The measured cost of both
languages was **+22 KiB of precache**. Splitting that would have bought under 1%
in exchange for an async `t()`, a loading state in the language stage and an
async language switch.

**Four things that bite, recorded now so they are not discovered later:**

1. **Auth emails cannot easily be per-user localised.** Supabase composes and
   sends every message from one template per type (§3, §12.4), so a German user
   gets an English reset code. Cheapest fix by a distance is **bilingual
   templates** — a German block above the English one in the same email. No
   code, no new sending path. The alternative, sending auth mail from a Worker
   via the Resend API, means a second sending path and a live sending
   credential somewhere new. Not worth it.
2. **The bundled exercise dataset is English-only, all 1,324 of them.**
   Translating the lot is not worth it. Translating `bodyPart` and `equipment` —
   a small enum — does most of the visible work, and German lifters commonly use
   the English movement names anyway. If more is wanted later, an optional
   `nameDe` on the seed with a fallback, populated only for the most-used few
   hundred, and `exercisePopularity.ts` can say which those are.
3. ~~**German decimal commas.**~~ **CONFIRMED AND FIXED 2026-08-22, and it was
   worse than this entry guessed.** The prediction was that `67,5` "must parse"
   and probably did not. What actually happened on a real phone: Chrome's
   `type="number"` sanitiser **silently deleted the comma**, so `67,5` became
   `675` — a weight saved ten times too high, no error, no empty field, nothing
   to report. Not a German-only bug either; it was live for every user who ever
   typed a comma. Fixed by moving to `type="text"` with manual parsing. Full
   detail in §13.
4. **German strings run 30–40% longer than English.** Every button, chip and
   stat label needs checking at 360px with German copy. This is the single most
   likely source of "it looked fine in review and broke on the phone", and it
   should be tested early rather than at the end.

**Decision taken: German exercise names are enum-only.** 38 strings (10
`bodyPart` × 28 `equipment`), not 1,324. The deciding argument was not the
string count but **search**: translating names would mean the fuzzy index has to
cover both `name` and `nameDe`, or a German user typing "Bankdrücken" gets
nothing while one typing "Bench Press" gets a hit. Enum-only touches no search
path at all. `nameDe` remains available later without a schema change.

**Decision taken: auth emails are bilingual, English block on top.** English
first so the email matches the language the user has just seen on screen at
signup, since English is the app default. Four templates, no code, no second
sending path. **Not yet done** — this is template editing in the Supabase
dashboard, not a code change, and it did not happen in the 2026-08-22 session.

**Still open: `changelog.ts`.** This section originally called for every past
entry to be translated. That is 26 releases, ~160 lines of user-facing German
prose, for content most people read once — the largest single translation job in
Phase 1 by a distance. **Recommendation: add an optional `changesDe?: string[]`
to the `Release` interface and render `changesDe ?? changes`.** New releases ship
bilingual from 2.2 onward; historical entries stay English and fall back
cleanly, and any release can be backfilled later without a type change. Not
taken — decide it when the About screen is translated.

Also needing translation, and easy to forget: any predone program seeds
(§18 Phase 3).

**Copy decisions made, worth not re-litigating:**

- **Informal "du" throughout.** Standard for a personal health app. This is a
  tone commitment that gets expensive to reverse once every screen is done.
- **Sections translate** — Mahlzeiten / Körper / Training / Routinen. Confirmed
  on a phone against the onboarding slides before it spread to the nav.
- Three German strings deliberately depart from the literal: Foods → **Essen**
  (not `Lebensmittel`, which is correct but far too long for a four-tab bar);
  workout routines → **Pläne** (English already collides — a Routines tab inside
  Workouts *and* a Routines section — and `Pläne` is what German lifters say);
  workout count → **Einheit / Einheiten** (not `Trainings`, which is clumsy, and
  it stays distinct from the section name `Training`).
- `Good afternoon` → **Guten Tag**. German has no common "Guten Nachmittag".
- Placeholders are content: `John Doe` → **Max Mustermann**.

### 12.14 Screenshot audit — what a paid competitor has (2026-08-19)

Eighteen screenshots of a paid, native, team-built fitness app were gone through
in full. Worth holding onto the context: it has a Stripe subscription, live chat
support, a $15 referral bounty and an in-house AI. A lot of what it does exists
*because* it has revenue and a native shell, not because it is better designed.

**Already had it, do not rebuild:** barcode scan, food search, per-meal logging,
macro goals, exercise library, set logging, rest timer, warm-up/working-set
labelling, per-set targets, per-exercise history, PRs, volume trend, calendar
streaks, weight trend, export/restore, dark theme, in-app feedback.

**Taken, and where it landed in §18:** quick log, per-meal calorie/protein
badges and "often logged for breakfast" (Phase 2); programs, the weekly
schedule with rest days, and predone programs (Phase 3); the onboarding goal
questionnaire and computed targets (Phase 4); dashboard, daily checklist and
per-section streaks (Phase 5); preferences, unit toggles and a light theme
(Phase 6); floating rest timer, swap-exercise, target-muscle percentages
(Phase 7); saved meals, recipes, micronutrients (Phase 8); ranks and badges,
progress photos (Phase 9); chat AI and Health Connect (Phase 10).

**Ruled out, deliberately:**

- **AI Scan and Describe Your Meal** — the unbounded cost line in §12.11, and
  note their own UI hedges with "works best with unbranded foods". Barcode plus
  search covers it.
- **Meal icons** — too much work for the payoff.
- **Recipe import from URL** — needs a scraping Worker, a CSP `connect-src`
  entry, and it breaks on every site redesign.
- **Challenges, referrals, anything social** — inverts every RLS policy, see
  §12.11.
- Stripe subscription, help centre, live chat, native text size and
  battery-optimisation warnings. Not applicable.

**The layout lesson, separate from the features.** Their screens read as roomier
than mine, and the cause is spacing and type scale rather than layout: uppercase
muted section labels grouping rows without drawing another box, larger gaps
*between* cards, one idea per card, violent contrast between a tiny muted label
and a large number, and a ~44px rounded accent icon tile anchoring each row. All
of that is `index.css` work, not screen rewrites — Phase 6. What is **not**
worth copying is their habit of buying calm with extra taps; they can afford
more screens than this project can.

### 12.15 Exercise dataset audit — §18's decision 6, ANSWERED 2026-08-19

Carried as "unverified" since 2026-08-18. Ten minutes to close, as predicted.
The answer changes the scope of two Phase 7 features, both downward.

**Yes, the seed carries primary and secondary muscles, with no gaps.**
`src/data/seed/exercises.json` — 1,324 records, 840 KB, keys `id`, `name`,
`bodyPart`, `equipment`, `target`, `secondary`, `steps`.

- `target` is the primary muscle, one controlled string. **19 distinct values.**
  Zero records missing it.
- `secondary` is an array of 1–6 entries (753 records have 2, 338 have 1).
  **40 distinct values.** Zero records missing the key, zero with an empty array.

**The type is already plumbed end to end.** `SeedExercise.secondary: string[]`
in `exercises.ts` flows into `ExerciseOption.secondary`, and `allExercises()`
carries it for custom rows as well as seed rows. **No Dexie version block, no
migration, no sync change.** Nothing needs adding to make the data reachable.

**And the normalisation layer already exists.** This was the part expected to be
an afternoon of table-writing. `src/data/muscleGroups.ts` defines an 11-member
`MuscleGroup` union and a `MUSCLE_MAP` from raw dataset strings to it, with
`groupFor()` doing `.trim().toLowerCase()` and falling back to `'Other'`.

**Its "covers every value" comment was verified on 2026-08-19 and is true**:
the map has exactly 50 keys, the dataset has exactly 50 distinct muscle strings
(19 targets + 40 secondaries, 9 shared), and the two sets are an exact
bijection — nothing in the data is unmapped, nothing in the map is dead, and no
key needs case or whitespace normalisation to match.

**Why the map is necessary at all**, since it is not obvious from reading either
file alone: `target` and `secondary` **do not share a vocabulary**. They are
synonym sets, not the same enum.

| Concept | `target` says | `secondary` says |
|---|---|---|
| Quads | `quads` | `quadriceps` |
| Delts | `delts` | `shoulders` (400 uses), `deltoids`, `rear deltoids` |
| Lats | `lats` | `latissimus dorsi`, `lats` |
| Traps | `traps` | `trapezius`, `traps` |
| Abs | `abs` | `abdominals`, `core`, `lower abs`, `obliques` |
| Chest | `pectorals` | `chest`, `upper chest` |
| Upper back | `upper back` | `back`, `rhomboids` |

31 of the 40 secondary terms never appear as a target. **A heatmap that naively
unions `target` and `secondary` renders `shoulders` and `delts` as two separate
regions.** Always go through `groupFor()`.

**So: display job, not a data job.** The muscle heatmap needs an SVG body
diagram and an aggregation query. Smart exercise-swap has everything it needs
today — match on `groupFor(target)` plus `equipment`.

**Three decisions to take before building against it. None blocking.**

1. **`forearms` collapses into `Other`, and this is the one worth revisiting.**
   It is the third most common secondary in the dataset (277 mentions) and 37
   exercises target it directly, but `MuscleGroup` has no `Forearms` member. On
   a heatmap that means every grip-intensive pull lights up nothing. Adding it
   is a two-line change now and a wider one once the UI exists.
2. **`abductors` → `Glutes` but `adductors` → `Other`.** Almost certainly an
   oversight rather than a decision — a matched anatomical pair, 6 exercises
   each, split across two buckets. Will look wrong on a diagram.
3. **`MUSCLE_GROUPS` has 11 entries and one of them cannot be drawn.** Decide
   whether the heatmap ignores `Other` or shows a count beside the diagram —
   otherwise `cardiovascular system`, `forearms` and the noise tail
   (`grip muscles`, `shins`, `sternocleidomastoid`, all 1–2 uses) vanish with no
   explanation.

**⚠ One maintenance hazard, recorded because §14 already names this exact
pattern.** `MUSCLE_MAP` is a hand-maintained mirror of a file it does not
import, and its "covers every value" comment is a claim about code elsewhere —
*"a comment justifying a decision by reference to code elsewhere goes stale
silently"*. It is true today. It becomes false the moment the dataset is
extended or replaced, and **nothing will say so**: unmapped terms hit
`?? 'Other'` and produce a quietly wrong heatmap rather than an error. A
dev-only warning in `loadSeed()` logging any term that hits the fallback would
convert a silent bug into a console line. Cheap; belongs in whichever session
touches this next.

**Bonus finding, for §12.13 and Phase 1.** `bodyPart` has **10** distinct values
(`back`, `cardio`, `chest`, `lower arms`, `lower legs`, `neck`, `shoulders`,
`upper arms`, `upper legs`, `waist`) and `equipment` has **28**. So §18's
"translate the enum first, `nameDe` later" recommendation is **38 German
strings, not 1,324** — the cheap option is now quantified. Note that `cardio`
and `neck` do not map onto a body diagram cleanly either; worth settling
alongside decision 3 above.

### 12.16 Programs — scoped 2026-08-22 (2nd), DECIDED AND BUILT 2026-08-23

**Read this before touching §18's Phase 3.** Phase 3 was written on 2026-08-19
without reading any code, and it says so. This section is what the same idea
looks like after reading `types.ts`, `routines.ts`, `workouts.ts`,
`RoutineFormScreen.tsx`, `ActiveWorkoutScreen.tsx` and a real 12-week program
exported as JSON.

**⚠ The scoping below is preserved as written on 2026-08-22, because the
arguments still explain the shape. Every decision it left open was taken on
2026-08-23 and the data layer was built. Where the two disagree, the DECISIONS
block immediately below wins.**

---

#### The decisions, taken 2026-08-23

| # | Question | Answer |
|---|---|---|
| 9 | Weeks: column or table? | **Integer column** on `program_days`, plus `repeats` on the program |
| 9b | Is a week seven calendar days or an ordered list? | **Seven**, `dayIndex` 1–7, anchored on `programs.startedOn` |
| 10 | Blocks: modelled or flattened? | **Dropped entirely.** Program → Weeks → Days, nothing above |
| 11 | How does a workout link to its scheduled day? | **`workouts.programDayId`**, nullable, no FK, plus `startedOn` to disambiguate repeats |
| 12 | Rep ranges on `RoutineSet`? | **Yes, reference only.** `repsMin`/`repsMax`; a logged set keeps one number |
| 13 | The crown: session best or all-time PR? | **All-time PR**, per exercise, animating on tick |
| 14 | `Routine.notes` on the active workout? | **Read-only**, never copied into `Workout.notes` |

**Day 1 is the day the program is made active**, not Monday. Days are labelled
Day 1–Day 7 rather than by weekday, which keeps a program portable between two
people who start it on different days.

**A repeating program keeps climbing its week number while reading the same day
rows.** Week 5 of a four-week repeating program reads week 1. This is why
`programDayId` alone cannot say which occurrence a workout satisfied and why
`startedOn` had to exist: the cycle is derived from it plus `workouts.date`.

**A week's note lives in `programs.weekNotes`**, jsonb keyed by week number —
"Intro week", "Deload week", populated from an import when the JSON says so.
This was the one thing that nearly forced a `program_weeks` table, and jsonb on
the parent is the same answer 2026-08-17 gave.

**A non-repeating program that finishes its last week is marked complete and
offers a restart.** Not deactivated silently, not held on the last week.

**Warm-up reps come from the standard exercise-specific warm-up table**, taking
the bottom of each range for consistency with `repsMin`: 1 set → 6; 2 → 6, 4;
3 → 6, 4, 3; 4 → 6, 4, 3, 2. When an import specifies a *range* of warm-up sets
("2-4"), take the minimum. Above four listed, reuse the four-set pattern and pad
with 2s. **Warm-up weight is left empty** — the table's percentage column goes
unused, and is available later if computed warm-up weights are ever wanted,
since prefill-from-history already knows the planned working weight.

**⚠ The crown and the Records list will disagree, and this is deliberate.**
`recentPRs` in `workoutStats.ts` ranks by **Epley 1RM**; the crown ranks by
**weight, then reps, then first set**. So 105 × 3 earns a crown while
`recentPRs` still considers 100 × 12 the better set and will not list it. Same
weight with more reps agrees in both — the divergence only appears across
different weights. They answer genuinely different questions (*heaviest ever*
versus *best estimated max*) and **neither should be "fixed" to match the
other.** Bodyweight sets, having no weight, compare on reps alone. The very
first set of a new exercise does earn a crown; it is your best.

#### What was built on 2026-08-23

Everything below the UI line, and nothing above it.

- The migration (§8), applied and verified
- `Program` and `ProgramDay` in `types.ts`; `repsMin`/`repsMax` on `RoutineSet`;
  `programDayId` on `Workout`; `notes` on `WorkoutSet`
- Dexie `version(2)` with the two new stores (§6)
- `sync.ts`: two mappers, `weekNotes()`, `routineSets()` extended, both new
  fields mapped in each direction, `TABLES` extended
- `adopt.ts` and `backup.ts` extended — see the note below about why that
  mattered more than it looks
- `startWorkoutFromRoutine` prefilling `repsMin` and copying `ex.notes` to every
  set; `setNotesForExercise` in `workouts.ts`; range restoration in
  `diffWorkoutAgainstRoutine`

**`adopt.ts` and `backup.ts` are the two files a new table is easiest to forget,
and both would have failed silently.** `adopt.ts`'s `LOCAL_BY_SERVER` is a
hand-written map keyed by server table name — miss an entry and `keep-account`
leaves the previous account's programs on the device, invisible and unmergeable,
on the one path in the app that destroys local data. `backup.ts` lists its
tables literally, so a miss means every export from then on silently omits them,
which §13 already names as the one failure a safety net cannot have. **The dev
guard in `adopt.ts` catches the first case and nothing catches the second.**

#### What is NOT built, deliberately

No screen renders a program, creates one, or sets a rep range, and
`ActiveWorkoutScreen` has no notes area — so `WorkoutSet.notes` is written by
code and displayed by nothing. **These screens should be born translated**,
which puts them after Phase 1 merges. Building them now means retrofitting them,
which is the entire argument §12.13 rests on.

#### What was tested, and what was not

Tested on 2026-08-23, all on the dev server against a real account:

- Push and pull of both tables, with cursors cleared to force the pull half.
  `program_days` inserted without an FK violation, which is the push order
  working
- `week_notes` surviving as an object; `started_on` unshifted from UTC+1;
  `is_active` returning `false` rather than `undefined`
- Routine notes reaching every set of their exercise and no others
- `repsMin` prefilling as 6 where the old code produced 0 — tested on an
  exercise with **no history**, because `useTargets` goes false the moment
  `lastSetsFor` returns anything and the prefill would have read 0 for an
  unrelated and correct reason
- Range surviving a write-back: three routine sets kept `6–8` after being
  logged at 12, and a fourth set added beyond the routine's length correctly
  inherited no range

**Not tested: a second account pushing these tables.** §11's bug only bit when a
*second* account upserted the same UUIDs, and this device synced into its own.
The composite keys here are structurally identical to the twelve fixed in 1.9 —
but §13 is explicit that "structurally identical to something that works" is
reasoning, not evidence. **Do this before Programs reaches testers.**

---

#### The original scoping, 2026-08-22 (2nd)

What follows is the scoping as written, kept because the arguments still explain
why the model looks the way it does.

#### What is wanted, as stated

Folders go away and become **programs**. A program contains **weeks**; a week
contains **days**; a day is a workout (Push, Pull, Legs…) or a **rest day**.
Days are reorderable. Week 2 only opens once week 1 is finished, and any day
missed in week 1 is shown as missed. When a program is set **active**, it takes
over the Workouts → Log tab, showing the current week's days; with no active
program that tab is what it is today, a Start-empty-workout screen. A routine
created outside any program is **unclassified** and behaves exactly as routines
do now.

**Weeks are optional.** Someone running one PPL split forever creates three
workouts and some rest days and repeats them weekly. Someone running a
periodised block specifies week 1–3 one way and week 4–8 another. Both must work.

#### Three things the roadmap did not account for

1. **Weeks are a level Phase 3 does not have.** Phase 3 says "a program owns
   ordered days". That is one level short.
2. **The example JSON has a *fourth* level: `block`.** `The Min-Max Program` is
   12 weeks, each tagged `block_1`, `block_2`… So in the wild the hierarchy is
   program → block → week → day → exercise. Whether Upkeep models blocks or
   flattens them is an open decision; flattening loses nothing structural, only
   a label.
3. **Nothing links a logged workout to a scheduled day.** `workouts.routineId`
   exists but has **no foreign key** (§8, deliberate) and says only "this came
   from that routine" — not *which occurrence*. Gated progression and missed-day
   detection both need to know that this Tuesday's Pull 1 satisfied week 2 day 2.
   Running the same routine twice in a week is legal and common, so `routineId`
   plus a date cannot answer it reliably. **This is the single most expensive
   item in the phase and it was invisible until the files were read.**

#### The schema recommendation, and the argument for it

**Do not create a `program_weeks` table.** Put `week` as an **integer column on
`program_days`**, and a `repeats` boolean on the program. A week-less repeating
program is then just every day at `week = 1` with `repeats = true`, and a
periodised one uses `week = 1..12`. No third table.

The argument is §8's own list: every new table costs a composite primary key, an
RLS policy, a composite foreign key, a correct position in the `TABLES` push
order, a sync cursor and a Dexie version block — **five places this project has
already been bitten**, and §11 is a whole section about getting one of them
wrong. A column costs none of them. The same reasoning already produced
`routine_exercises.sets` as `jsonb` rather than a `routine_sets` table on
2026-08-17, and that decision has held.

So the minimum shape is **two** new tables, not three:

- `programs` — id, name, notes, `repeats`, `isActive`, sortOrder, timestamps
- `program_days` — id, `programId`, `week` (int), `dayIndex` (int), `routineId`
  (nullable — null means a rest day), timestamps

Plus, on the existing `workouts` table, **one nullable column linking a logged
workout to the day it satisfied**. Additive and nullable, so an older client
keeps working (§8). Non-indexed locally means **no Dexie version block** for
that column, but the two new tables need one regardless.

**`routines` keeps `folder` for now.** A program is an *optional parent*, as
Phase 3 already insists. Deprecating folders is a separate change and §18's
conflict 14 already says so.

#### The JSON import, and why the format cannot be designed yet

An example was supplied: `min_max_program_12_weeks.json`, 12 weeks × 5 workouts,
one row per exercise. **It is not the intended format** — that gets designed
once the model is settled — but it is a real export of a real program and it is
useful precisely because it shows the import is a *model-gap* job, not a parsing
job. Five of its fields have nowhere to go today:

| JSON field | Example | Current model |
|---|---|---|
| `rep_range` | `"6-8"` | `RoutineSet.reps?: number` — a single value |
| `warm_up_sets` | `"2-4"` | a count, not a range |
| `set_1_rir` | `2` | RPE exists, RIR does not (convertible: RPE ≈ 10 − RIR) |
| `rest` | `"3-5 min"` | `restSeconds: number` |
| `substitution_option_1/2` | `"DB Incline Press"` | nothing |

`notes` is the one field that already has a home — `RoutineExercise.notes`,
shipped in 2.1 — and see the bug below about it never being displayed.

**Substitutions are the interesting one**, because they are the same feature as
§18 Phase 7's swap-exercise arriving from a different direction: the import
needs to offer a swap *before saving*, and Phase 7 needs one *mid-workout*.
§12.15 confirmed swap needs no new data — match on `groupFor(target)` plus
`equipment` — but an imported program carries the *author's* named alternatives,
which are better than anything computed. Worth building the two together so the
UI is one thing.

~~**Ranges are the decision that gates the format.**~~ **ANSWERED 2026-08-23,
and the cost estimate here was wrong.** `RoutineSet` grew `repsMin`/`repsMax`,
and it was **not** a real shape change: `RoutineSet` lives inside
`routine_exercises.sets` as jsonb, so it needed no migration and no Dexie block
— only a `routineSets()` coercion. The prefill and `diffWorkoutAgainstRoutine`
were both touched and are done; only the routine editor remains, with the rest
of the UI. So the format is no longer gated on this.

**`set_1_rir` still converts as predicted** (RPE ≈ 10 − RIR) and `rest` still
needs flattening from `"3-5 min"` to a number. **`warm_up_sets` is answered
too**: take the minimum of a range, and the rep counts come from the standard
warm-up table recorded in the decisions block above.

#### A bug found while scoping: routine notes never reach a workout — FIXED 2026-08-23

**Reported as "the notes you add when creating a routine don't show up when you
start a workout from it". Confirmed, and it is a schema gap rather than a
missing line.**

**FIXED.** `WorkoutSet.notes` exists, `startWorkoutFromRoutine` writes
`ex.notes` to every set, `setNotesForExercise` rewrites it, and the write path
is verified. **It still does not display** — `ActiveWorkoutScreen` has no notes
area, and that is the UI half waiting on Phase 1. The diagnosis below was
correct in every particular.

- **`WorkoutSet` has no `notes` field** (`types.ts`). So `RoutineExercise.notes`
  has nowhere to land.
- `startWorkoutFromRoutine` in `routines.ts` copies `sets`, `restSeconds`, `rpe`
  and `order`, and never touches `ex.notes` or `routine.notes` — because there
  is no target to copy them into.
- `ExerciseBlock` in `ActiveWorkoutScreen` renders no notes area either.

**The fix follows a pattern this codebase has already used twice:** write it to
every set, read it from the first, exactly as `restSeconds` and `rpe` do
(§5). `WorkoutSet.notes` is non-indexed, so per §6 it needs **no Dexie version
block** — but it does need a nullable Postgres column and a `sync.ts` mapping,
which makes it a migration. **Batch it with Programs' migration rather than
doing two.**

`Routine.notes` → `Workout.notes` is a *separate* question and needs deciding:
`Workout.notes` is currently session notes written at finish, so prefilling it
would copy the routine's note into every workout's history, where editing one
would not update the other. **Recommendation: show the routine note read-only at
the top of the active workout screen rather than copying it.** Not taken.

#### The crown — both questions below ANSWERED 2026-08-23

**Scope: all-time PR, not session best. Tiebreak: weight, then reps, then first
set.** See the decisions block at the top of this section. What follows is the
original framing.

Wanted: a small crown next to the set of an exercise with the highest weight —
or highest reps if the weight ties — appearing when the set is ticked, and shown
in history too. If all sets tie, the first one gets it.

**It costs zero schema, which is the right instinct** and the same condition
§18's Phase 9 puts on ranks and badges: derive it from `workoutSets`, never
store it. Two things need settling before it is built:

1. **Scope.** Best set *in this session*, or an all-time PR for that exercise?
   The description reads like the first; wanting it in history too reads like
   the second. The first is a cheap reduce over sets already on screen; the
   second needs a history query per exercise and overlaps the existing PR list.
2. **The stated tiebreak has a gap.** "Highest weight, or highest reps if the
   weight is the same" gives no winner between 100kg × 5 and 80kg × 12. Fine if
   the crown is per-exercise-per-session, where weights usually match; it still
   needs writing down.

#### Also wanted, and already on the roadmap

The floating rest-timer bar and moving Add-exercise left of discard/finish are
both §18 Phase 7, item 1 and item 2, recorded on 2026-08-19 for the same
reasons given now. No change; they are just confirmed as still wanted.

#### One stated goal with no detail yet

**"Making working out like a game."** Recorded here so it is not lost. It is
adjacent to Phase 9's ranks and badges, and §18's closing note already flags
gamification as one of three places this project could drift into being a
worse-funded version of the app in the screenshots. Ask for the detail before
building anything against it.

### 12.17 The reordering — workouts before the rest of Phase 1 (2026-08-23, 2nd)

**Taken at the end of the meals block. The workout section is to be finished
completely — every screen, all the Programs UI — before the remaining
translation work.** The stated reason is the right one and is worth quoting
plainly: the app is to be *used*, and the workout section is the part that is
not yet the way its owner wants it.

**This overrides §18's first non-negotiable ordering, knowingly.** §12.13 and
§18's conflict 1 both argue i18n goes first because every phase adds screens and
retrofitting compounds. That argument is still correct. It was set against a
thing it never weighed: an unfinished app that its only daily user cannot use
the way they want. Those are not the same kind of cost and the second one is
being paid every day.

**What it costs, stated honestly so nobody re-derives it as an oversight:**
roughly ten new Programs screens, plus a rebuilt workout section, all written
untranslated and retrofitted later. §12.16 explicitly deferred those screens so
they would be **born translated**; that deferral is now reversed.

**The mitigation, and it makes the cost close to zero if it is followed.** The
workout section is *simultaneously* the largest remaining i18n block and the
thing being rebuilt. Touching every one of those screens twice — once to rebuild,
once to translate — is strictly more work than touching them once. **So: do the
workout work on `phase-1-i18n`, and write every new and rebuilt screen with
`t()` from the start.** Born translated, as originally intended, just arriving
in a different order. The conventions are all in §5 and the helpers all exist.

**The consequence to plan for:** to be usable day to day the work has to reach
`main`, and `main` has no i18n at all. Merging the branch means shipping an app
where meals, auth and navigation are translated and body, care routines and
About are not. **That is a real decision and it has not been taken.** Two
shapes:

1. **Finish body, care routines and About first** — five or six small screens,
   probably one short session — then merge everything and the app is
   end-to-end translated when Programs lands. Costs one session up front.
2. **Merge partially translated**, accepting that a German user switching
   language sees English in three places until they are done. §12.13 calls a
   half-translated switch "reads as broken"; the question is whether that still
   holds when the untranslated remainder is small and known.

**Recommendation: option 1.** The remaining sections are small, the branch is
already the place the work is happening, and it removes the only argument
against merging. But it is a session's delay and the priority is explicitly
speed to a usable app, so it is the owner's call.

**Nothing about the Programs data layer changes.** §12.16's seven decisions
stand, the migration is applied, and the fields written by nothing are still
waiting for exactly these screens. **Read §12.16 before the first line of
Programs UI and do not re-derive any of it.**

#### ⚠ The scoping conversation has NOT happened yet — start the next session here

The session ended before the workout section was described. **"Remodify the
workout section to the way I want" is broader than §12.16's Programs decisions,
and what that means has not been written down anywhere.** §17's standing advice
applies with force: ask first, and expect the answer to be more current than
anything in this document.

**Ask these, and expect the list in my head to be longer than the list here:**

1. **What is wrong with it today?** The thing noticed on every single use. This
   question produced §12.10, §12.11 and §12.14, and it has been the highest-value
   question in three separate sessions.
2. **What does the Workouts → Log tab become when a program is active**, and
   what when there is none? §12.16's scoping says an active program "takes over"
   that tab and that a program-less state stays as it is today — confirm that is
   still wanted before building two modes.
3. **How does a program get created?** Built day by day in an editor, imported
   from JSON, started from a predone seed, or all three. §18's Phase 3 lists all
   three; which one is built *first* has not been decided, and it decides the
   shape of the first screen.
4. **Which Phase 7 items belong in this pass:** the floating rest-timer bar, the
   crown (decided, zero schema, ready to build), swap-exercise, the
   target-muscle breakdown, moving Add-exercise left of discard/finish,
   time-based exercises. All are wanted; none is scheduled against the others.
5. **What "making working out like a game" means** — recorded at the foot of
   §12.16 with no detail and explicitly flagged as needing detail before
   anything is built against it.
6. **Anything not written down at all.**

**Two decisions are already known to be waiting inside this work**, and neither
needs re-deriving, only taking:

- **Time-based exercises** need "what does volume mean for a plank" answered
  before any code (§12.10). `workoutVolume`, `lastSetsFor` and the progress
  charts all assume weight × reps.
- **The `Routine.notes` display** — §12.16 decided read-only at the top of the
  active workout screen rather than copied into `Workout.notes`, and
  `ActiveWorkoutScreen` still has no notes area. `WorkoutSet.notes` is written
  by code and rendered by nothing (§13).

**Files to read before scoping anything** — do not estimate from this document
(§1): `ActiveWorkoutScreen.tsx`, `RoutineListScreen.tsx`, `RoutineFormScreen.tsx`,
`WorkoutHistoryScreen.tsx`, `WorkoutDetailScreen.tsx`, `WorkoutProgressScreen.tsx`,
`FinishWorkoutScreen.tsx`, `routines.ts`, `workouts.ts`, `workoutStats.ts`,
`types.ts`.

**And the section needs real plural work** — "3 sets", "12 reps",
"2 exercises". `plural()` exists and was used in anger for the first time in
`ChartsScreen`. Use it rather than adding more `n === 1 ? …` ternaries, of which
these screens already carry several.

### 12.18 The workout scoping conversation, answered (2026-08-24)

**Answers to the six questions §12.16 and §12.17 both left open. Read this
before opening any file for the workout rebuild — it is the current scope, not
§12.16's original list.**

**1. What's wrong today.** No notable bugs found. What's wanted is the feature
list already sitting in §12.16 and §18 Phase 7 — nothing new, nothing stale to
strike. Confirmed against the example JSON at
`docs/examples/min_max_program_12_weeks.json` (gitignored, read from disk this
session): 12 weeks in two blocks of six, five workouts per week, no rest-day
rows in the file itself. Matches §12.16's model exactly — the `block` label is
still dropped, nothing else about that decision changes.

**2. Workouts → Log tab, program active vs not.**
- **Active:** shows only that program's days for the current week and their
  workouts. No routine list. Tapping the program name **deactivates** it
  (`isActive: false`) and drops back to the no-program Log screen — it does
  **not** delete the program. Deletion happens from the routines/programs list
  screen, the same place routines are deleted today.
- **No active program:** unchanged from today, except **"Start new workout" now
  asks first** — choose a program, or one of the general saved routines.

**3. Program creation.** Both paths wanted. **JSON import is built first**,
the manual editor second.
- **JSON import** — upload a file shaped like the Min-Max example, the program
  builds automatically. Maps through §12.16's field-gap table (`rep_range` →
  `repsMin`/`repsMax`, `warm_up_sets` → minimum of the range, `set_N_rir` → RPE
  via 10 − RIR, `rest` → flattened to a number, `notes` →
  `RoutineExercise.notes`). **Substitution options are not dropped** — see
  decision 4.
- **Manual editor** — choose weeks and days, assign a workout to each day, with
  a "copy this day to other days/weeks" shortcut for reuse. A "repeat this week
  indefinitely" toggle covers a single static split — this is `programs.repeats`,
  already built in §12.16.

**4. Scope for this pass — reversed once mid-conversation; this is the version
that stands.**
- **In:** JSON import, the manual program editor, **substitutions +
  swap-exercise built together with the program architecture, not deferred**
  (explicitly reversed from an earlier answer in the same conversation — the
  reasoning given was that building it once alongside the data model beats
  separating it out later), the crown, Add-exercise moved left of
  discard/finish, routine-notes display on the active workout screen, the
  floating rest-timer bar.
- **Out, backlog for later:** target-muscle breakdown, time-based exercises
  (planks/holds — still blocked on "what does volume mean", §12.16/§12.10).

**5. Gamification.** Deferred, comes "very later." Spec lives in
`docs/workout_meal_gamification_architecture.md` (not read in detail this
session — out of scope for this pass). When it is picked up: visually
pleasing, rank names at certain levels, icons/images. **Do not build anything
toward this now.**

**6. Anything else.** Nothing further — confirmed with no additional items.

**Note on session shape.** Explicit instruction: split this phase into as many
sessions/chunks as needed for token efficiency. This is what §19's "one chunk
at a time, build and confirm before starting the next" already calls for — the
upcoming plan should lean toward more, smaller chunks rather than fewer, large
ones.

**Not yet decided:** the build order of the six in-scope items, and the
screen-by-screen file plan. That is the next conversation, not this one.

### 12.19 The build plan, and Chunk 1 — done (2026-08-24, 2nd)

**A four-chunk plan was written and approved for §12.18's scope.** The full
plan, with its worked design decisions, is also saved locally at
`C:\Users\aswin\.claude\plans\async-mixing-gray.md` — but treat that file as
disposable; everything load-bearing is repeated here so this section alone is
enough to resume from.

**⚠ Start the next session by reading this section, then jump straight to
Chunk 3 below — Chunks 1 and 2 are done, committed and pushed to
`phase-1-i18n`. Do not re-scope, do not redo either.**

- Chunk 1: `3ffe75a feat: programs data layer, JSON import, swap-exercise, and the PR crown`
- Chunk 2: `dbc29cf` (import screen), `0f134e0` (manual editor), `4507142`
  (routines-screen integration) — see "Chunk 2 — done" below.

#### Design decisions taken while planning — do not re-derive

1. **Import creates one Routine per distinct workout CONTENT, not one per
   week.** A week's workout is diffed against the last Routine minted for
   that workout name; identical content reuses it, changed content mints a
   new one. Verified on the real file: 12 weeks × 5 workouts produced **20
   routines** (4 content-variants per workout), not the 2 a first read of the
   file suggested — RIR progresses within each 6-week block, not only at the
   block boundary, so content changes more often than just the block switch.
2. **`last_set_intensity_technique` has no field of its own** (not in §12.16's
   field-gap table). Where present and not `N/A`, it's appended into that
   `RoutineExercise.notes`.
3. **Substitutions: `RoutineExercise.substitutes?: string[]`** (exercise
   keys), synced as jsonb on `routine_exercises`
   (`2026-08-24-substitutes.sql`, applied locally **and to the live
   Supabase project** — verified via `information_schema.columns` and a
   count of the 39 existing rows, none left `null`). Import resolves
   `substitution_option_1/2` against the library by fuzzy score; unmatched
   names are dropped.
4. **Swap mid-workout renames `exerciseKey`/`exerciseName` across every
   `WorkoutSet` row for that exercise** and zeroes weight/reps/completed.
   `swapExerciseInWorkout()` in `workouts.ts`. No special case needed in
   `diffWorkoutAgainstRoutine` — it already reads this as "removed X, added Y".
5. **The no-active-program Log screen's routine list becomes one "Start new
   workout" action**, opening a chooser: your programs, then routines, then
   "Start empty workout" — replacing today's flat per-routine button list.
   Picking a program activates it and the screen becomes the active-program
   view.
6. **Programs are managed on the existing `/workouts/routines` screen**, not
   a new tab — confirmed by the answer to Q2 in §12.18 ("removing from
   routine tab is what removes it").

#### Chunk 1 — data layer only, no UI — DONE, committed, not yet pushed to verify on a device

Built: `src/data/programs.ts` (new — CRUD, single-active enforcement,
`currentWeekNumber`/`scheduleWeekFor`/`currentDayIndex`/`todaysProgramDay`,
reconcile-by-`(week,dayIndex)` `setProgramDays`), `src/data/programImport.ts`
(new — pure `parseImportJson`/`buildProgram` plus the async
database-touching `importProgram`), `RoutineExercise.substitutes` end to end
(`types.ts`, `sync.ts`, the new migration), `swapExerciseInWorkout` in
`workouts.ts`, `isAllTimePR` (the crown check) in `workoutStats.ts`,
`suggestSubstitutes` in `exercises.ts`.

**Tested by hand against the dev server**, not just `npm run build`: program
CRUD, single-active enforcement (activating one deactivates the other),
`setProgramDays` reconcile-and-delete, cascade soft-delete on
`deleteProgram`, the week/day math against a synthetic 10-days-ago
`startedOn` (week 2, day 4 — correct), `scheduleWeekFor`'s repeat-wrap
(climbing week 5 against a 1-week repeating program reads week 1 — correct),
and a **full import of the real `docs/examples/min_max_program_12_weeks.json`**
through `importProgram` end to end.

**A real finding from that last test, not a guess:** exercise-name matching
against the 1,324-exercise seed is weaker than assumed. "Pec Deck", "Kelso
Shrug" and "Incline DB Y-Raise" matched nothing at all; "Barbell Incline
Press" scored 275 against "Barbell Incline Bench Press" with a 300 threshold
— just under. The custom-exercise fallback (bodyPart/equipment/target
`'other'`) handled every miss safely and nothing broke, but **the Chunk 2
import preview must show which primary exercises fell back to a custom
placeholder**, not only which substitution names were dropped, so a person
can fix a mismatch by hand before confirming. `MATCH_THRESHOLD` (300, in
`programImport.ts`) was deliberately left as-is rather than lowered — a
lower threshold's other failure mode showed up in the same test:
"Dragon Flag" scores 400 against a seed exercise literally named "Flag",
which is exactly the kind of false positive a looser threshold invites.

**Not tested:** the UI (none exists yet — that's Chunks 2–4).

**A new trap, worth §11: the Supabase CLI's direct-connection host is
IPv6-only** (`db.<ref>.supabase.co` resolves only to an AAAA record — no A
record at all), and this machine has no outbound IPv6 route. `npx supabase
db query --db-url "postgresql://postgres:...@db.<ref>.supabase.co:5432/..."`
fails with `hostname resolving error (getaddrinfo ENOTFOUND)`, and
`--dns-resolver https` doesn't fix it — DoH still can't hand back a usable
IP. **Use the Session pooler connection string instead**
(`postgresql://postgres.<ref>:...@aws-0-<region>.pooler.supabase.com:5432/postgres`,
from the same Settings → Database page), which is IPv4-reachable. **Also**:
`supabase db query -f <file>` rejects a file with more than one statement —
`cannot insert multiple commands into a prepared statement` — even a plain
`begin; …; commit;` wrapper. Every migration file in this repo is written
with that wrapper for running by hand in the SQL Editor (where it's fine);
run via the CLI, strip it and pass the single DDL statement as the `sql`
argument instead. This migration was applied that way, by Claude Code
directly against the live project with an explicitly-given DB password —
**a deliberate one-off exception to §9's "run by hand" convention**, done at
the owner's explicit request, not a new standing practice.

#### Chunk 2 — program creation & management UI — DONE, committed, pushed

Split into three sub-chunks, each built (`npm run build`) and hand-tested
through the actual dev-server UI (via Claude in Chrome, not just the
console) before moving to the next — the pattern §12.18's closing note
asked for.

**2a — `ProgramImportScreen.tsx`** (`dbc29cf`), built first per §12.18's
order. Route `/workouts/programs/import`. `programImport.ts` gained a
read-only `previewImport()` (shares a new `collectExerciseNames()` helper
with `importProgram()`) so the screen shows which primary exercises will
fall back to a custom placeholder and which substitution names will be
dropped **before** anything is written — the exact gap Chunk 1's real-file
test found. All of `parseImportJson`'s thrown messages and `buildProgram`'s
warnings were converted to `t()` in the same pass, since this was their
first-ever appearance in a screen. **Verified against the real 12-week
reference file through the screen**: the same unmatched names and the
Dragon-Flag→Flag false positive Chunk 1 found by hand reproduced in the
preview; confirming produced 20 content-variant routines with no console
errors.

**2c — `ProgramFormScreen.tsx`** (`0f134e0`), built before 2b so the "New
program" entry point in 2b would have both destinations to link to. Routes
`/workouts/programs/new` and `/workouts/programs/:id/edit`. Weeks are cards
of 7 day slots; tapping a day opens an `OptionSheet` to assign a routine or
rest, plus a "copy this day to…" action that opens a multi-select week×day
chip picker (reusing the existing `.chip`/`.chip.active` classes). "Repeat
indefinitely" is `Program.repeats`, one toggle, not per-week. Edit
reconstructs weeks/days from `getProgramDays` via `definedWeekCount`.
**Verified by hand**: created a 2-week program, assigned a routine to Day 1,
copied it to Days 3 and 5, toggled repeat, saved — `db.programs`/
`db.programDays` held exactly that shape. Editing reloaded the same state.
Delete cascaded to the program and all 14 day rows. No console errors.

**2b — `RoutineListScreen.tsx`** (`4507142`) — a "Programs" section above
the folder groups: name, Active/Inactive (`.success` text class, not an
inline color — CLAUDE.md bans those), activate/deactivate/edit/delete via a
kebab `OptionSheet`, and a "New program" `OptionSheet` offering the 2a/2c
routes. **This file had zero i18n before this touch**, so every existing
string — folder moves, the routine kebab menu, exercise counts (now
`plural('routines.exerciseCount')`), the empty states — was converted to
`t()` in the same pass rather than left for later, per the born-translated
mitigation (§12.17). **Verified**: activate/deactivate, both "New program"
destinations, and delete (with its confirm dialog) all round-tripped
against Dexie. **Re-verified in German through the real Settings language
switch** — every string, including the plural and empty-state ones,
rendered correctly. (A first attempt forced the language from the browser
console via a raw `await import('/src/data/i18n.ts')`, which silently hit a
*separate* module instance and did nothing — same family of trap as §11's
Vite-transform-cache one, just via dynamic import in a devtools context
rather than a stale build. The real UI control is the reliable way to test
a language switch; a console-forced one is not.)

New shared keys added: `common.delete`, `common.loading` — reusable outside
the programs/routines namespace, so anything touching a delete button or a
loading state next should use these rather than inventing another pair.

Precache **2,536.89 KiB**, up from 2,511.90 (Chunk 1) — see §3/§4.

#### Chunk 3 — Log tab rebuild — DONE, committed, pushed

Split into two sub-chunks, each built and hand-tested through the actual
dev-server UI (via Claude in Chrome) before moving to the next.

**3a — no-workout state fork** (`1ac2320`). `ActiveWorkoutScreen.tsx`'s
"no workout" branch now checks `activeProgram()`: with none active, a single
"Start new workout" button opens an `OptionSheet` chooser — programs, then
routines, then "Start empty workout" (decision 5), and picking a program
calls `activateProgram()` and the live query flips the screen to the other
view. With one active: today's week/day via `currentWeekNumber` and
`todaysProgramDay`, tap-name-to-deactivate (no confirm dialog — matches the
precedent already in `RoutineListScreen`'s kebab menu), and three states —
a Start button for today's routine (stamping `programDayId`), a
"nothing scheduled" message for a rest day or an undefined day, and
"program complete" once `isProgramComplete()` is true. New `activeWorkout.*`
catalogue keys, written with `t()` from the start. A pre-existing `t` shadow
in the set-type `OptionSheet` map (`(t) => ...`) was found and fixed while
grepping per §5/§17's standing check, before it could bite later. **Verified
against the real dev-server UI**: created a program through the manual
editor, activated it from the chooser, confirmed the started workout's
`programDayId` via a console read, and forced `startedOn` back via console
to exercise the rest-day and program-complete branches — all three render
correctly in German.

**3b — sticky bar, notes block, floating rest bar, crown** (`ea1834a`).
Add-exercise moved out of the floating `Fab` into `.workout-sticky`, left of
Discard/Finish — the `Fab` import is gone from this screen. A read-only
notes block appears at the top of the workout, sourced from
`sets[0]?.notes` — the first exercise's carried-over per-exercise note,
since `Routine.notes` itself still isn't copied anywhere (that stays an
open item, see below). The rest timer moved from an inline per-exercise-card
display into a new floating `.rest-bar` (fixed position, the slot the `Fab`
used to occupy) visible regardless of which exercise is scrolled into view;
each exercise card's rest row now always shows the "set duration" button.
The crown: `isAllTimePR` is checked (via `getAllSets`) right after a set is
ticked complete, excluding the set's own prior value; a true result flashes
the check button gold with a `Crown` icon for 2.5s — the same flash-and-clear
idiom `SetRow` already used for the missing-reps warning, not a persistent
badge. `rest.ts`'s `REST_OPTIONS` (a module-level array holding the
untranslated `'Off'` label) converted to `restOptions()`, a function,
matching `rpe.ts`'s `rpeOptions()` — this also fixed the same latent bug in
`RoutineFormScreen.tsx`, which imports it too.

**A real bug found by testing, not by inspection**: discarding a workout
while its rest timer was running left the timer's local React state alive.
Invisible under the old per-exercise-card display (no card, no render) but
the new workout-level floating bar rendered it unconditionally, so the
*next* workout — including a brand new empty one — inherited a stale,
ticking countdown with working +15s/Skip controls attached to nothing.
Fixed with an effect that clears `timer` whenever `workout?.id` changes.
**Verified**: reproduced the bug in-session (ticked a set, started its
timer, discarded the workout, started a fresh empty one — stale bar
appeared), then confirmed the fix with the same sequence. The crown was
confirmed via a scripted click + immediate DOM poll (`check-btn active
crown` with the Crown SVG), since the 2.5s flash kept racing the
screenshot tool. No console errors; all strings verified in German.

**Not done, deliberately out of scope for Chunk 3**: `SET_TYPES`, the
set-type sheet, `Target RPE: …`, and the other strings in this file chunks
3a/3b didn't touch — left for Chunk 4's sweep, as originally planned.

**A pre-existing, app-wide finding, unrelated to any chunk**: no screen
anywhere in the codebase ever passes `cancelLabel` to `useConfirm()`, so
every confirm dialog's Cancel button falls back to `DialogProvider.tsx`'s
hardcoded English `'Cancel'` — including in screens translated weeks before
Programs existed (`SettingsScreen.tsx`, `AccountScreen.tsx`). Confirmed by
grepping the whole `src/` tree. Cheap to fix (default `cancelLabel` to
`t('common.cancel')` in one place) but deliberately left alone this
session — it's shared infrastructure, not workout-rebuild scope.

Precache **2,542.20 KiB**, up from 2,536.89 (Chunk 2).

#### Chunk 4 — swap-exercise, substitutions editor, final sweep — DONE, committed, not yet pushed

**Correction to this section's own plan, caught before writing code:**
§12.19 and the saved plan both said the substitutes picker goes on
"`RoutineFormScreen.tsx` and `ProgramFormScreen.tsx`'s exercise cards."
`ProgramFormScreen.tsx` has no exercise cards — it only assigns a routine
(or rest) to each day of a program; `RoutineExercise.substitutes` belongs to
an exercise inside a routine, which only `RoutineFormScreen` edits. Flagged
to the owner, who confirmed: substitutes picker on `RoutineFormScreen.tsx`
only. **`ProgramFormScreen.tsx` was not touched this chunk.**

Split into four sub-chunks, each built and hand-tested through the actual
dev-server UI (via Claude in Chrome) before moving to the next, same
discipline as chunks 2–3.

**4a — `ActiveWorkoutScreen.tsx`** (`49b5c73`). "Swap exercise" added to the
exercise `OptionSheet`: the routine's stored `substitutes` first (resolved
via `workout.routineId` → `getRoutineExercises`, matched against the
exercise's *current* key — after a swap this naturally stops matching,
since the routine's own record still points at the original exercise, which
is correct: the routine wasn't edited, only this one workout was), then
`suggestSubstitutes()`, deduped and capped at 8, then a "Search all
exercises…" option that lifts a new `swapTarget` state to the top-level
component and renders `ExercisePicker` full-screen — the same pattern the
existing add-exercise `picking` state already used. Calls
`swapExerciseInWorkout`. Same pass, finished the i18n sweep chunk 3 left
this file with: `SET_TYPES` converted to a `setTypeOptions()` function (the
usual module-level-const trap), column headers, aria-labels, the
remove-exercise confirm dialog, "Add set {n}", the set-type sheet. **A
string chunk 3's sweep missed was caught by testing, not by inspection**:
the "0/3 done" exercise-progress line was still a raw template literal;
found by switching to German mid-session and seeing untranslated English,
fixed and reverified in the same pass. New `activeWorkout.*` and shared
`setType.*` keys.

**4b — `RoutineFormScreen.tsx`** (`8c63532`). This file had zero `t()` calls
before this touch — full translation pass, same treatment
`RoutineListScreen` got in Chunk 2b. Added a substitutes picker to
`ExerciseCard`: up to `MAX_SUBSTITUTES` (2) chips, each removable, plus an
"Add substitute" chip that lifts a `substituteTarget: number | null` state
to the top-level component (same lift-to-parent pattern as 4a's swap
search) and opens `ExercisePicker`; picking excludes the exercise's own key
and existing duplicates. Feeds `RoutineExercise.substitutes` through
`setRoutineExercises` exactly as Chunk 1's `substitutes?: string[]` field
was built to take. New `routines.form.*` keys; reused `activeWorkout.col*`,
`activeWorkout.hintReps`, `activeWorkout.setRestTimer/setTargetRpe/
removeExercise/restTimerTitle/targetRpeTitle/setTypeTitle/removeSet/
removeExerciseTitle/removeConfirm/targetRpeRow/restTimer` and
`routines.optionsFor` rather than minting near-duplicate synonyms, since
this file's table/sheet shapes are identical to `ActiveWorkoutScreen`'s. A
second `SET_TYPES.map((t) => …)` shadow was found and renamed (`st`) before
adding the `t` import — same trap as 3a's `BarcodeScanner.tsx` one, caught
this time by grepping first rather than by a silent wrong-render. Verified
live: added an exercise, added 2 substitutes (chip cap respected, third
slot hidden), saved, reloaded the edit screen and both resolved names came
back correctly, removed one, deleted the routine — all round-tripped
through Dexie with no console errors, in both languages.

**4c — `ExercisePicker.tsx`** (`9bdb796`). Last untranslated shared
component in the section — used by add-exercise, 4a's swap-search fallback,
and 4b's substitute-search. `BODY_PART_CHIPS` converted from a module-level
const to a `bodyPartChips()` function. **A near-miss caught before
committing**: the first draft memoized the chip list with
`useMemo(bodyPartChips, [])` — an empty dependency array means React
computes it once and never again, so a language switch would leave the
chips frozen in whichever language was active on first mount even though
the rest of the app re-renders fine (App.tsx's single `useLanguage()` call
cascades a re-render down, but a `useMemo([])` inside a child ignores that
re-render for its own memoized value). Fixed by calling `bodyPartChips()`
plain, un-memoized, same pattern as `rpeOptions()`/`restOptions()` — the
established convention for exactly this reason. Verified live: chip filter
("Brust" → pectorals-only results) still works after the fix, in German.

**Full-sweep verification, run this session:**
`grep -rn 'forEach((t)' src/features/workouts src/data/programs.ts
src/data/programImport.ts` — clean. `grep -rn '<<<<<<<\|>>>>>>>' src/` —
clean. `grep -rn 'type="number"' src/` — only the `NumberField.tsx`/
`ActiveWorkoutScreen.tsx` comments and `WorkoutProgressScreen.tsx`'s
Recharts `<XAxis type="number" hide />`, exactly as CLAUDE.md's rule
expects. **A broader `t`-shadow grep turned up two dormant landmines,
neither touched this chunk and neither live bugs yet**:
`ExerciseDetailScreen.tsx:75` (`TABS.map((t) => …)`) and
`WorkoutDetailScreen.tsx:207` (`SET_TYPES.map((t) => …)`) — both shadow a
`t` that doesn't exist yet because neither file imports `i18n.ts`'s `t`
today. Harmless until whoever translates those two files adds the import
without renaming the loop variable first; worth a grep-first check at that
point, same as this session did for `RoutineFormScreen.tsx`.

Precache **2,551.48 KiB**, up from 2,542.20 (Chunk 3) — the four sub-chunks
moved it in steps of roughly +4, +4, +1 KiB, all new locale keys and logic,
nothing unexpected.

**Not tested this chunk, same gap as before**: second-account program sync
(§12.16, §13) — `programs`/`program_days` have still never been pushed by a
second account. Unrelated to Chunk 4's own work (swap/substitutes touch
`routine_exercises`, not the Programs tables) but flagged again here since
§12.19 asked this section to say explicitly whether it had been covered
yet. It has not.

**The four-chunk workout-rebuild arc from §12.19 is now complete**: data
layer, program creation/management UI, the Log tab rebuild, and
swap-exercise/substitutes/final sweep. What's still outside this arc,
deliberately (§12.18): target-muscle breakdown, time-based exercises,
gamification, and — newly explicit from this chunk — `ProgramFormScreen.tsx`
carries no substitutes UI, correctly, since it has no exercise-level
editing surface at all.

**Out of scope for all four chunks, deliberately (§12.18):** target-muscle
breakdown, time-based exercises, gamification.

---

## 13. Known issues and gaps

### Sync

- **Verified on my phone 2026-08-10.** Against the real account on the 1.9
  production build: insert, update against the composite PK (same `id`, one row,
  name changed), tombstone push, pull, both rescoped unique indexes, and the
  composite foreign keys under `care_step_done`. Nothing diverged. Note what
  this did *not* test — the phone syncs into its own account, and the §11 bug
  only bit when a *second* account upserted the same UUIDs. It was a regression
  test of twelve rebuilt keys, not a test of the fix.
- **⚠ `programs` and `program_days` have never been pushed by a second account.**
  Added 2026-08-23 and round-tripped thoroughly — but into the same account, so
  this carries the identical gap as the entry above. Their composite keys were
  created that way from the start rather than migrated onto, and are
  structurally identical to the fourteen that work. **That is reasoning, not
  evidence**, and this document has a section about the difference. Do a real
  second-account push before Programs reaches testers.
- **The write debounce does not fire while the app is backgrounded.** Observed
  2026-08-10: a write, then immediately switching apps, and the push had not
  landed after well over the 5-second debounce. It arrived the moment the app
  was foregrounded — the `visible` trigger, not the timer. Consistent with
  Android freezing timers in a backgrounded PWA. **Not a correctness bug** —
  cursors do not advance on a sync that did not happen — but it widens the §15
  caveat: a phone need not be *offline* to hold data the server has never seen,
  only backgrounded within five seconds of a write. Possible fix: flush the
  pending debounce on `visibilitychange` to hidden. Not done; it needs a
  decision about a sync being killed mid-flight as the page freezes.
- **CORRECTED 2026-08-10: the two-device tick collision names the wrong table.**
  This previously said two devices ticking the same care routine collide on
  `care_done_log`. Reading `careRoutines.ts` shows ticking never writes
  `care_done_log` at all — a row there is minted in exactly one place, the
  `!existing` branch of `setSkipped`, which returns early unless `skipped` is
  true. `toggleStep` only ever *updates* such a row, and only when it is already
  skipped. So: two devices **ticking the same step** on the same day collide on
  `(user_id, step_id, done_on)`; two devices **skipping the same routine** on
  the same day collide on `(user_id, care_routine_id, done_on)`. Two devices
  ticking *different* steps of the same routine are fine — demonstrated live.
  Still latent, still needs a real second device.
- **`AdoptScreen`'s totals count tombstones while its per-table rows do not.**
  The table showed Foods 19/18 above a button reading "The account's 123
  entries". Both numbers are defensible (§10 records the same trap) but a user
  will notice the mismatch. Copy decision, not a bug.
### Auth and email

- **A compromised email address has no self-service recovery.** Not reachable
  until email change ships (§12.4's deferral note), but the shape is already fixed by
  reset being email-based: whoever controls the address controls the account.
  Recovery would be manual, in the Supabase dashboard.
- **`PasswordField`'s layout is unverified against `index.css`.** It wraps the
  input in a `position: relative` div, which assumes `.field` does not require
  the input to be a direct child, and assumes `.btn-plain` resets padding.
  Rendered fine on a phone; nobody has read the CSS.
- **Security notification emails consume the hourly rate limit** (25/hour as of
  2026-08-19, §12.4). A password reset sends two messages. Repeated reset
  testing hits the ceiling sooner than the number suggests — that is the limit,
  not a bug.
- **Signup confirmation cannot report an already-registered address** (§12.4).
  The "Already have an account? Log in" button on the code screen is the only
  exit, and a confused tester may not read it.
- **Both code screens hold state in the component.** Closing the app between
  requesting a code and entering it loses the email address, and the code must be
  requested again. Acceptable for a one-screen flow; worth knowing.

### Adoption

- **`keep-local` destroys the account's data with a single press, no confirm.**
  `keep-account` has one. The asymmetry is defensible — one wipes a server you
  can push back to, the other wipes the only copy on the device — but it should
  be a deliberate choice rather than an accident.
- **The three parent-id indexes are still sized for single-column foreign keys.**
  `workout_sets (workout_id)`, `routine_exercises (routine_id)`,
  `care_steps (care_routine_id)`. A composite FK's cascade delete would prefer
  `(user_id, <parent_id>)`. Invisible at current row counts.
- **Push and pull share a cursor**, so anything this device pushes comes straight
  back down on **every** sync with local changes — not only the first, as
  previously recorded here. Harmless (`bulkPut` over identical rows is a no-op)
  but it doubles the transfer. Confirmed repeatedly: 1 pushed / 1 pulled for a
  single added food, 6/6 for a six-row replay. Matters more now sync is
  automatic, which is why writes are debounced.
- **No conflict UI.** Last-write-wins per row. Fine for one person across their
  own devices; the `careStepDone` split removed the one case that lost data.
- **Adoption failures show raw error text on screen**, including phrasings like
  "row-level security policy". Unpolished, but genuinely more useful when a
  tester screenshots it. Deliberate for now.
- **A failed adoption still leaves the just-registered auth user in place**, with
  `goals` and `profile` rows pushed before the failure. Orphaned and invisible.

### Barcode scanning

- **RESOLVED 2026-08-18: the iPhone scanner works.** A tester confirmed it on
  their own iPhone. The 2026-08-06 rewrite did its job and no further work is
  needed. This sat as an open unknown for twelve days purely because nobody had
  put it in front of an iPhone — a reminder that some items on this list need a
  person, not a session. The rewrite is described below for reference; treat it
  as history rather than a pending task.
- **`BarcodeScanner.tsx` was rewritten on 2026-08-06 and verified on iPhone on
  2026-08-18.** Changes: camera no longer restarts on every parent render (the
  `onDetected` dependency), streams are stopped when cleanup races the async
  start, 1920×1080 requested instead of accepting iOS's ~640×480, ZXing scan
  interval 100ms instead of 500ms, `TRY_HARDER` enabled, plus a reticle and a
  resolution readout under the video.
- **Safari still does not implement `BarcodeDetector`**, and every iOS browser
  uses WebKit, so the ZXing fallback is unavoidable. If the fix isn't enough,
  the next step is ZBar compiled to WebAssembly, which is much faster than
  pure-JS decoding.
- **Test protocol when a tester is available:** hold the barcode ~20–25cm away
  (the iPhone 13 main camera can't focus closer, and everyone's instinct is to
  move closer when it fails), try rotating 90°, try bright light on a flat
  surface. The on-screen resolution readout says whether the constraint was
  honoured.
- **Restricted Circulation Number barcodes.** German discounters heavily use
  8-digit store-internal codes starting with `2`. Different retailers reuse the
  same number for different products, so a scan can return confidently wrong
  macros. Not yet handled — detecting the prefix and warning would fix it.

### Accounts and profile

- **Email cannot be changed.** See §12.2. The Account screen says so plainly.
- **No account deletion.** Nothing in the app or the Account screen deletes an
  account or its server rows. A tester asking to be removed needs manual SQL
  plus a Supabase dashboard user deletion. **Also a hard Apple submission
  blocker** — see §12.11.
- ~~**No password reset.**~~ **CORRECTED 2026-08-18 — this shipped in 2.0 and
  the entry was stale for a week.** Reset is live as an 8-digit emailed code
  (§12.4). Caught by re-reading this section rather than by anything failing,
  which is the point §14 keeps making: **this document rots silently, and a
  stale "known issue" is worse than no entry, because it sends a future session
  to fix something that already works.**

### Other

- **`lookupBarcode`'s `User-Agent` header does nothing.** Browsers forbid
  scripts from setting it; `fetch` silently drops it. OFF asks for a descriptive
  User-Agent, so the app isn't complying despite looking like it is. The Worker
  *can* set it — an argument for routing barcode lookups through it too.
- ~~**`downloadBackup` calls `URL.revokeObjectURL` immediately after
  `a.click()`.**~~ **FIXED 2026-08-19.** The anchor is now appended to the
  document — Firefox ignores synthetic clicks on detached elements — and both
  the removal and the revoke are deferred by 1s in a `setTimeout`. The old
  pattern worked on every device it was tried on, which is exactly why it was
  worth fixing rather than waiting for a report: a backup that silently produces
  a zero-byte file is the one failure the safety net cannot have.
- ~~**Number fields silently corrupt decimal commas.**~~ **FULLY FIXED
  2026-08-22 (2nd) and released as 2.1.1. The morning's fix covered one file out
  of five and this entry claimed the job was done.**

  The bug: `type="number"` with `onChange={Number(raw)}`. Typing `67,5` on a
  German keyboard produced **`675`** — Chrome's number-input sanitiser drops
  characters invalid in its floating-point format and the remaining digits close
  up. No error, no empty field, no clue. A weight logged that way saved roughly
  ten times too high, and the visible symptom was the weight chart's Y-axis
  rescaling, which reads as a broken chart rather than a broken input.

  **`NumberField.tsx` was fixed on the morning of 2026-08-22. Four other screens
  had hand-rolled their own inputs and were not touched:**

  | Screen | Field | Why it mattered |
  |---|---|---|
  | `ActiveWorkoutScreen` | set weight | the worst one — see below |
  | `RoutineFormScreen` | target weight, target reps | committed on every keystroke, no draft string at all: `Number(raw)` wired straight to `onChange`, which §5 names as *the* bug pattern |
  | `WorkoutDetailScreen` | weight, reps on a past set | editing history |
  | `AddEntry` | food amount | markup was a hand-copy of `NumberField`'s, suffix and all |

  **The workout one is worse than the body-weight one, and that is the part
  worth internalising.** A corrupted body weight is one wrong row on one chart.
  A corrupted set weight also feeds `workoutVolume`, the Epley 1RM, the PR list
  and the volume trend — derived history that **stays wrong after the row itself
  is corrected**. The changelog line for 2.1.1 says so plainly for that reason.

  **The fix:** every one of them is now `type="text"` with `inputMode`, and the
  parser lives once in **`src/data/numbers.ts`** as `parseDecimal()`. `AddEntry`
  was moved onto `NumberField` outright (which gained an `autoFocus` prop),
  deleting a hand-rolled input rather than patching one. `RoutineFormScreen` got
  a small local `DraftNumber` component, because its parent state is
  `number | ''` and cannot hold a half-typed `67,`. Verified afterwards with the
  grep that should have been run in the morning: `grep -rn 'type="number"' src/`
  now returns only a Recharts `XAxis` prop and two code comments.

  **`min`, `max` and `step` are still accepted as `NumberField` props and are
  still not applied** — they only ever drove the spinner arrows and form-submit
  validation, neither of which exists on a text input, and no screen here uses
  form validation, so nothing was enforcing them anyway. Clamping on blur is the
  right shape if it is ever wanted, as its own change. Deleting them belongs with
  §18 Phase 7's number-field audit. **The comment on that props block in
  `NumberField.tsx` is now slightly stale** — it says "no screen here uses form
  validation", written when the props were orphaned; still true, narrower in
  scope than it reads.
- **The set `×` button is gone from `ActiveWorkoutScreen` and
  `RoutineFormScreen`** (2.1.1). Both already offered **Remove set** inside the
  set-type sheet reached by tapping the set number, so it was a duplicate
  affordance eating 2rem in the most crowded row in the app. **`WorkoutDetailScreen`
  keeps its `X`** — its set type is a `<select>`, not a sheet, so there is no
  other delete path there. 2.1's changelog announced that button being "smaller
  and red" four days earlier, which is worth knowing before assuming the removal
  was an oversight.
- **`.set-delete` in `index.css` is now dead code.** Left deliberately for the
  Phase 6 CSS pass rather than hunted now. §14 records a duplicated `.wordmark`
  causing an hour of confusion, so it is written down rather than left to be
  discovered.
- **`pieceLabel` is no longer pluralised, and that is deliberate** (2026-08-23,
  2nd). `AddEntry`'s piece-mode toggle showed `` `${pieceLabel}s` `` and now
  shows the label as-is: "apple", not "apples". `pieceLabel` is stored user data
  and stays untranslated per decision 17, so English pluralisation cannot be
  applied to it — "Scheibe" would become "Scheibes". Accepted knowingly. **Do
  not add the `s` back.** `FoodForm` solves the same problem with
  `Gewicht pro {label}`, which needs no article and therefore no gender.
- **Three fields are written by code and displayed by nothing**, as of
  2026-08-23. `WorkoutSet.notes` is copied to every set and no screen renders
  it. `RoutineSet.repsMin`/`repsMax` are read by the prefill and by the
  write-back restoration, and no editor can set them. `Workout.programDayId` has
  a writer only because `startWorkoutFromRoutine` takes an optional second
  argument that nothing currently passes. **None of these is a bug** — they are
  the data half of a feature whose UI waits for Phase 1 — but a future session
  finding a field nothing displays should read this line before "fixing" it. The
  same shape as `targetSets`, which was stored and never read from launch until
  2026-08-17.
- **The crown will report a PR the Records list does not show.** By design; see
  §12.16. `recentPRs` ranks by Epley 1RM, the crown by weight then reps. Written
  down here as well as there because the natural instinct on encountering it is
  to treat one as broken.
- **Safari evicts IndexedDB and localStorage aggressively.** Affects both the
  data and the auth session, so "always logged in" will occasionally fail on
  iPhone. Adding to home screen helps. Design the login screen so landing there
  reads as routine.
- **No scheduled notifications.** PWAs fundamentally cannot fire a notification
  when closed. The main thing pushing toward Capacitor.
- **Supabase free tier pauses after 7 days of no database activity**, with a
  ~30 second cold start on resume. This is why `syncBeforeFirstRun` has an
  8-second ceiling. 500 MB database, 50,000 MAU, 2 projects.
- The GitHub Actions workflow warns about Node 20 deprecation. Harmless, and
  the file gets deleted when hosting moves.
- **Bundle size warning at build.** `exercises-*.js` at 840 kB is the dataset,
  already dynamically imported. The 1.66 MB main bundle is large but is what has
  been shipping. Pre-existing, not introduced by 1.6.
- **`playBeep` is silent until `unlockAudio` has run from a real tap.** Web
  Audio requires a user gesture. If the rest chime never fires, check where
  `unlockAudio` is called before assuming the audio code is wrong. The export is
  still named `playBeep` although it now plays a ~2.2 second chime; renaming is
  safe — `tsc` catches every call site — but was not worth a round trip.
- **An exercise logged with only warm-up sets reads as removed** by
  `diffWorkoutAgainstRoutine`, because `targetSets` counts working sets only.
  Rare, and every alternative rule was worse. Accepted knowingly on 2026-08-17.

### Unexplained observation

**Duplicate foods predating all sync work.** `Apple, raw` and `Oats` each appear
twice, different UUIDs, *identical* macros and `created_at` to the millisecond
(30–31 July). Signature of `migrate.ts` running twice, except only two foods are
affected rather than the whole database, which doesn't fit. **Not diagnosed.**
Harmless — delete one of each and they tombstone away.

### The food search is NOT broken

On 2026-08-06 a long session was spent "fixing" the Open Food Facts search
based on a theory that German discounter products were missing. **They are not.**
Evidence gathered from the live API:

- `?q=quark&country=en:germany` returns **679 products** — Milbona Kräuterquark,
  K-Classic, Gut & Günstig, ja!, REWE Bio, Milram, Frankenland
- `?q=K-Classic` works fine; hyphens are handled by luqum without escaping
- `?q=kräuterquark` works fine
- `product_name.en` in the Elasticsearch debug output is the **default analyzer
  field**, not "the English name" — it contains German text for German products

Three separate "fixes" were attempted and all three broke working behaviour:
escaping Lucene operators made `K\-Classic` match nothing; wrapping the query in
parentheses made `(quark)` return zero where bare `quark` returned 679. All were
rolled back. The Worker in production is the original.

**Before touching search again, get concrete examples of queries that
disappointed the user.** The unanswered question is still *what were you
actually typing?*

Note also: testing country behaviour with `curl` from Codespaces gives the
datacenter's country (it returned `en:netherlands`), not Germany. Use the
`?country=` override.

---

## 14. Things that have gone wrong before

**Diagnosis**

- **A severity label is not a risk assessment.** Three `npm audit` "high
  severity" advisories were carried as the largest open security item for nine
  days. `npm ls` took ten minutes and showed all three were dev-only —
  vite/postcss, eslint, workbox-build — none reachable from the running app.
  **Read the dependency path, then rank.** The bundle hash being identical after
  the patch was the confirmation (§16, 2026-08-19).
- **Check the units before changing a number in a dashboard.** §18 recorded
  Supabase's email cap as "10/hour" and Resend's as "100/day" and concluded
  Supabase was the binding one. True — until the number was raised. The field is
  `emails/h`, so setting 100 authorised up to 2,400/day against a 100/day
  budget and **silently inverted which ceiling binds**. A fix that makes the
  real constraint worse is the expensive kind (§12.4).
- **Building fixes on untested assumptions.** See §13. Three consecutive wrong
  fixes to a system that wasn't broken. Get evidence first.
- **Fixing the component is not fixing the bug, and the grep that proves it was
  written down and not run.** §5 has said `grep -rn 'type="number"' src/` finds
  the remaining candidates since the morning of 2026-08-22. Four screens went on
  silently corrupting weights for the rest of the day while both this document
  and the changelog described the bug as fixed. **A one-line grep already
  recorded in the conventions is worth more than the conventions if nobody runs
  it.** Run the verification command in the same session as the fix, and paste
  the output.
- **A commit is not a release.** `6d5d9ce` fixed `NumberField` and reached
  production; no changelog entry was written, and `APP_VERSION` derives from
  `CHANGELOG[0].version` (§5), so About kept saying **2.1** while this document's
  first paragraph claimed 2.1.1 for a full day. Neither the git log nor the
  deploy log would ever have shown it. **The check is `git show main:src/data/changelog.ts | head`,
  not `git log`.**
- **⚠ Vite's transform cache serves stale code across a dev-server restart, and
  it looks exactly like a code bug.** On 2026-08-23 an edit to `routines.ts` was
  correct on disk, compiled clean, and did nothing in the app — through a server
  restart, a hard reload, and a check that no service worker was registered.
  `node_modules/.vite` was serving the pre-edit module. **The cure:**

  ```
  rm -rf node_modules/.vite
  rm -f tsconfig.app.tsbuildinfo tsconfig.node.tsbuildinfo
  npm run dev
  ```

  **The tell that distinguishes it from a stale service worker** — which
  produces an identical symptom and already has an entry below — is an
  asymmetry: a console `await import('/src/data/routines.ts')` gets the *new*
  code while the running app executes the *old*. Vite serves a fresh copy on
  request; the app holds the instance loaded at mount. If the direct call works
  and the button does not, suspect the cache before suspecting the code.
- **A console `await import()` is not evidence about what the app is running.**
  The corollary of the above, and worth stating separately because it was used
  as a check and returned a confidently wrong answer.
  `r.startWorkoutFromRoutine.toString().includes('notes: ex.notes')` returned
  `true` while the app ran the old function. **It proves what is on disk, which
  was never in doubt.** Same shape as the absent-signal entry below: two very
  different states, one identical appearance.
- **The two-path comparison is the tool for "my edit did nothing", and it should
  be the first thing tried rather than the fifth.** Run the UI action, then call
  the same function directly, read both results, compare them in one command:

  ```js
  const ui = /* the workout the button just made */
  const direct = await r.startWorkoutFromRoutine(ui.routineId)
  ({ uiNotes: await read(ui.id), directNotes: await read(direct) })
  ```

  Both populated → it was always staleness. UI empty, direct populated → the app
  is running different code. Either answer in one step. **On 2026-08-23 four
  causes were proposed from reasoning first** — stale module, save-versus-start
  timing, a service worker, the Start button's `blocked` guard — and all four
  were wrong. §14 already says reasoning in circles is the signal to stop and
  get evidence; the addition is that here the evidence had to be *two*
  measurements, because either one alone still looks like a code bug.
- **supabase-js retries failed requests internally with no visible backoff.** A
  burst of four identical failed requests is not necessarily application code
  looping. Confirmed: four `care_routines` 403s inside a *single* logged
  `syncAll` run. `upkeepAutoSync.log()` is what distinguishes the two.
- **Transient readings taken mid-sync look like bugs.** A count read while a sync
  was in flight showed 17 where 16 was expected; a second read was correct.
- **Reasoning in circles is the signal to stop and get evidence.** Twice on
  2026-08-09 a diagnosis was constructed, contradicted itself, and was resolved
  in one SQL query.
- **Claude trusted this document over a file already pasted into the
  conversation.** §3 claimed the Workbox precache limit was raised in
  `vite.config.ts`; the pasted `vite.config.ts` had no such setting. Claude
  wrote one back in and asked *the user* to resolve the contradiction, when the
  file in front of it was already the answer. **This document is a summary and
  can be stale; a pasted file is evidence.**
- **Claude turned an ambiguous doc sentence into a flat claim.** Cloudflare's
  rate limiting page says bindings "are not currently visible in the dashboard",
  under a heading about *monitoring*. Claude reported that bindings could not be
  *added* from the dashboard at all, and nearly ruled out the whole fix on that
  basis. They can; the binding was added there in two minutes.
- **A query written without `deleted_at` cannot tell a tombstone from a live
  row.** Claude asked for a `care_step_done` check omitting it, immediately after
  a tick and an untick — the two possible outcomes produced identical output.
  §10 already warns about this exact trap.

**Design**

- **Suppressing hook-triggered work by deferring and replaying it recreates the
  loop you were suppressing.** Ignore, don't defer.
- **A comment justifying a decision by reference to code elsewhere goes stale
  silently.** `adoptAccount` claimed the device before syncing, correctly
  justified at the time; an hour later `autoSync` changed and the justification
  was obsolete while the comment still read as authoritative.
- **Any screen that can fail needs a way out.** `AdoptScreen`'s error state
  originally offered only "Try again", which fails forever when the cause is
  structural — and routing doesn't exist before `ready`, so the user was trapped
  with no route to `/account`. It now offers "Log out instead".
- **Timestamps: compare instants, not strings.** Postgres returns `+00:00` where
  JavaScript's `toISOString()` gives `Z`. Same moment, but `Z` sorts after `+` as
  text, so a string comparison calls two identical timestamps different.
  `singletonPreview` uses `Date.parse`. ~~`pullGoals` / `pullProfile` still do a
  raw string comparison.~~ **FIXED 2026-08-19 — all three now use `Date.parse`.**
  Verified while fixing that **the push side was never affected**, which is worth
  knowing before anyone "fixes" it again: `pushProfile`, `pushTable` and the
  cursors all compare a JS `toISOString()` string against another JS
  `toISOString()` string, and `.gt('updated_at', since)` is a string handed to
  Postgres to parse server-side. **Only a pull mixes the two formats**, because
  only there does a server-generated timestamp meet a locally-generated one.
  Note also that `Date.parse` returns `NaN` on garbage and `NaN > NaN` is false,
  so an unparseable value falls through to the write — the server copy wins,
  which is the safe direction.
- **Logging out leaves all local data visible.** The app appears to still contain
  the previous user's data while signed into someone else's account. This fooled
  me during testing and will fool a tester. It's what adoption exists to dispel.

**Code**

- **A temporary `import './data/auth'` in `main.tsx` was committed and pushed.**
  It survived only because Vite's dead-code elimination stripped the module
  entirely. The equivalent `import './data/sync'` was removed on 2026-08-07.
  *Note:* the original hazard has since gone away — `App.tsx` imports `auth.ts`
  for the stage machine, which imports `supabase.ts`, so it is legitimately in
  the production bundle now.
- **A global sync cursor caused foreign key violations.** Parents filtered out
  as "already synced", children rejected. Fixed by per-table cursors.
- **`syncAll` returns errors rather than throwing.** An unchecked call is
  indistinguishable from success. A device got claimed by an account it had
  failed to push a single row into, and the app looked completely normal.
- **Service worker caching** caused "works on desktop, broken on phone" several
  times. Updates use `skipWaiting` and `clientsClaim` plus an update prompt.
  When something seems wrong after a deploy, check for a stale worker first.
  Force an update by fully closing the installed app and reopening, twice if
  needed, then check About shows the expected version.
- **Editing an old Dexie version block** instead of adding a new one — silently
  breaks existing installs while working fine on new ones.
- **Writing inside a `useLiveQuery`** — throws `ReadOnlyError`, blanks the
  screen with an unhelpful `[object Object]`.
- **A context provider scoped to only part of the tree.** `DialogProvider`
  wrapped only the routed app, so a pre-routing screen using `useConfirm` threw
  and rendered blank.
- **Unused imports** pass `npm run dev` and fail `npm run build`.
- **Editing `types.ts` in place while `db-old.ts` still existed** produced 152
  type errors at once. Keep parallel schemas in separate files.
- **`TS1109: Expression expected`** almost always means a bracket problem a few
  lines *above* where it's reported.
- **Stale TypeScript server after renaming files.** Red squiggles on imports
  that build fine mean the editor's cache. Restart TS Server; trust
  `npm run build`.
- **`saveName` was overwriting `createdAt`** on every rename. Fixed.
- **A new module's console helpers don't exist until something imports it.**
  Vite only bundles modules that are reached.
- **Large multi-part briefs produce diffs too big to review properly.** Smaller,
  testable chunks work better.
- **Adding a second editing surface without checking for an existing one.** The
  Account screen was given a name editor while Settings already had one. Caught
  in review, not by the build — duplication of function is invisible to the
  compiler.
- **A duplicated CSS selector.** `.wordmark` was defined twice in `index.css`;
  the later block silently won. Editing the dead one and concluding the change
  did not work is the natural next step. Deleted 2026-08-09.
- **An unused import after swapping a component.** Replacing the onboarding
  `Sparkles` icon with `<Mark />` left the lucide import in place; `npm run dev`
  passes and `npm run build` fails.

**Process**

- **A dev-server symptom is not a bug until it reproduces on the real build.**
  On 2026-08-09 a 2–3 second startup delay and an unexplained Brave permission
  prompt both disappeared on the deployed build. Vite serves hundreds of
  unbundled modules through the Codespaces tunnel; slow first paint there is
  ordinary. Two would-be investigations avoided by checking first.
- **Commits are not the place for design rationale.** A long commit body
  restating what the code comments already say creates two copies that drift —
  the exact failure §14 already records for stale comments. One fact, one home:
  *why this design* goes in code comments, *project rules* in this document,
  *what users got* in the changelog, *what is untested* here or in an issue, and
  only *why this change* in the commit. "Untested: X" in a commit message is
  especially wrong, since the log is immutable and the claim stays true forever.
- **Ask which build a symptom came from before theorising about causes.**
- **Claude asserted two files were untouched by a branch and they were not.**
  Planning the 2.1.1 release, Claude said `ActiveWorkoutScreen.tsx` and
  `RoutineFormScreen.tsx` "weren't touched by the i18n branch, so they'll come
  across cleanly", and `git checkout main` refused. The information was already
  in this document — §14 records the `RPE_OPTIONS` → `rpeOptions()` conversion
  producing "four errors across two files", and those were the two files.
  **Nothing was lost, because the recovery was to commit rather than to stash**
  (§5 forbids `stash`, `checkout .` and `reset` for exactly this moment). The
  fix was to commit on the branch and cherry-pick onto `main`.
- **Claude then predicted the cherry-pick would drag the branch's i18n work onto
  `main` and it did not.** A cherry-pick applies a *commit's diff*, not the file
  contents at that commit, and the diff never touched the `rpe` lines. Two
  independent things proved it: `tsc` would have failed against `main`'s
  `rpe.ts`, and `main` built at **2,473.50 KiB** precache against the 2,473.13
  recorded before the patch — a third of a KiB, not the ~25 KiB the catalogues
  weigh. **A predicted failure that does not happen still needs the evidence
  checked, and the build size was the cheapest evidence available.**
- **Git auto-merged two files that differed on both sides without a conflict.**
  Merging `main` back into `phase-1-i18n` touched the same two files and
  succeeded silently. Auto-merge is textual and does not know whether the result
  makes sense, so **build after a clean auto-merge, not only after a resolved
  conflict** — that build was the first time the i18n work and the number-field
  work had existed in one tree.
- **Claude guessed `signUp`'s signature instead of reading `auth.ts`**, producing
  a `Cannot read properties of undefined (reading 'trim')` that looked like an
  app bug and was not. Console helpers have signatures; read them.
- **Claude asked for a dev-only console helper to be run on the production
  build.** §10 says they are stripped by `import.meta.env.DEV`. The resulting
  `upkeepAutoSync is not defined` was the guard working, and the test produced no
  data. Check which build a helper exists in before prescribing it.
- **Claude predicted a count of 19 from a baseline of "18 foods"** without
  checking whether that 18 was live or total. It was total, one of them a
  tombstone. The screen was right and the prediction was wrong. Any count
  compared across Dexie and Postgres has to state which it means.

**Testing**

- **Pick test data that makes the two outcomes different, then check that it
  did.** Testing `repsMin` prefill on 2026-08-23 needed an exercise with **no
  logged history**, because `useTargets` goes false the moment `lastSetsFor`
  returns anything and the prefill reads 0 for a correct and unrelated reason.
  It also needed the routine's plain `reps` to differ from `repsMin`, or
  `repsMin ?? reps ?? 0` would return the right number by accident. The stored
  `reps` turned out to be `undefined`, making 6-versus-0 unambiguous — but that
  was luck, and it was checked rather than assumed.
- **A "fresh" workout is only fresh if you look at its timestamp.** Three
  separate reads on 2026-08-23 landed on a workout started before the change
  being tested. `db.workouts.toArray()` returns rows in primary-key order —
  UUIDs, so effectively random — and `.at(-1)` is not the newest.
  `activeWorkout()` sorts by `startedAt` descending for this reason; any
  throwaway console query has to do the same, and print the timestamp.
- **Design the test so it can actually detect the thing.** A `keep-local` test
  was run against a device whose rows were identical to the account's, so
  tombstoning and re-pushing cancelled out and the check showed nothing. The fix
  was to insert a server-only row with a 2020 timestamp (so no cursor would pull
  it) and re-run.
- **An absent signal is not evidence, and this bit again on 2026-08-18.** An
  empty console during CSP testing could mean the policy passed, or that the
  console was not reporting, or that no cross-origin request had been made at
  all. Three very different states, one identical appearance. Resolved by
  running `console.log('test')` to prove the channel worked, then exercising the
  food search specifically because it is the only path hitting the search
  Worker. **When a test's pass condition is "nothing happened", first prove that
  something happening would have been visible.**
- **Don't test destructive paths with real data.** On 2026-08-09 I was nearly
  walked into merging fake browser test data into my real tracking history on my
  phone. I registered a separate account instead, which was the right call.
- **The 2020-timestamp trick works, reused 2026-08-10.** A server row stamped
  `2020-01-01` can never be pulled by any cursor, so if it still gets tombstoned
  the sweep provably isn't cursor-driven. Cheap way to make a destructive path
  testable.
- **Identical data on both sides makes every adoption test vacuous.** After one
  merge, device and both accounts held the same rows, so no mode could show
  anything. Each of the three tests needed a deliberately planted difference
  first. This is the same failure as the 2026-08-09 `keep-local` test, one level
  up.
- **"The feature does nothing" can mean the code is fine and the browser took
  the input.** The onboarding swipe looked unimplemented on a phone; the pointer
  handlers had been there since 1.7 and were correct. `touch-action` does not
  inherit, and `.onb-slide` is its own scroll container (`overflow-y: auto`), so
  the parent's `pan-y` never applied to touches landing on a slide. The browser
  claimed the gesture and fired `pointercancel` — which is wired to the same
  handler as `pointerup`, resetting `drag` to 0 and snapping the slide back to
  exactly where it started. Perfectly indistinguishable from "nothing happened".
  **The diagnostic that split it in one step:** drag with a mouse on desktop.
  Mouse input skips touch-scroll arbitration, so working-on-mouse-but-not-on-
  touch proves the logic is sound and the input is being stolen. Reach for a
  cheap test that distinguishes two causes before changing either.
- **Assuming a file exists because the doc mentions it.** `_headers` and
  `_redirects` were described as things that would "merge cleanly" during the
  cutover. Neither had ever been committed — §17 described `_headers` as
  *planned*. `git log -- <path>` on the branch settles this in one command.
- **The order of a cutover is the whole design.** Merging before deleting
  `deploy.yml` would have had GitHub Actions build the no-`base` config and
  publish it to a subpath — 404 on every asset, for every tester, before anyone
  was warned. Three separate reorderings were needed before the plan was safe:
  workflow deletion before merge, farewell build before workflow deletion, and
  the export window before the farewell build.
- **A predicted bug is not a diagnosed bug, and the guess can be too kind.**
  §12.13 predicted the decimal comma would "not parse". The one-minute test on a
  real phone showed something worse: the comma was *deleted*, not rejected, so
  the field looked like it had accepted the input. Predicting a failure mode is
  not the same as knowing it. **The test was: type `67,5`, then type `67.5`, and
  report what the field shows and what saves.** Two inputs, one minute, and it
  changed the fix from a nicety into a released patch.
- **Destructuring a prop you have decided not to use is a build error.** The
  first `NumberField` rewrite kept `min`, `max` and `step` on the interface for
  call-site compatibility — correct — but also kept them in the destructuring,
  and `noUnusedLocals` rejected all three. Keep them on the interface, drop them
  from the destructuring, and document why they are accepted and ignored.
- **Module-level `const`s freeze translated strings; default parameters do
  not.** Three top-level arrays had to become functions (`CONTENT`,
  `RPE_OPTIONS`, `SECTIONS`) because they evaluate once at import. `ui.tsx` was
  flagged as a fourth and was wrong — `label = t('common.add')` is a default
  parameter and re-evaluates on every call. The distinction is evaluation time,
  not where the string appears.
- **Converting an export from a const to a function breaks its call sites, and
  that is the feature.** `RPE_OPTIONS` → `rpeOptions()` produced four errors
  across two files, of which two were real and two were fallout. Letting `tsc`
  find them beats grepping, and the four-error count was itself the confirmation
  that nothing else imported it.
- **A single-letter loop variable can shadow `t()`.** `Layout.tsx` mapped
  `section.tabs.map((t) => …)`. Adding the i18n import would not have errored —
  it would have silently resolved `t('…')` inside that block to the tab object.
  Renamed to `tab` before the import went in. Worth scanning for on every file
  that gets translated.
- **A branch preview has its own origin, and therefore its own IndexedDB.** This
  turned out to be free test infrastructure: the Cloudflare preview URL for
  `phase-1-i18n` starts completely empty, so a clean first-run walkthrough needs
  no console helpers at all. Two cautions — do not add the preview to the home
  screen (two icons, two service workers), and do not log into it casually.

---

## 15. Session log

| Date | Version | What shipped |
|---|---|---|
| 2026-08-24 (6th) | *(unreleased, no version bump)* | **Body, care routines, and About/Feedback/Install fully translated** — the three blocks listed as "After workouts" in §17, in four commits: **5a** `BodyScreen.tsx` + `MeasurementFormScreen.tsx` (also fixed a pre-existing locale-less `toLocaleDateString` in `shortDate`, the §6 rule); **5b** `RoutineTodayScreen.tsx`, `RoutineManageScreen.tsx`, `CareRoutineFormScreen.tsx` — `careRoutines.ts`'s `TIMES` converted to a `times()` function and `kindLabel()` added as a display-only translation layer over `DEFAULT_KINDS`, which stays English because it's stored verbatim in `CareRoutine.kind` (same reasoning as `commonFoods.ts`); two dormant `t`-shadows found and fixed before they could bite (`TIMES.map((t) => …)` in both screens); **5c** `AboutScreen.tsx`, `FeedbackScreen.tsx`, `InstallScreen.tsx` — `InstallScreen`'s `STEPS`/`LABELS` converted to `installSteps()`/`installLabels()` functions; changelog entries (`release.date`, `release.changes`) deliberately left English, that's the still-open `changelog.ts` decision below, not part of this work. **Then a full-repo audit** (every `.tsx` under `src/features` grepped for a zero `t(` count) **found one real gap the "complete" workout rebuild had missed**: `FolderPicker.tsx` (used by `RoutineFormScreen`, `SaveAsRoutineScreen`, `FinishWorkoutScreen`) had never been touched — fixed as a fifth commit. **Every chunk hand-tested live in both languages** via Claude in Chrome — create/edit/delete flows, confirm dialogs, decimal-comma weight entry, the custom-kind and custom-folder text inputs, all three install-guide platform tabs — not just built. Precache **2,564.62 KiB**, up from 2,551.48. Four commits (`10ce9db` 5a, `c0ad932` 5b, `2bbeb64` 5c, `17103c2` the FolderPicker fix), pushed to `phase-1-i18n`. **What's left of Phase 1: the bilingual Supabase email templates, and the `changelog.ts` decision** — both need the owner's input before starting, neither was touched this session. |
| 2026-08-24 (5th) | *(unreleased, no version bump)* | **Chunk 4 of the workout rebuild, closing out §12.19's four-chunk arc** — see "Chunk 4 — DONE" in §12.19 for full detail. **4a**: swap-exercise on `ActiveWorkoutScreen.tsx` (stored `substitutes` → `suggestSubstitutes()` → full search fallback), plus the i18n sweep chunk 3 left unfinished — including a "0/3 done" string chunk 3's own sweep missed, caught only by testing in German. **4b**: `RoutineFormScreen.tsx` (previously zero `t()` calls) fully translated, plus a 2-alternate substitutes picker on `ExerciseCard`, round-tripped through Dexie and verified live. **4c**: `ExercisePicker.tsx` translated — the shared component 4a and 4b both depend on. **A correction to §12.19's own plan**: it said the substitutes picker went on `RoutineFormScreen.tsx` *and* `ProgramFormScreen.tsx`'s exercise cards, but the latter has no exercise cards at all; flagged to the owner before writing code, confirmed `RoutineFormScreen` only. **A near-miss caught before committing**: memoizing `ExercisePicker`'s body-part chips with `useMemo(fn, [])` would have frozen them in whichever language was active on mount, despite the rest of the app re-rendering fine on a language switch — fixed to the same un-memoized pattern `rpeOptions()`/`restOptions()` already use. **Two dormant `t`-shadow landmines found and left alone** (not yet bugs — neither file imports `t()` yet): `ExerciseDetailScreen.tsx:75`, `WorkoutDetailScreen.tsx:207`. Precache **2,551.48 KiB**. Three commits (`49b5c73`, `8c63532`, `9bdb796`), pushed to `phase-1-i18n`. **Second-account program sync is still explicitly untested** (§12.16, §13) — unrelated to this chunk's own work but re-flagged since nothing has closed that gap yet. **Next: body, care routines, About/Feedback/Install, then the bilingual email templates and the `changelog.ts` decision** — the remainder of Phase 1. |
| 2026-08-24 (4th) | *(unreleased, no version bump)* | **Chunk 3 of the workout rebuild** (§12.19): the Log tab rebuilt in two hand-tested sub-chunks — see "Chunk 3 — done" in §12.19 for full detail. **3a**: the no-workout screen forks on `activeProgram()` into an active-program view or a programs-then-routines-then-empty chooser. **3b**: Add-exercise moved into `.workout-sticky`, a routine-notes read-only block, the rest timer moved into a new floating `.rest-bar`, and the PR crown (a 2.5s gold flash on the check button via `isAllTimePR`). **A real bug found by testing**: discarding a workout with its rest timer running left stale timer state that the new floating bar (unlike the old per-card display) rendered into the *next* workout; fixed with an effect keyed on `workout?.id`. `rest.ts`'s `REST_OPTIONS` converted to a function (`restOptions()`), fixing the same untranslated-`'Off'` bug in `RoutineFormScreen.tsx` too. **The session opened by re-verifying Chunk 2 end to end** (the user's explicit request, after the AI's own memory of it felt unreliable) — re-read every diff, re-tested the import/edit/kebab-menu flows live, found nothing wrong with Chunk 2 itself, but surfaced one **pre-existing, app-wide gap**: no screen anywhere ever passes `cancelLabel` to `useConfirm()`, so every confirm dialog's Cancel button is hardcoded English regardless of language — left unfixed, out of scope, flagged for later. Precache **2,542.20 KiB**. Two commits (`1ac2320`, `ea1834a`), pushed to `phase-1-i18n`. **Chunk 4 (swap-exercise, substitutions editor, final i18n sweep) is next.** |
| 2026-08-24 (3rd) | *(unreleased, Programs UI, no version bump)* | **Chunk 2 of the workout rebuild** (§12.19): program creation and management UI, in three hand-tested sub-chunks — see "Chunk 2 — done" in §12.19 for the full detail. `ProgramImportScreen.tsx` (preview before writing, built first), `ProgramFormScreen.tsx` (manual weeks/days editor with a copy-to-multiple-days picker and a repeat toggle), and a Programs section wired into `RoutineListScreen.tsx`, which also got its first-ever i18n pass end to end. Two new shared catalogue keys: `common.delete`, `common.loading`. Every screen verified through the actual dev-server UI via Claude in Chrome (not just `npm run build` or the console) — including a German-language pass through the real Settings switch, after a console-forced language change was found to silently hit a separate module instance and do nothing. Precache **2,536.89 KiB**. Three commits (`dbc29cf`, `0f134e0`, `4507142`), pushed to `phase-1-i18n`. **Chunk 3 (the Log tab rebuild) is next.** |
| 2026-08-24 (2nd) | *(unreleased, no UI yet)* | **The workout section finally scoped, in Claude Code via `AskUserQuestion` one question at a time — §12.18 has all six answers.** A four-chunk build plan followed in plan mode (§12.19), approved, and **Chunk 1 built**: `src/data/programs.ts` (new), `src/data/programImport.ts` (new), `RoutineExercise.substitutes` end to end with its own migration, `swapExerciseInWorkout`, the crown's `isAllTimePR`, `suggestSubstitutes`. **Tested by hand against the dev server, not just the build** — program CRUD, single-active enforcement, cascade delete, the week/day math, and a full import of the real 12-week Min-Max JSON. **A real finding, not a guess**: exercise-name matching against the 1,324-exercise seed missed more than expected on PDF-derived names (Pec Deck, Kelso Shrug, Incline DB Y-Raise had zero match); the custom-exercise fallback handled it safely, and Chunk 2's import preview needs to surface it. Precache **2,511.95 KiB** (data-layer-only delta from 2,511.90). Committed and pushed. **The new migration has not yet been run against the live Supabase project.** |
| 2026-08-24 | *(no application code)* | **The project moved off GitHub Codespaces onto a local Windows machine, and off claude.ai chat onto Claude Code.** Both branches confirmed clean and pushed first (`git log origin/<branch>` matching local on `main` and `phase-1-i18n`); a third branch, `accounts`, was discovered and is unmentioned anywhere in this document. Cloned to `D:\dev\Projects\upkeep`, installed with **`npm ci`** rather than `npm install` to match Cloudflare's `npm clean-install`, `.env.local` recreated by hand because it is gitignored. **The move was verified by building it**: `index-DaGpoujQ.js` — the identical bundle hash to the last Codespaces build — with precache 2,511.90 KiB against 2,511.87, the 0.03 explained by Windows CRLF checkout (§3). **`CLAUDE.md` written and restored to the repo root** after being deleted in the 2026-08-10 cutover; **this file renamed to `docs/HANDOVER.md`** and the `-17` dropped because git now carries the history; **`PRIVATE-NOTES.md` created and gitignored**, taking §12.11's funding and legal subsection verbatim out of a public repo. **New §19 records the Claude Code session protocol.** **Phone testing now goes through the Cloudflare branch preview**, not a forwarded port — localhost cannot serve the camera over a LAN IP. **No application code was touched, no version bump, nothing deployed.** |
| 2026-08-23 (2nd) | *(Phase 1 on a branch, no version bump)* | **The entire meals section translated, in five tested chunks**, all on `phase-1-i18n`: `TodayScreen` + `AddEntry`; `FoodListScreen` + `FoodSearch`; `FoodForm`; the barcode scanner pair; `GoalsScreen` + `ChartsScreen`. Each built, tested in both languages at 360px and committed before the next was written, and **no German string needed shortening** — unlike the auth block. **Decision 17 answered: `commonFoods.ts` keeps English names, German lives in `keywords`** — not on the exercise seed's search argument, which does not apply, but because a common food's name becomes a `Food` row and then a permanent `logEntry.foodName` snapshot, so a German name would persist rather than render (§12.13). `MEAL_KEYS` + `mealLabel()` added to `log.ts`; `macro.*` keys scoped separately and now shared by three screens; `plural()` used for the first time in anger, in `ChartsScreen`. **Two non-i18n bugs fixed in passing**: `FoodSearch` hardcoded `g` where it should have used `food.unit`, and **`BarcodeScanner.tsx` carried the `t()` shadow twice** — the §14 trap that produces no error at all. Four files in the section turned out to hold no user-facing strings. **Then the priority changed**: the workout section is to be finished completely, UI included, before the rest of Phase 1 — **§18's first non-negotiable ordering, consciously overridden**, with the cost and the mitigation recorded in the new **§12.17**. **`main` was then merged into the branch** ahead of that work: one conflict, in `adopt.ts`, exactly as §4 predicted, resolved to `tableLabels()` with the two Programs entries and two new catalogue keys; `db.ts` auto-merged silently. Branch built clean at **2,511.87 KiB** — the first tree holding both the i18n layer and the Programs data layer. **The workout section itself was never scoped** — the session ended first, and the six questions to open the next one are at the foot of §12.17. |
| 2026-08-23 | *(unreleased, nothing user-visible)* | **Every open Programs decision taken, and the entire data layer built.** Migration `2026-08-23-programs.sql` applied to the live project: `programs` and `program_days` with composite keys and RLS policies, plus `workouts.program_day_id` and `workout_sets.notes`. Verified by the constraint query, a `pg_policies` check, and a full push-and-pull round trip — `week_notes` survived as jsonb, `started_on` did not shift from UTC+1, `is_active` pulled back as `false` rather than `undefined`. **Decisions (§12.16):** weeks are an integer column; blocks dropped entirely; days are 1–7 anchored on `startedOn`; `workouts.programDayId` links a workout to its scheduled day; rep ranges are reference-only with `repsMin` prefill; the crown is an all-time PR by weight-then-reps; routine notes shown read-only rather than copied. **Client:** Dexie `version(2)` — the first schema bump since launch — two sync mappers, `weekNotes()` coercion, `adopt.ts` and `backup.ts` extended (both would have failed silently), `startWorkoutFromRoutine` prefilling `repsMin` and copying notes, range restoration in `diffWorkoutAgainstRoutine`. **§12.16's routine-notes bug fixed** — `WorkoutSet.notes` now exists and is written, though nothing displays it yet. **`audit.json` was tracked and is now removed and gitignored.** Most of the session went on a phantom bug: Vite's transform cache served the app pre-edit `routines.ts` across a restart while console imports got the real file — two new §14 entries, and a fifth cause found only after running the UI path and the direct call side by side. **No UI, deliberately** — those screens should be born translated, so they wait for Phase 1. **No version bump; nothing here is visible to a user.** |
| 2026-08-22 (2nd) | **2.1.1** *(for real)* + *(Phase 1 on a branch)* | **The decimal-comma bug was found to be four-fifths unfixed, and 2.1.1 was found never to have been released.** The morning fixed `NumberField.tsx` and stopped; `ActiveWorkoutScreen`, `RoutineFormScreen`, `WorkoutDetailScreen` and `AddEntry` all hand-rolled `type="number"` and were still silently saving `67,5` as `675`. §5 already contained the grep that finds them and nobody ran it. All four fixed, parser lifted into **`src/data/numbers.ts`** as the single `parseDecimal()`, `AddEntry` moved onto `NumberField` outright. Separately: **no changelog entry had ever been written for 2.1.1**, so `APP_VERSION` had been reporting 2.1 while this document claimed otherwise — the entry now exists and covers both. **Set `×` removed** from the two screens whose set-type sheet already offers Remove set; `WorkoutDetailScreen` keeps its X because its type control is a `<select>`. **Phase 1: all six auth screens translated** in three tested chunks, plus `auth.ts`'s `friendly()` and `adopt.ts`'s `TABLE_LABELS` → `tableLabels()`; `i18n.ts` gained `plural()` and `tParts()`. Two non-i18n bugs found by reading them: `AccountScreen`'s duplicate `MIN_PASSWORD` and `AdoptScreen`'s locale-less `toLocaleDateString`. **Programs scoped against the real files** into the new §12.16 — weeks are a level the roadmap lacked, the example JSON has blocks above those, nothing links a workout to a scheduled day, and routine notes never reach a workout because `WorkoutSet` has no `notes` field. Released on `main` via cherry-pick, then merged back into the branch. |
| 2026-08-22 | *(committed, not released — see the row above)* | **Phase 1 started; its three blocking decisions taken** — hand-rolled i18n, enum-only exercise translation, bilingual auth emails (§12.13). **A live correctness bug found and fixed**: Chrome's `type="number"` silently *deleted* decimal commas, so `67,5` saved as `675` — released on its own as **2.1.1** rather than waiting for the phase (§13). **i18n layer built**: `i18n.ts` with a plain importable `t()` (not a hook — `dates.ts`, `rpe.ts` and `sections.tsx` all need it), flat dotted keys, `de.ts` typed against `en.ts` so a missing string fails the build, static catalogue imports measured at **+22 KiB precache** for both languages. `language` added to `syncState`, no Dexie version block needed, **not mirrored into `profile`** — the §12.13 mirror was dropped as not worth a schema change plus a mid-session language flip under last-write-wins. New `language` stage in `App.tsx` ahead of `onboarding`, detection from `navigator.language` **not IP**, `LanguageScreen` deliberately bilingual. `<html lang>` set dynamically, which is what stops Chrome offering to translate a German UI into German. **Translated**: first-run journey end to end, `Layout`, `HubScreen`, `sections.tsx`, `Settings`, `ui.tsx`, `dates.ts`, `rpe.ts`. Three module-level consts converted to functions to stop them freezing their language. All tested on a real phone via the branch preview; German copy fits at 360px including a four-tab bar. **On branch `phase-1-i18n`, not `main`** — a switch that translates only part of the app would read as broken. |
| 2026-08-19 (2nd) | *(unreleased, nothing user-visible)* | **§18's Phase 0 cleared, and decision 6 answered.** **GitHub Pages switched off** — all testers confirmed migrated; the rescue export is gone and that is irreversible (§12.3). **Email ceilings read off both dashboards and corrected**: Supabase is per *hour* not per day, and raising it flipped the binding ceiling from Supabase to Resend's 100/day — set to 25/h, reasoning in §12.4. **Two latent bugs fixed**: `pullGoals`/`pullProfile` compared ISO strings across the `Z` / `+00:00` boundary (now `Date.parse`; push side verified unaffected), and `downloadBackup` revoked its object URL before the download could start (anchor now attached, revoke deferred 1s). **3 high-severity `npm audit` advisories patched** via `npm audit fix`, lockfile only — all three build-time (`nanoid`←postcss←vite, `brace-expansion`←eslint and ←workbox-build, `fast-uri`←ajv←workbox-build), bundle hash identical before and after (§16). **`exercises.json` audited**: it carries `target` + `secondary` on all 1,324 records, `muscleGroups.ts` maps all 50 terms exactly, so the muscle heatmap and smart-swap are display jobs (§12.15). Reset-code brute-force bound quantified. **No version bump — nothing here is visible to a user.** |
| 2026-08-19 | *(no code)* | **Planning only — nothing was written, committed or deployed.** Eighteen screenshots of a paid competitor were audited into §12.14. A new requirement was set: **English and German with a user-chosen switch** (§12.13). Everything from that audit, from §12.11's menu and from §17's leftovers was combined into **§18, a ten-phase roadmap**, with a conflicts section listing what breaks what and how to fix it. Two orderings came out of it and drive the rest: i18n before feature work, and Programs before dashboard/checklist/schedule/streaks. Six decisions are recorded as still open at the end of §18. |
| 2026-08-18 | *(unreleased, nothing user-visible)* | **Content-Security-Policy shipped and enforcing** — `public/_headers` created, deployed report-only first, verified in incognito against a live food search, then flipped to enforcing (§12.12). Plus `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`. **iPhone barcode scanner confirmed working** by a tester, closing a twelve-day unknown. The rest of the session was research, written up in §12.11: Reddit feature scrape, AI cost modelling, funding options and the German legal position. **No feature decisions were taken.** |
| 2026-08-18 | **2.1** | **Routines rebuilt around per-set targets.** Migration `2026-08-17-routine-set-targets.sql` adds `routine_exercises.sets` (jsonb), `.notes`, `routines.notes` and `workout_sets.rpe`. Routine editor rewritten: per-set weight/reps/type, warm-ups, rest chosen from a sheet, notes, target RPE per exercise. `targetSets` — stored but never read since it was written — now drives set count and is derived on save. Routine targets prefill a workout only when there is no history for that exercise. Finishing a changed workout offers to write it back to its routine, listing what changed. Set completion keys on reps not weight, so bodyweight sets work. Rest timer moved to wall-clock, so locking the phone no longer freezes it; new ~2.2s chime. `OptionSheet` extracted to `components/`. Fixes: set-row alignment and the tick/untick shift, smaller red delete button, opaque header, empty number fields in the routine editor. |
| 2026-08-11 | **2.0** | **Custom SMTP via Resend** — apex domain verified with DKIM/SPF/DMARC, sending as `no-reply@upkeepdaily.com`. Password reset and signup confirmation built as 8-digit emailed codes (`ForgotPasswordScreen`, code stage in `RegisterScreen`). Four custom HTML email templates. Password-changed and email-changed notifications enabled. `PasswordField` with show/hide across all seven password inputs. `MIN_PASSWORD` moved into `auth.ts`. The cutover, farewell build and swipe fix finally announced in the changelog. |
| 2026-08-10 | *(unreleased, held for 2.0)* | **Cutover done — `upkeepdaily.com` is the app**, serving from `main` via Cloudflare Pages. Farewell build with self-destroying service worker and standalone rescue export left on GitHub Pages. `deploy.yml`, `CLAUDE.md` and the `cloudflare-pages` branch deleted. Onboarding swipe fixed on touch devices (`touch-action` on `.onb-slide`). |
| 2026-08-10 | *(unreleased)* | Sync verified on the real phone post-migration. Both §16 Worker questions answered. Feedback Worker rate-limited; feedback error handling fixed. Cloudflare Pages + `upkeepdaily.com` live on a branch, cutover not done. |
| 2026-08-10 | **1.9** | Composite primary keys `(user_id, id)` on twelve tables, two unique indexes rescoped to the user, six composite foreign keys. `schema.sql` rewritten to match. The accounts promise shipped and the Account and About copy strengthened. All three adoption modes tested. |
| 2026-08-09 | **1.8** | Password changing with re-auth, 8-character minimum on new passwords, hub greeting made reactive via `useLiveQuery`, name editing consolidated into Settings. |
| 2026-08-09 | **1.7** | Onboarding slideshow, install button and guide, new app icon set, About corrected and changelog collapsed. |
| 2026-08-09 | **1.6** | Accounts, automatic sync, per-table cursors, adoption, hub nudge. Merged to `main`, deployed, verified on phone. |
| 2026-08-03 | 1.5 | Care routines |
| 2026-08-03 | 1.4 | In-app dialogs, reordering |
| 2026-08-03 | 1.3 | Dark redesign |
| 2026-08-02 | 1.0–1.2 | Workouts, exercise library, progress |
| 2026-08-01 | 0.7–0.9.5 | Body weight, charts, food search, hub |
| 2026-07-31 | 0.3–0.6 | Meal logging, barcode scan, backup, rename to Upkeep |
| 2026-07-29 | 0.1 | First installable version |

### The 1.9 hold is over — resolved in 2.0

Everything shipped on 2026-08-10 after the 1.9 release — the cutover, the
farewell build, the `CLAUDE.md` removal, the swipe fix — was deliberately left
unversioned and unannounced until the account work was ready. **2.0 released all
of it in one entry**, on 2026-08-11.

The domain move and the swipe fix are both in 2.0's changelog, written for
users: a bookmark that still points at the old origin is the most user-visible
thing in the release. `APP_VERSION` derives from `CHANGELOG[0]`, so adding the
entry is what bumps the About screen — there is no separate version constant.

### What is sitting unreleased on `main`

Everything from the *first* 2026-08-18 session shipped in 2.1 as it was
finished. The *second* session's work — the CSP and the other three security
headers — is on `main` and deployed but carries no version bump, because nothing
about it is visible to a user. That is not a hold in the 1.9/2.0 sense; there is
simply nothing to announce. If it ends up folded into a later release, one plain
line covers it. Do not write "Content-Security-Policy" in a changelog.

**The same is true of 2026-08-19's second session.** Two commits sit on `main`
with no version bump: the timestamp and backup fixes, and the `npm audit fix`
lockfile. Neither is user-visible — one prevented a redundant no-op write, the
other a flakiness nobody had reported. **Deliberately kept out of the
changelog**, which is user-facing; "fixed an internal timestamp comparison" only
makes it noisier for testers. They live in §13, §14 and §16 instead.

**And of 2026-08-23, which is the largest unreleased thing yet.** Two commits:
the `audit.json` removal, and the entire Programs data layer. Sixteen tables now
sync where fourteen did, a Dexie version block ships, and a bug from 2.1 is
fixed — and **a user can see none of it**, because nothing renders a program and
`ActiveWorkoutScreen` has no notes area. There is nothing to announce until the
screens exist. When they do, the changelog line is about programs and schedules,
not about tables.

**One asymmetry worth naming, because it is new.** The CSP and the timestamp
fixes were invisible *and* inert. This is invisible but **not** inert: the
`version(2)` block runs on every tester's phone at their next open and creates
two empty object stores. Harmless, and v1 data is untouched — but §6 records
that Dexie does not downgrade, so this is the first commit on `main` that cannot
be safely reverted once a tester has opened the app against it.

### Changelog line — shipped 1.9

The line drafted before accounts existed, held back through 1.6, 1.7 and 1.8,
finally shipped on 2026-08-10 once a device could actually push into a second
account:

> *"Create an account to keep your data safe if you lose your phone"*

"Accounts are here —" was dropped from the original draft: 1.6 already opened
with that phrase, and the changelog would have announced accounts twice. The
promise was what mattered, not the framing.

`AccountScreen`'s copy was strengthened to match in the same release, and
`AboutScreen`'s backup note was widened from "clearing your browser data" to
also cover losing the phone and reinstalling — the install flow shipped in 1.7
means many users no longer think of Upkeep as a browser.

**The caveat that was accepted, consciously:** sync runs on the triggers in §8,
so a phone offline since its last write holds data the server has never seen.
"Keep your data safe" is true of everything that synced. Option B (hedging the
wording) was considered and rejected — the hedge bought little and a weak line
had been underselling a working feature for two versions.

---

## 16. Security posture

Reviewed 2026-08-09. Recorded because it drives real decisions, not as a
checklist.

**Threat model.** Who wants what, in likelihood order: someone holding the
unlocked phone; an attacker who gets JavaScript running on the origin; someone
abusing free-tier infrastructure; and untargeted automated scanning. Nobody is
specifically targeting a personal health tracker.

**What is solid**

- **RLS is the whole defence and it is correct.** All sixteen tables carry
  `using (auth.uid() = user_id) with check (auth.uid() = user_id)`. The common
  mistake is omitting `with check`, which lets an authenticated user insert rows
  tagged with someone else's `user_id`.
- **The anon key in the bundle is not a leak.** It is an identifier, not a
  credential. RLS is what enforces access.
- **§11 was RLS working.** That 403 was Postgres refusing to let one account
  update another's row. Sloppy policies would have let it through silently. The
  fix changed the keys, not the policies. Note the related finding: index
  enforcement sits *below* RLS, so a unique violation can report the existence
  of a row the caller is not allowed to read.
- No backend of our own, so no SQL injection surface. React escapes by default
  and there is no `dangerouslySetInnerHTML`. The GitHub PAT lives in a Worker
  secret, not the bundle.

- **A Content-Security-Policy is live and enforcing** since 2026-08-18 (§12.12).
  It does not prevent a compromised dependency from running — it prevents the
  result from being sent anywhere, via `connect-src`. `style-src` carries
  `'unsafe-inline'` by necessity; `script-src` is strict.

**Real gaps**

- ~~**No Content-Security-Policy.**~~ **CLOSED 2026-08-18, see §12.12.** Kept
  here because the reasoning still stands: it was impossible on GitHub Pages,
  which cannot set headers; after the 2026-08-10 cutover it was merely not done.
  Cloudflare Pages supports a `_headers` file, which at the time did not
  yet exist in the repo.
  See §12.3.
- **The Supabase session lives in localStorage**, readable by any JS on the
  origin. The httpOnly-cookie alternative needs a server. This is why the
  missing CSP matters — an XSS becomes full account takeover rather than
  something partial.
- **Supply chain is the realistic XSS vector**, not hand-written injection bugs.
  A compromised npm package runs with full origin access. Mitigations: keep the
  lockfile, run `npm audit`, do not add dependencies casually. Hand-rolling the
  onboarding carousel instead of pulling in Framer Motion was a security
  decision as well as a bundle-size one.
- **Physical access is total access.** Local-first, no app lock, and logout
  deliberately leaves local data. Correct default here, but an accepted risk
  rather than an unconsidered one.
- **Six-character passwords exist** on accounts created before 1.8.
- **Email confirmation is now ON** (2.0). Registering requires a code sent to
  the address, so accounts created from 2026-08-11 own their email. Accounts
  created before that were never confirmed.
- **The Resend API key is a live sending credential** for `upkeepdaily.com`. It
  is scoped to sending only and exists solely in Supabase's SMTP settings. A
  leak means someone can send mail as Upkeep — convincing phishing at your own
  domain, which DKIM and SPF would pass. Rotate it in Resend if ever exposed.
- **Reset codes are 8 digits and valid for an hour.** Brute force is bounded by
  Supabase's rate limits rather than by anything in the app. **Quantified
  2026-08-19 from the Rate Limits dashboard:** token verifications are capped at
  **30 per 5 minutes per IP**, i.e. 360 attempts an hour, against a space of
  10^8 codes that expire in that same hour. That is roughly a 0.0004% chance per
  IP per code lifetime. Settled, not a concern, and recorded as a number so
  nobody has to re-derive it.
- **Backups export as unencrypted JSON** — a complete health history sitting in
  Downloads.
- **No 2FA.** Supabase supports TOTP. Probably overkill.

**The two open questions — ANSWERED 2026-08-10, by reading both Workers**

Both send `Access-Control-Allow-Origin: '*'`. Neither rate-limited. But the
framing of the first question was wrong, and that matters more than the answer:

- **CORS is not an abuse control.** `Access-Control-Allow-Origin` is enforced by
  *browsers*. It tells a browser which pages may read a response. `curl`, a
  script and a scanner never consult it. Restricting it would stop other
  *websites* calling the endpoint from page JavaScript and would not inconvenience
  an abuser at all. Checking the `Origin` header server-side is marginally
  better and still forgeable outside a browser. **Do not record "tighten CORS"
  as a security task.** The real question is whether anything limits volume.
- **The search Worker's exposure is small.** Worst case someone uses it as a free
  Open Food Facts proxy and burns the Workers request quota, at which point the
  app's own search stops until the window resets. No secrets, no user data. The
  `q.length < 3` guard already turns away the laziest traffic. Still unlimited;
  accepted.
- **The feedback Worker is now rate-limited.** 3 requests per 60 seconds, keyed
  on `cf-connecting-ip`, checked *before* the GitHub call so a rejected request
  costs no PAT quota. Details and caveats in §12.9.
- **The PAT is well scoped**, which is what actually caps the damage: fine-grained,
  single repository `ash-git010/health-tracker`, *Issues read and write* plus
  *Metadata read*, no user permissions. A leak means someone can open and edit
  issues in one repo. No code, no Actions, no secrets.
- **⚠ The PAT expires Thu, 29 October 2026.** On that day in-app feedback stops
  silently: GitHub rejects the call, the Worker returns its 502, and testers see
  a generic failure. Nothing surfaces this in the app. **A calendar reminder for
  ~15 October is the entire mitigation** — considered and rejected on
  2026-08-19: regenerating early only throws away validity and forces a Worker
  secret rotation for no gain. This is now the only open Phase 0 item.

**Still open**

- ~~`npm audit` reports **3 high severity vulnerabilities**.~~ **CLOSED
  2026-08-19.** Patched with `npm audit fix` — semver-compatible only, no
  `--force`, lockfile touched and `package.json` untouched. `npm audit` now
  reports zero.

  **The more useful finding is why they were never the largest open item on this
  front, which is what this document claimed for nine days.** All three were
  transitive under dev tooling, confirmed with `npm ls` before touching
  anything:
  - `nanoid` ← `postcss` ← `vite`
  - `brace-expansion` ← `minimatch` ← `eslint`, and ← `filelist` ← `jake` ←
    `ejs` ← `workbox-build` ← `vite-plugin-pwa`
  - `fast-uri` ← `ajv` ← `workbox-build` ← `vite-plugin-pwa`

  None was in the runtime graph. **Proved twice:** `npm ls` showed a single
  dev-only path for each, and the production bundle hash was *identical* before
  and after the patch (`index-ChvkPos1.js`, precache 12 entries / 2473.13 KiB
  both times). If any had shipped, the hash would have moved.

  **The lesson, which outlives the fix: read the dependency path before ranking
  an advisory.** This threat model is about a package running with *origin*
  access — reading `localStorage`, reaching the Supabase session. A
  denial-of-service in a CSS id generator or a lint pass is a hung build, not an
  account takeover. Three "high severity" labels were carried as the top
  security item on the strength of the label alone, and ten minutes of `npm ls`
  would have said otherwise at any point.

  **What has not changed:** supply chain is still the realistic XSS vector, and
  the CSP still does not fix it — it limits what a compromised package can do
  with what it steals, it does not stop the package being vulnerable. The 65
  production dependencies are the ones that matter, and `npm audit` currently
  reports nothing against them.
- **No account deletion**, which is both a user-facing gap and a hard app store
  blocker. See §12.11.
- **A compromised email address still has no self-service recovery**, and will
  not until the email-change flow is designed with that in mind (§12.4).

---

## 17. How to start

**Read `CLAUDE.md` first — it is at the repo root and Claude Code loads it
automatically. Then read §19 of this file for the session protocol, then this
section.** `CLAUDE.md` holds the rules; this file holds the history and the
current state. Where the two disagree, this file is more current, because it is
updated every session and `CLAUDE.md` is not.

**Then run `git status` and `git branch --show-current` before anything else.**
The working branch is **`phase-1-i18n`** unless explicitly told otherwise, the
tree should be clean, and a surprise on either is worth stopping for.

**Ask me what I want to work on first.** I usually arrive with something
specific, and it is usually more current than any list here. Three sessions
running have begun by emptying a backlog out of my head — the workout one into
§12.10, the public-release one into §12.11, the competitor one into §12.14.
Assume there is a new one anyway.

**⚠ THE PRIORITY CHANGED ON 2026-08-23 (2nd). READ §12.17 BEFORE §18.**

**⚠ THE FOUR-CHUNK WORKOUT REBUILD FROM §12.19 IS NOW COMPLETE.** All four
chunks (data layer; program import/management/manual-editor UI; the Log tab
rebuild; swap-exercise/substitutes/final sweep) are built, hand-tested
through the actual UI, and committed on `phase-1-i18n` — do not redo any of
them, do not re-scope. Read §12.19 in full before touching the workout
section again; do not re-derive its decisions. ~~**Next up, per the "After
workouts" note below: body, care routines, About/Feedback/Install, then the
bilingual Supabase email templates and the `changelog.ts` decision** — the
remainder of Phase 1.~~ **Body, care routines and About/Feedback/Install are
now DONE too, 2026-08-24 (6th) — see the new §15 row.** What's left of Phase 1
is only the bilingual Supabase email templates and the `changelog.ts`
decision. Confirm with the owner before starting either, per usual.

**The workout section is the next thing, completely — every screen and all the
Programs UI — and it comes before the rest of the translation work.** That
reverses §18's first non-negotiable ordering. It was taken deliberately, for a
reason §18 never weighed: the app is meant to be *used*, and the workout section
is the part that is not yet the way its owner wants it. §12.17 has the decision,
what it costs and the mitigation.

**The mitigation is the important half, so it is repeated here.** The workout
section is *simultaneously* the biggest remaining i18n block and the thing being
rebuilt. Touching those screens twice costs more than touching them once, so:
**work on `phase-1-i18n`, and write every new and rebuilt workout screen with
`t()` from the start.** Born translated, as originally intended, arriving in a
different order. Do not start this on `main`.

**One decision is open and belongs at the front of that work** (§12.17): whether
to finish body, care routines and About — five or six small screens — before
merging to `main`, or to merge partially translated. Recommendation is to finish
them first; the priority is speed, so it is the owner's call.

**Read §12.16 before writing a line of Programs UI.** Seven decisions are taken
and the data layer is built and round-tripped. Do not re-derive any of it.

**Two things to plan for in the workout section:**

- **It needs real plural work** — "3 sets", "12 reps", "2 exercises". English
  gets away with an inline `n === 1 ? …` and that pattern is already scattered
  across those screens. **`plural()` exists in `i18n.ts`** and was used for the
  first time in anger in `ChartsScreen` on 2026-08-23 (2nd). Use it; do not add
  more ternaries.
- **Grep every file for a `t` shadow before adding the import.**
  `BarcodeScanner.tsx` had two, in `forEach((t) => t.stop())`. §14 records the
  same trap in `Layout.tsx`. It produces **no build error** — `t('…')` silently
  resolves to whatever the loop variable is.

~~**After workouts:** body, care routines, About / Feedback / Install, then the
bilingual Supabase email templates and the `changelog.ts` decision. That is all
that is left of Phase 1.~~ **DONE 2026-08-24 (6th)**, except the email
templates and the `changelog.ts` decision — see the new §15 row and the
updated paragraph above.

~~**The next block is the six auth screens.**~~ **DONE 2026-08-22 (2nd).**
~~**The next block is meals.**~~ **DONE 2026-08-23 (2nd)** in five tested
chunks, and **decision 17 is answered** — `commonFoods.ts` keeps English names,
German lives in `keywords`, because a common food's name becomes a `Food` row
and then a permanent `logEntry.foodName` snapshot. Reasoning in §12.13; do not
re-derive it.

**§12.11 is still a menu, not a plan.** §18 sequences several of its items but
decides none of them. If I point at something in either, treat it as a fresh
decision rather than a commitment already made.

**Two decisions are open at the end of §18**, down from five. Decisions 1, 2 and
3 were all taken on 2026-08-22 — hand-rolled, enum-only, bilingual emails — and
the reasoning is in §12.13 rather than being re-derivable from the
recommendations. What survives: account deletion timing, and computed goals.

~~**A larger set opened on 2026-08-22 (2nd), all inside Programs.**~~ **ALL SIX
ANSWERED 2026-08-23, and the data layer for them is built and on `main`.**
§12.16 carries every decision and the reasoning; §18's Phase 3 points at it.
**Do not re-derive any of them.**

**So Programs is now half-built, and the half that remains is entirely UI.**
Nothing renders a program, creates one, edits a schedule, or sets a rep range,
and `ActiveWorkoutScreen` has no notes area. That is deliberate: those screens
should be **born translated**, which is the whole argument §12.13 rests on, so
they belong after Phase 1 merges rather than before.

**Which makes Phase 1 the thing standing in front of everything else again.**
The meals block is next, `commonFoods.ts` needs its decision (17), and
`adopt.ts` will conflict on merge because `main` has just added two entries to
`TABLE_LABELS` while the branch has converted it to `tableLabels()`. Resolving
that means the function form plus two catalogue keys, "Programs" and "Scheduled
days", in `en.ts` and `de.ts`.

**One thing to do before Programs reaches testers, and it needs a second
account rather than a session:** push `programs` and `program_days` from a
device already synced with a different account. §13 explains why the round trip
done on 2026-08-23 does not cover it.

**Two new smaller ones opened in their place**, both inside Phase 1 and neither
blocking: whether `changelog.ts` gets a `changesDe` fallback or a full backfill,
and whether the sub-second English flash on the `checking` stage is worth a
`localStorage` mirror.

**The sixth was never a decision, and it is now closed.** The exercise seed
*does* carry `target` and `secondary`, on all 1,324 records, and
`muscleGroups.ts` already maps every one of the 50 terms correctly. Read
**§12.15** rather than re-deriving it. Two Phase 7 features got smaller.

**Phase 0 emptied this list on 2026-08-19.** GitHub Pages is off, `npm audit` is
clean, the email ceilings are set and — more importantly — read off both
dashboards and written down correctly. **Account deletion and email change are
the two survivors**, and both now live in §18's Phase 10 rather than here.

**One thing that needs a person rather than a session, and it is now in
`PRIVATE-NOTES.md` rather than here:** two real-world steps have to happen
before any donation link or public release. Nothing in the codebase blocks on
them, but the decision does. Read that file when the question comes up.

**New testers are unblocked.** The rule was no new people until password
recovery existed. It shipped in 2.0, so onboarding can start whenever I want.

**One dated thing left:** the GitHub PAT expires **29 October 2026** (§16), and
nothing in the app will say so when it does — feedback just starts failing
generically. A calendar reminder for **~15 October** is the entire mitigation.

**GitHub Pages is off**, done 2026-08-19 (§12.3). Do not go looking for it, and
treat any surviving reference to `deploy.yml`, a `base` path or the farewell
build as stale.

Branch state at handover: **`main` plus `phase-1-i18n`.** `main` is deployed to
`upkeepdaily.com` on every push, automatically; non-production branches get a
Cloudflare preview URL, which is how Phase 1 has been tested without shipping a
half-translated app to testers.

**`phase-1-i18n` carries ten commits plus two merges** as of 2026-08-23 (2nd):
the i18n core plus Settings; the first-run journey plus shared modules;
navigation plus hub plus sections; **the six auth screens**; **the number-field
fixes**; a merge of `main`; **five meals commits** — Today and Add Entry, food
list and search, the food form, the barcode scanner, goals and charts — and a
**second merge of `main`** bringing the Programs data layer across. None carries
a version bump — nothing is shippable until the app translates end to end.

**The branch and `main` are now level on data.** The second merge produced
exactly one conflict, in `adopt.ts`, resolved to the function form with the two
Programs entries added; `db.ts` auto-merged silently, carrying the Dexie
`version(2)` block onto the branch. See §4. **The branch preview's IndexedDB
will run that version block for the first time** on next open and create two
empty object stores — harmless, and worth one smoke test before building on top
of it.

**The number-field work was committed on this branch first and cherry-picked to
`main`**, because `git checkout main` refused to carry it across: the branch had
already changed `ActiveWorkoutScreen.tsx` and `RoutineFormScreen.tsx` for
`rpeOptions()`. `main` was then merged back in, so the two are level. §14 records
both the wrong assumption that led there and why the cherry-pick did *not* drag
i18n work onto `main`.

**Both branches build clean.** `main` precaches **2,475.45 KiB** as of
2026-08-23, up from 2,473.50 before the Programs work; the branch is at
2,498.66 and has not moved. See §3, where these are recorded as the cheap check
that an edit or a merge did what it looked like it did.

**`main` gained two commits on 2026-08-23**: the `audit.json` removal, and the
Programs data layer across seven files. Neither carries a version bump.

The second 2026-08-19 session added two commits to `main`: the timestamp and
backup fixes, and the `npm audit fix` lockfile. Neither carries a version bump
and neither is user-visible — the production bundle hash was unchanged
(`index-ChvkPos1.js`, precache 12 entries / 2473.13 KiB), which was itself the
evidence that the audit fix touched nothing that ships.

**The database is ahead of nothing and behind nothing.** Both
`2026-08-17-routine-set-targets.sql` and `2026-08-23-programs.sql` are applied
to the live project, are in the repo, and `schema.sql` was updated in the same
session as each. If a future session finds those three disagreeing, `schema.sql`
is the one most likely to be stale.

**The database is, however, ahead of the `phase-1-i18n` branch's client** — that
branch has no `programs` table locally and no v2 Dexie block. Harmless: the
extra Postgres columns are nullable and the extra tables are simply never
queried, which is the whole point of writing migrations additively. It stops
being harmless if that branch is ever deployed to testers before the merge.

~~Before writing code, ask for whichever files are relevant.~~ **SUPERSEDED
2026-08-24: read them.** They are on disk now. Several have changed a lot and
any assumption about them is likely stale. The file structure in §4 tells you
what exists and where. **The whole class of failure below — reasoning from this
document about code — has no excuse left**, and that makes it more embarrassing
rather than less likely, so the rule is worth restating: **open the file.**

**And read §1 before starting.** The rule earned its keep repeatedly on
2026-08-10. Before the cutover: a document's claim about the Workbox limit was
contradicted by a file already pasted in the conversation; a doc sentence about
dashboard *visibility* was reported as being about dashboard *capability*; and a
§13 entry naming the wrong table survived until someone read `careRoutines.ts`.
During the cutover: a pasted `vite.config.ts` turned out to be the wrong
branch's, which retro-explained a `grep` that had quietly run against the wrong
branch too; `_headers` and `_redirects` were assumed to exist and never had; and
a Google Fonts `<link>` written from memory was wrong, because the font is
bundled via `@fontsource`.

**On 2026-08-18 the pattern held, in a smaller way.** A file was pasted into the
conversation whose text did not reach the assistant — only its path did — and
the assistant read it off disk rather than claiming it could not see it. Twice,
a claimed edit ("the alignment is a CSS problem") was held as a hypothesis until
`index.css` was actually read, and the real cause turned out to be two separate
things rather than the one that was guessed. **Ask for the file. Do not reason
from the document about code.**

**On 2026-08-11 the same pattern repeated, three times, all in this document:**
this file recorded 6-digit codes as a design constraint and they are 8; it
recorded provider free-tier limits that were wrong in shape; and it implied
password-change notifications would need a Worker when Supabase has them built
in. Each was caught only by testing or by reading the actual dashboard. **A file
in front of you beats this document. This document beats memory.** Where this
document states something untested, it now says so — treat those as questions,
not facts.

---

## 18. The roadmap (written 2026-08-19)

Combines three sources: the competitor screenshot audit (§12.14), §12.11's menu,
and everything §17 used to list. Plus the bilingual requirement (§12.13).

**This commits to an order, not to shipping every item.** If I point at
something here, it is still a fresh decision. The value is the dependency map.
Nothing below has been written against the actual files — every phase names what
needs reading before it can be scoped. §1's rule stands: **ask for the file,
don't reason from this document about code.**

### The two orderings that are not negotiable

**⚠ Ordering 1 was consciously overridden on 2026-08-23 (2nd). See §12.17.**
The argument below is still correct as engineering; it was set against a cost it
never weighed, which is an app its only daily user cannot use the way they want.
The workout section — Programs UI included — now comes before the rest of the
translation work, and is being written on the i18n branch with `t()` from the
start so the screens are still born translated. Ordering 2 is untouched.

**1. i18n is a build constraint.** Same shape as the CSP. Roughly 40 screens
exist today; every phase adds more. Retrofit once, at the start, not later
against an app twice the size. See §12.13.

**2. Programs is the keystone.** Five things read program state: the weekly
schedule, dashboard "Today's Workout", workout streaks that rest days don't
break, the daily checklist, and progress-page adherence. Today `routines` is a
flat list with folders and `workouts.routineId` has no foreign key. Build any of
those five before Programs and you build them twice.

Everything else can be reshuffled.

### Phase 0 — housekeeping — DONE 2026-08-19

Cleared in one session. One item survives and it is a calendar entry.

| Item | Status | Source |
|---|---|---|
| ~~Turn GitHub Pages off~~ | **DONE.** All testers confirmed migrated first. Irreversible; the rescue export no longer exists | §12.3 |
| ~~`npm audit` — 3 high severity~~ | **DONE.** All three build-time, patched, bundle hash unchanged. Was never the largest security item — the severity label was doing the ranking | §16 |
| ~~Raise email rate ceilings~~ | **DONE, and the premise was wrong.** Supabase is per *hour*; raising it made **Resend** the binding ceiling. Set to 25/h | §12.4 |
| **PAT expiry 29 Oct 2026** | **OPEN — the only survivor.** Calendar reminder for ~15 Oct is the whole task | §16 |
| ~~`pullGoals`/`pullProfile` string timestamps~~ | **FIXED.** Push side verified unaffected | §14 |
| ~~`downloadBackup`'s premature `revokeObjectURL`~~ | **FIXED.** Anchor attached, revoke deferred 1s | §13 |

### Phase 1 — language infrastructure — IN PROGRESS 2026-08-22

**Unblocked — decisions 1, 2 and 3 taken.** Infrastructure built, ~1/3 of the
app translated, all of it on branch `phase-1-i18n`. Full state in §12.13; the
conventions it established are in §5 and must be followed by every later phase.

Done: `i18n.ts`, both catalogues, `language` on `syncState`, the `language`
stage, `LanguageScreen`, the Settings switch, the first-run journey, `Layout`,
`HubScreen`, `sections.tsx`, `ui.tsx`, `dates.ts`, `rpe.ts`. Plus the decimal
comma fix, released separately as 2.1.1.

**Updated 2026-08-22 (2nd): the six auth screens are done**, along with
`auth.ts`, `adopt.ts` and the `plural()` / `tParts()` helpers.

**Updated 2026-08-23 (2nd): the entire meals section is done**, in five tested
chunks, and **decision 17 is answered** (§12.13). `AddEntryScreen.tsx`,
`FoodSearchScreen.tsx`, `overview.ts` and `goals.ts` needed no work at all.

Remaining: **workouts** (now merged into the workout rebuild — see §12.17),
body, care routines, About / Feedback / Install, the bilingual Supabase email
templates, and the `changelog.ts` decision.

**⚠ This phase no longer runs to completion before the feature work.** §12.17
reordered it: the workout section is finished first, with its screens written
translated as they are built. Body, care routines and About are what is left
over, and whether they are finished before merging to `main` is the one open
question in §12.17.

### Phase 2 — food logging friction

The best catch in the whole screenshot audit is a flow bug, not a feature:
**adding a food does not log it.** You then have to go find it in the Foods list.

- **Search / scan / create → amount prompt → logged immediately.** Adding from
  the *Foods tab* still only creates a library entry; adding from the *log* flow
  logs it. Two entry points, two outcomes, both correct.
- **Quick Log** — calories/protein/carbs/fat as a one-off with no Food row.
  `log_entries.food_id` has no foreign key (§8, deliberate) so this fits, **but
  every screen resolving an entry to its food must tolerate the absence.** Read
  `overview.ts`, `TodayScreen.tsx` and the chart code before writing.
- **Per-meal calorie and protein badges** on collapsible meal sections, each
  with its own subtle colour.
- **"Often logged for breakfast"** — foods ranked by frequency *per meal slot*.
  `exercisePopularity.ts` is this exact pattern for exercises; copy it.

All four are independently testable and none needs a new table.

### Phase 3 — Programs and the weekly schedule — DATA LAYER DONE 2026-08-23

The keystone, and the largest single phase here. **Roughly half built.**

**⚠ READ §12.16 BEFORE THIS SECTION.** It carries every decision, the reasoning,
what was built, what was tested and what was not. Everything below was written
on 2026-08-19 without reading any code and is superseded wherever the two
disagree.

**Done:** the migration, both tables, four columns, the Dexie v2 block, all sync
mapping, `adopt.ts` and `backup.ts`, the `repsMin` prefill, the range
restoration on write-back, and the routine-notes fix. All on `main`, all
round-tripped, none of it visible to a user.

**Remaining, and all of it UI:** a program list and editor, the weekly schedule
view, making a program active, the Log tab taking over when one is, missed-day
and gated-progression display, the crown, and the JSON import. Plus the seed
mechanism for predone programs.

~~**These screens should be born translated, so they wait for Phase 1.**~~
**SUPERSEDED 2026-08-23 (2nd) — see §12.17.** They no longer wait; this phase
was pulled to the front. **They are still to be born translated**, which is why
the work happens on `phase-1-i18n` with `t()` used from the first line rather
than on `main`. The original reasoning stands and is only being satisfied in a
different order: writing roughly ten new screens untranslated and retrofitting
them is the exact cost §12.13 exists to avoid.

**The schema cost warning below has been paid, not avoided.** It was accurate:
two tables meant composite keys, RLS policies, a composite foreign key, `TABLES`
positions, sync cursors and a Dexie version block. Two places it did not
mention, and both would have failed silently, were `adopt.ts`'s hand-written
`LOCAL_BY_SERVER` map and `backup.ts`'s literal table list. **Add those to the
list for Phase 8's two tables.**

A program owns ordered days; each day is a routine or a rest day; the app knows
which day is today and what comes next; the order is editable.

**Schema cost, stated plainly:** new `programs` and `program_days` tables means
composite primary keys `(user_id, id)`, RLS policies, a composite foreign key,
correct positions in the `TABLES` push order (**parents before children — §8
calls this load-bearing and it has broken before**), new sync cursors, and a new
Dexie version block. Five places this project has already been bitten.

**Existing routines and folders must keep working.** A program is an *optional
parent*, not a replacement — a routine with no program behaves exactly as it
does today. Folders may end up redundant; deprecate them later, separately.

**Predone programs** ship in this phase as a seed JSON loaded the way
`exercises.json` is — dynamic import, module-level cache, never written to
Dexie. Ship the mechanism here even if the content lands later; writing
genuinely good programs is a domain job and must not block the phase. The seeds
need German too.

### Phase 4 — onboarding and the goal engine

Height, weight, experience, goal (lose fat / build muscle / recomp / strength)
→ calorie and macro targets, a start date, and a projected finish date.

**This needs no AI.** Mifflin-St Jeor plus an activity multiplier plus a goal
delta is arithmetic, and it is what the "scientifically approved" apps are
actually running. Zero marginal cost, works offline, no `connect-src` entry.

**Schema:** `goals` is a singleton (§8 — `user_id` as the primary key, no `id`,
no `deleted_at`). Add `startedAt`, `startWeight`, `targetWeight`, `goalType`,
`activityLevel` and the range fields **to it** rather than creating a table.
Non-indexed locally, so **no Dexie version block is needed** — Dexie stores
whole objects (§6). Additive and nullable server-side, so an older client keeps
working.

**Range targets** (1750–1850 cal, 89–151 g protein) are part of the same shape
change.

**Settle first:** `GoalsScreen` takes typed-in numbers today. Computed targets
have to coexist with a manual override — the competitor has exactly this
("Override Nutrition Targets"). §5's *one editable home per piece of data*
applies, and §14 records what happened last time two editing surfaces appeared
for the same field.

### Phase 5 — dashboard, checklist, streaks

Cheap, because Phases 3 and 4 did the work.

Dashboard with today's workout, today's checklist and a weekly calendar strip;
checklist items derived from the program and the goals; per-section streaks.
Care routines already have streak logic with non-breaking skip days — a workout
streak needs rest days not to break it, which is precisely what Phase 3 gives.

**One design note:** the competitor shows *one* prominent streak. Four counters
competing on one screen is worse than one. Consider a single headline streak
with per-section ones living inside each section.

### Phase 6 — layout, spacing and the light theme

The "it looks crowded" work. Mostly `index.css`, not screen rewrites — see
§12.14 for what is actually doing the work in their screenshots.

**Light theme cost depends entirely on whether §5's rule held** — *inline styles
for one-off layout, never for colours*. If it did, this is a CSS-variable swap
plus an audit. If it did not, it is a hunt. **Verify by reading `index.css` and
grepping `src/` for colour literals. Do not assume either way** — §14 has three
separate entries about assuming what a file contains.

"Very subtle rose, mostly white" is the right instinct; a pure-white light theme
next to `#0a0a0f` reads as two different apps.

**Three things the light theme touches outside CSS**, none a blocker and all
easy to discover too late: `theme_color` in the PWA manifest (a change means a
new WebAPK, and §9 records that Android caches manifest data and icons hard at
install time); the four custom HTML email templates, which are dark-themed
(§12.4); and the app icon, which assumes a dark ground.

### Phase 7 — workout screen

- **Floating rest-timer bar** instead of a row on every exercise card. Also
  fixes §12.10's note that the RPE row makes each card two lines taller.
  **Re-confirmed as wanted on 2026-08-22 (2nd)**, independently and for the same
  reasons — worth noting that two separate sessions arrived at it unprompted.
- **Add-exercise moved left of discard/finish.** Also re-confirmed 2026-08-22
  (2nd). Today it is a `<Fab>`, and discard/finish sit in `.workout-sticky`.
- **The crown on a best set** — **decided 2026-08-23, zero schema, ready to
  build.** All-time PR per exercise, animating beside the set number on tick,
  persisting on the row for the session and clearing on untick. Weight, then
  reps, then first set. Reuses `workoutStats.ts`'s history rather than a new
  query — but note it deliberately ranks differently from `recentPRs`. See
  §12.16.
- **Swap exercise mid-workout**, suggesting sensible alternatives.
- **Target-muscle breakdown** on the routine, heatmap-style with percentages.
- **Time-based exercises** — §12.10's deferred item, still needing the "what
  does volume mean for a plank" decision before any code.
- ~~**Number-field coercion audit** across the app (§12.10).~~ **DONE
  2026-08-22 (2nd)** and it turned out to be urgent rather than tidy-up: four
  screens were silently corrupting decimals. See §13. **What survives for this
  phase is only the cosmetic half** — deleting the now-dead `min`/`max`/`step`
  props from `NumberField` and its call sites, and the dead `.set-delete` rule
  in `index.css`.

**~~One file read gates two of these.~~ Read and answered 2026-08-19 — see
§12.15, and do not re-derive it.** The seed carries `target` *and* `secondary`
on all 1,324 records, the types already carry them through `allExercises()`, and
`muscleGroups.ts` normalises all 50 raw terms into 11 groups with verified
complete coverage. **So "Back 40%" is real, not a degraded set count, and both
features are display work.** The heatmap needs an SVG body diagram plus an
aggregation query; smart swap can match on `groupFor(target)` + `equipment`
today with no new data.

**Always route muscle strings through `groupFor()`.** `target` and `secondary`
use different vocabularies for the same muscles — a naive union renders
`shoulders` and `delts` as two regions. §12.15 has the synonym table and three
small follow-on decisions (missing `Forearms`, the `adductors`/`abductors`
split, and what to do with the undrawable `Other` bucket).

**Rest-timer notifications are partly possible — do not promise them.** §13
records that a backgrounded PWA freezes timers, which is exactly what a rest
timer needs. A notification while the app is open is fine; a reliable one on a
locked phone needs Capacitor. Build the bar now, treat the notification as a
Capacitor deliverable.

### Phase 8 — meals, recipes, micronutrients

- **Saved Meals** — a named group of foods logged in one tap. The simpler half;
  do it before recipes.
- **Recipes** — ingredients resolved to per-100g macros.
- **Micronutrients** — fiber, sugar, cholesterol, vitamins. Fits the per-100g
  rule (§5). Open Food Facts coverage is patchy, so **render only nutrients
  that are actually present**; a screen of zeroes reads as broken.

Two more tables: composite keys, RLS, FKs, `TABLES` ordering, cursors, Dexie
version block.

### Phase 9 — ranks, badges, progress photos

**Ranks and badges, with one hard condition: derive them entirely from existing
data.** No XP column, no achievements table. Computed from workouts, streaks and
logs, it is deletable the day it stops feeling good and it costs zero schema.
The moment it gets a table it is permanent.

**Progress photos — local-only is the way in.** Photos live in IndexedDB, never
sync, never touch Supabase Storage. That sidesteps §12.11's blocker completely:
the 1 GB free tier, and photos being the one thing that would make egress a real
cost.

The caveat needs saying in the UI — *"photos stay on this phone"* — because it
sits awkwardly next to the app's own "create an account to keep your data safe"
line (§15). Folding them into `exportAll` via base64 would make a backup
enormous; a separate "export photos" action is the better shape.

### Phase 10 — account deletion, native shell, AI

**Account deletion.** Still the most consequential unbuilt thing, and it gets
*more* expensive with every table above — programs, program days, meals and
recipes all join the cascade. Two options:

- Build it now, before the new tables, and extend it each phase.
- Build it after the schema settles, as a **generic sweep over the `TABLES`
  array**, so future tables are free.

The second is better engineering; the risk is forgetting. Hard Apple submission
blocker either way (§12.11), and §14's rule about designing a test that can
actually detect the thing applies here harder than anywhere.

**Capacitor**, which unlocks what a PWA structurally cannot do: scheduled
notifications, reliable rest-timer alerts, Health Connect for steps and weight.
Health Connect is Android-only; there is no iOS equivalent without the $99/year
account.

**AI chat last.** §12.11's cost model is unchanged — AI is the only line item
that scales without bound. §12.6's regex-first plan stands and gained the
offline argument. Either path needs `api.anthropic.com` in `connect-src`
(§12.12) or it fails in production only.

### Conflicts and mismatches

Found by combining the three lists. Ordered by damage if missed.

**Serious — these change the plan**

1. **i18n retrofit cost compounds.** Every phase adds screens. → Phase 1 first;
   new screens born translated, old ones catch up progressively.
2. **Programs invalidates five downstream features.** → Phase 3 before Phase 5,
   non-negotiable.
3. **Account deletion gets more expensive every phase, and two of the four
   proposed tables now exist.** Sixteen tables, not fourteen. → Build it as a
   generic sweep over `TABLES`, not eighteen hand-written deletes. **The
   2026-08-23 session is the argument for the sweep**: adding two tables meant
   touching `sync.ts`, `adopt.ts`'s hand-written map *and* `backup.ts`'s literal
   list, and two of those three would have failed silently if forgotten.
4. **Auth emails cannot easily be per-user localised** (§12.13). → Bilingual
   templates. No code.
5. **The exercise dataset is English-only, all 1,324** (§12.13). → Translate the
   `bodyPart`/`equipment` enum first; optional `nameDe` with fallback later if
   wanted.

**Moderate — a decision, not a redesign**

6. **German decimal commas vs `NumberField`** (§12.13). → Locale-aware parsing
   in Phase 1.
7. **Computed goals vs the manual `GoalsScreen`.** Two editing surfaces for one
   field is what §5 forbids and §14 records happening before. → Computed is the
   default; the override is visibly an override.
8. **Quick Log entries have no food.** → Read `overview.ts`, `TodayScreen.tsx`
   and the charts first. Cheap if caught early, a scatter of null crashes if not.
9. **Light theme touches manifest, emails and icon.** → Listed in Phase 6 so it
   is not found at the end.
10. **German text is 30–40% longer.** → Test the worst offenders in German
    early. Most likely thing to pass review and break on a phone.

**Minor — worth recording, not worth planning around**

11. **Exercise images would blow the precache.** 1.65 MB bundle plus an 840 KB
    dataset, precache 2,455 KiB; 1,324 images is not viable. A small curated
    set, lazy-loaded and excluded from precache, is the only version that works.
    Remote images need a CSP `img-src` entry. Licensing is the real blocker,
    not code.
12. **Four streak counters compete for attention.** See Phase 5.
13. **Micronutrient coverage in OFF is patchy.** Render only what exists.
14. **Folders may become redundant once programs exist.** Deprecate separately.
15. **Progress photos vs the "keep your data safe" promise.** Copy problem, not
    a code problem.
16. **Every new table needs its `TABLES` position right** — parents before
    children (§8) — **and two other files that are easy to forget.**
    `adopt.ts`'s `LOCAL_BY_SERVER` is hand-written and keyed by server name; a
    miss means `keep-account` leaves the old account's rows on the device, on
    the one path that destroys local data. `backup.ts` lists its tables
    literally; a miss means every export silently omits them. A dev guard
    catches the first. **Nothing catches the second.**

### Decisions open at the end of this session

1. ~~**i18n: library or hand-rolled?**~~ — **ANSWERED 2026-08-22: hand-rolled.**
   ~60 lines. See §12.13, and note the sub-decision that went the other way from
   its first argument: catalogues are **static** imports, not dynamic
2. ~~**German exercise names: enum-only, partial, or full?**~~ — **ANSWERED
   2026-08-22: enum-only.** 38 strings. The deciding argument turned out to be
   search-index cost, not string count (§12.13)
3. ~~**Auth emails: bilingual or English-only?**~~ — **ANSWERED 2026-08-22:
   bilingual, English block on top.** Not yet done — it is dashboard template
   editing, not code
4. **Account deletion: now and extended, or later as a generic sweep?** —
   recommendation: later, generic
5. **Computed goals: default-with-override, or suggestion?** — no recommendation
6. ~~**Does the exercise seed carry primary/secondary muscles?**~~ —
   **ANSWERED 2026-08-19, §12.15. Yes, on all 1,324 records**, and
   `muscleGroups.ts` already normalises all 50 terms correctly. Both Phase 7
   features are display jobs. Three small follow-on decisions came out of it
   (`Forearms` is missing from `MuscleGroup`; `adductors` vs `abductors` are
   inconsistently bucketed; `Other` cannot be drawn) — all in §12.15, none
   blocking

**Six opened on 2026-08-22 (2nd), all inside Programs. ALL SIX ANSWERED
2026-08-23 and built. Full reasoning in §12.16 — do not re-derive:**

9. ~~**Weeks: column or third table?**~~ — **column.** `week` on `program_days`,
   `repeats` on the program. A sub-question nobody had written down was settled
   with it: a week is **seven calendar days** anchored on `programs.startedOn`,
   not an ordered list — which is what makes "missed" mean anything
10. ~~**Blocks: modelled or flattened?**~~ — **dropped entirely.** Nothing in the
    feature set reads a block; the import folds the labels into `programs.notes`
    so nothing is silently lost
11. ~~**How does a logged workout link to its scheduled day?**~~ —
    **`workouts.programDayId`**, nullable, no foreign key, stamped only when
    started from the schedule. It needed a second field nobody had named:
    `startedOn`, because a repeating program satisfies the same day row every
    week and the column alone is ambiguous
12. ~~**Rep ranges on `RoutineSet`?**~~ — **yes, and far cheaper than this list
    assumed.** `RoutineSet` lives inside `routine_exercises.sets` as jsonb, so it
    cost no migration and no Dexie block. Reference only: a logged set keeps one
    number, prefill takes `repsMin`, and the write-back restores the range
13. ~~**The crown: session best or all-time PR?**~~ — **all-time**, per
    exercise, animating on tick. Tiebreak filled: weight, then reps, then first
    set, so 100 × 5 beats 80 × 12. **This deliberately disagrees with
    `recentPRs`,** which ranks by Epley 1RM — see §12.16 and §13
14. ~~**`Routine.notes` on the active workout?**~~ — **read-only**, never
    copied. `RoutineExercise.notes` → `WorkoutSet.notes` was the separate half
    and is built

**Two more from the morning of 2026-08-22, both inside Phase 1 and neither
blocking:**

15. **`changelog.ts`: `changesDe` fallback, or backfill all 26 releases?** —
    recommendation: optional `changesDe?: string[]` rendered as
    `changesDe ?? changes`, bilingual from 2.2 onward, backfill never or later
16. **The `checking`-stage English flash: accept it, or mirror the language into
    `localStorage`?** — no recommendation. Sub-second, on a screen showing one
    word, against a second source of truth for the same fact
17. ~~**`commonFoods.ts`: German names, or German keywords only?**~~ —
    **ANSWERED 2026-08-23 (2nd): keywords only, names stay English.** And the
    reason is not decision 2's. Search-index cost does not apply —
    `searchCommonFoods` already indexes `keywords` and German terms are already
    in there. **The deciding argument is persistence**: a common food's `name`
    becomes a `Food` row and then a permanent `logEntry.foodName` snapshot, so a
    German name would not render, it would persist through a language switch
    forever. Full reasoning in §12.13; do not re-derive it

**A further one, from §12.4, not yet listed above:** a public release throttles at
**100 signups a day** on Resend's free tier and no setting changes that. Paying
Resend, or accepting the throttle, is a funding decision that belongs with
§12.11 rather than with the roadmap.

### Explicitly not on this roadmap

AI Scan and Describe Your Meal; meal icons; recipe import from URL; social
feeds, shared programs and competitions (§12.11); Apple Watch and heart rate —
the one genuine capability gap money cannot close from here (§12.11); a large
bundled Open Food Facts extract (§12.7).

### A closing note on scope

Ten phases, several of them multi-session. §14 records that large multi-part
briefs produce diffs too big to review properly and that smaller testable chunks
work better; the phases are ordered so each ends somewhere it is safe to stop.

§12.11's strongest finding was that four trackers in one free, local-first app
with no account required *is* the unusual position. Most of this roadmap
strengthens that. Three items — gamification, AI chat, progress photos — are
where it would be easiest to drift into being a worse-funded version of the app
in the screenshots. Worth re-reading §12.11 before starting any of them.

---

## 19. Working in Claude Code (from 2026-08-24)

This section replaces the old chat workflow. It is about *how a session runs*,
not what to build.

### The three files and what each is for

| File | Committed? | Purpose |
|---|---|---|
| `CLAUDE.md` (repo root) | yes | Rules, conventions, hard constraints, verification checklist. Loaded automatically every session. Changes rarely. |
| `docs/HANDOVER.md` (this file) | yes | History, decisions and their reasoning, current state, what's next. Updated at the end of every session. |
| `PRIVATE-NOTES.md` (repo root) | **no — gitignored** | Personal and legal material that must not sit in a public repo. Read when the funding or release question comes up. |

**One fact, one home.** Why this design → code comments. Project rules →
`CLAUDE.md`. Why this change → the commit message. What users got → the
changelog. What happened and what is untested → this file. Duplicating between
them creates two copies that drift, which §14 already records as a failure mode.

### Starting a session

1. Read `CLAUDE.md`, then §19 and §17 here, then whichever section covers the
   area being touched.
2. `git status` and `git branch --show-current`. Clean tree, expected branch.
3. **Ask what I want to work on.** I usually arrive with something more current
   than any list here — that question has produced §12.10, §12.11 and §12.14.
4. **Read the actual files.** Do not estimate from this document.
5. Present a plan — files to change, what each does, split into independently
   testable chunks — and wait for approval before writing code.

### During a session

- Work one chunk at a time. Build and confirm before starting the next.
- **Never edit this file mid-session.** Hold every change until the end and
  apply them in one pass. A handover edited while the work is still moving
  records things that then turn out to be wrong.
- Flag decisions explicitly before writing code, never silently inside an
  implementation.
- If I say I'm confused, switch to numbered copy-paste commands and explain
  afterwards.

### Ending a session

Say it explicitly, without being asked. The last message should end with
something like *"Committed and pushed to `phase-1-i18n`. Handover updated. Ready
to clear."* If anything is deliberately left uncommitted, say so plainly instead
— that is a different state and I need to know which one I'm in.

1. `npm run build` — clean, and note the precache figure.
2. Commit and push.
3. **Update this file** with targeted edits, not a rewrite: what was done, what
   was decided and why, **what was tested and what was not**, the new precache
   figure, and what the next session should do first.
4. Commit the handover update too.

**What I type to trigger it:**

> Wrap up: build, commit, push, and update docs/HANDOVER.md with what we did,
> what we decided, what's untested, the new precache figure, and what the next
> session should do first.

### Context management

- **`/clear`** — wipes the conversation, stays in the same folder. Use it
  between sessions, and mid-session once a chunk is finished and the context is
  cluttered. **This file is what survives `/clear`**, which is the entire reason
  it is written the way it is.
- **`/compact`** — condenses a long conversation instead of wiping it. Use it
  when mid-task and running out of room.
- Do not `/clear` until the closing message confirms a clean handoff.

### Commands that must never run

`git stash`, `git reset`, `git checkout .` — §5 has forbidden these since 2026-08-09
and the reasoning is unchanged: they discard uncommitted work silently. This
mattered concretely once, when `git checkout main` refused to carry the
number-field work across and **the recovery was to commit and cherry-pick**
precisely because nothing had been stashed. **Read what Claude Code is asking
permission to run.** A slip here is the one thing that can actually lose work.

### What is different now, and what is not

**Different:** files are read and edited on disk rather than pasted, so "give me
the complete file" is obsolete (§1) and "ask for the file" becomes "open the
file" (§17). Verification commands can be run in the same session as the fix,
which §14 records as the exact discipline that was missing when four screens
went on corrupting data for twelve days after the bug was declared fixed.

**Not different:** every hard rule in §5, the build-before-push rule, the
append-only Dexie rule, the CSP `connect-src` rule, and above all §1's
**test the assumption before writing the fix**. Having the files to hand makes
that rule cheaper to follow, not less necessary — a wrong theory tested against
the real system is still the difference between a fix and three days of them.
