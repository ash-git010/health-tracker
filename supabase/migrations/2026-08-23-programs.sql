-- Upkeep — migration 2026-08-23
-- Programs, program days, and two columns they need elsewhere
--
-- Why: routines are a flat list with a text folder. A program is an ordered
-- schedule above them — weeks of days, each day either a routine or a rest day
-- — and five later features read that state (weekly schedule, dashboard
-- "today's workout", rest-day-tolerant workout streaks, the daily checklist,
-- progress adherence). Building any of those against folders means building
-- them twice.
--
-- WEEKS ARE A COLUMN, NOT A TABLE. A third table would cost a composite
-- primary key, an RLS policy, a composite foreign key, a position in the
-- TABLES push order, a sync cursor and a Dexie version block — five places
-- this project has already been bitten, and the 2026-08-10 migration is a
-- whole file about getting one of them wrong. The same reasoning produced
-- routine_exercises.sets as jsonb on 2026-08-17 and that has held.
--
-- A week's one property — its note ("Deload week") — lives in programs.week_notes
-- as a jsonb object keyed by week number, for the same reason.
--
-- Additive only. Every new column is nullable or defaulted and no existing
-- constraint is tightened, so a client running 2.1.1 against this schema keeps
-- working and simply ignores all of it.

begin;

-- ---------------------------------------------------------------------------
-- 1. Programs
--
-- started_on anchors day 1. Without it a repeating program cannot say WHICH
-- occurrence a logged workout satisfied: if week 1 repeats forever, the same
-- program_days row is satisfied every week, so program_day_id alone is
-- ambiguous. started_on plus workouts.performed_on makes the cycle derivable.
--
-- repeats: when true, week numbers keep climbing and the day rows are read
-- modulo the number of defined weeks. Week 5 of a 4-week repeating program
-- reads week 1.
--
-- is_active is NOT enforced unique per user, deliberately. A partial unique
-- index would be violated transiently by a pull under last-write-wins and
-- would fail the entire sync — the 2026-08-10 migration exists because a
-- unique index scoped wrongly did exactly that. The client enforces one
-- active program; the database does not police it.
--
-- week_notes shape: { "1": "Intro week", "5": "Deload" }. Keys are week
-- numbers as strings, because JSON object keys are always strings. Only the
-- outer type is checked; sync.ts coerces the contents on the way in, the same
-- way it already does for routine_exercises.sets.
-- ---------------------------------------------------------------------------

create table public.programs (
  id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  notes text,
  repeats boolean not null default false,
  is_active boolean not null default false,
  started_on date,
  week_notes jsonb not null default '{}'::jsonb,
  sort_order integer,

  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,

  primary key (user_id, id),
  constraint programs_week_notes_is_object
    check (jsonb_typeof(week_notes) = 'object')
);

create index on public.programs (user_id, updated_at);

-- ---------------------------------------------------------------------------
-- 2. Program days
--
-- day_index is 1..7 within a week. It is NOT a weekday: day 1 is whatever
-- calendar day the program was made active, and the rest follow from
-- programs.started_on. That keeps a program portable between people who start
-- it on different days.
--
-- routine_id is nullable and null means a rest day. It carries NO foreign key,
-- matching workouts.routine_id: deleting a routine must not silently punch a
-- hole in a schedule that references it. A day whose routine is gone renders
-- as needing one.
--
-- program_id DOES get a composite foreign key with cascade — a day without its
-- program is meaningless, and the composite form makes it structurally
-- impossible for one account's day to reference another account's program.
--
-- There is deliberately NO unique index on (user_id, program_id, week,
-- day_index). Two reasons, both learned here: soft-deleted rows would keep
-- occupying their slot and block recreation, and reordering two days swaps
-- their day_index values, which a unique index would refuse mid-batch.
-- ---------------------------------------------------------------------------

create table public.program_days (
  id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null,

  week integer not null check (week >= 1),
  day_index integer not null check (day_index between 1 and 7),
  routine_id uuid,

  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,

  primary key (user_id, id),
  constraint program_days_program_id_fkey
    foreign key (user_id, program_id) references public.programs (user_id, id)
    on delete cascade
);

create index on public.program_days (user_id, updated_at);
create index on public.program_days (user_id, program_id);

-- ---------------------------------------------------------------------------
-- 3. Link a logged workout to the day it satisfied
--
-- Nullable, and no foreign key — same reasoning as routine_id one table up.
-- Stamped only when a workout is started from the schedule; an empty workout
-- that happens to resemble Pull day does not claim to be it.
--
-- Completion is "at least one workout referencing that day", so repeating a
-- day is legal and both appear in history.
-- ---------------------------------------------------------------------------

alter table public.workouts
  add column program_day_id uuid;

create index on public.workouts (user_id, program_day_id);

-- ---------------------------------------------------------------------------
-- 4. Per-exercise notes on a logged set
--
-- RoutineExercise.notes has shipped since 2.1 but never reached a workout,
-- because WorkoutSet had no field for it to land in. Written to every set of
-- an exercise and read from the first, exactly as rest_seconds and rpe already
-- work — an exercise inside a workout is only a group of sets, with no row of
-- its own to hang shared state on.
--
-- Batched into this migration rather than shipped as its own, since it is one
-- nullable column and the alternative is two round trips against the live
-- project for no gain.
-- ---------------------------------------------------------------------------

alter table public.workout_sets
  add column notes text;

-- ---------------------------------------------------------------------------
-- 5. RLS
--
-- The project has an event trigger that auto-enables RLS on new tables in
-- public, but it creates no policy — so both tables are locked to everyone
-- until these run. Enabling explicitly anyway: relying on a trigger to do half
-- the job is not something a migration file should leave implicit.
--
-- with check is not optional. Without it an authenticated user could insert
-- rows tagged with someone else's user_id.
-- ---------------------------------------------------------------------------

alter table public.programs     enable row level security;
alter table public.program_days enable row level security;

create policy "own rows" on public.programs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows" on public.program_days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

commit;
