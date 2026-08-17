-- Upkeep — migration 2026-08-17
-- Per-set routine targets, notes, and RPE
--
-- Why: routine_exercises stored a single target_sets integer, so a routine
-- could say "3 sets" but not "3 sets of 60kg x 8, plus two warm-ups". Starting
-- a workout from a routine therefore prefilled zeros and the numbers had to be
-- retyped every session.
--
-- Stored as jsonb on the parent rather than as a routine_sets table. Routine
-- sets are only ever read as a group with their exercise, never queried
-- individually, so a table would buy nothing and cost a composite primary key,
-- an RLS policy, a foreign key, and a sync cursor — four places this project
-- has already been bitten once.
--
-- target_sets is kept and remains authoritative for "how many working sets".
-- It is maintained as the count of non-warmup entries in sets. Dropping it
-- would mean rewriting the routine-update diff and every existing row in the
-- same change.
--
-- rpe is added to workout_sets here rather than in a later migration. The
-- column is nullable and nothing writes it yet.
--
-- Additive only: no column is dropped, no constraint on existing data is
-- tightened, and every new column has a default or is nullable. An older build
-- of the app running against this schema keeps working — it simply ignores the
-- new columns.

begin;

-- ---------------------------------------------------------------------------
-- 1. Routine-level notes
-- ---------------------------------------------------------------------------

alter table public.routines
  add column notes text;

-- ---------------------------------------------------------------------------
-- 2. Per-set targets and per-exercise notes
--
-- Keys inside the jsonb are camelCase, matching the TypeScript shape. The
-- camel/snake conversion in sync.ts applies to columns; inside an opaque blob
-- there is no SQL convention to satisfy, and converting would double the
-- mapping code for no benefit.
--
-- Shape of each element:
--   { "type": "normal" | "warmup" | "drop" | "failure",
--     "weightKg": number | absent,
--     "reps": number | absent,
--     "rpe": number | absent }
--
-- The check guards the outer type only. Postgres cannot cheaply validate the
-- element shape, and sync.ts coerces every field on the way in regardless.
-- ---------------------------------------------------------------------------

alter table public.routine_exercises
  add column notes text,
  add column sets jsonb not null default '[]'::jsonb,
  add constraint routine_exercises_sets_is_array
    check (jsonb_typeof(sets) = 'array');

-- ---------------------------------------------------------------------------
-- 3. RPE on logged sets
--
-- numeric, not integer: half-point RPE (7.5, 8.5) is normal usage.
-- Nullable, and it stays nullable — RPE is optional and an empty value must
-- never block a set from being marked complete.
-- ---------------------------------------------------------------------------

alter table public.workout_sets
  add column rpe numeric,
  add constraint workout_sets_rpe_range
    check (rpe is null or (rpe >= 1 and rpe <= 10));

commit;