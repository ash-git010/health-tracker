-- Upkeep — migration 2026-08-10
-- Composite primary keys (user_id, id)
--
-- Why: server PKs were `id` alone. A device that had already synced with one
-- account carried those UUIDs into a second account, where Postgres matched on
-- id, found an existing row, and turned the INSERT into an UPDATE of another
-- user's row. RLS refused it:
--   403: new row violates row-level security policy (USING expression)
--
-- Two unique indexes had the same flaw, scoped table-wide rather than per user.
-- Confirmed 2026-08-10 by inserting a second user's row for the same routine
-- and date inside a rolled-back transaction: 23505 on
-- care_done_log_care_routine_id_done_on_idx.
--
-- Order is forced: foreign keys depend on the primary keys they reference, so
-- they must be dropped first and recreated last. Dropped explicitly rather
-- than with `cascade`, so the file states everything it destroys.
--
-- Single transaction. A half-migrated database missing six foreign keys is
-- worse than either end state.

begin;

-- ---------------------------------------------------------------------------
-- 1. Drop the six child foreign keys
-- ---------------------------------------------------------------------------

alter table public.workout_sets      drop constraint workout_sets_workout_id_fkey;
alter table public.routine_exercises drop constraint routine_exercises_routine_id_fkey;
alter table public.care_steps        drop constraint care_steps_care_routine_id_fkey;
alter table public.care_done_log     drop constraint care_done_log_care_routine_id_fkey;
alter table public.care_step_done    drop constraint care_step_done_care_routine_id_fkey;
alter table public.care_step_done    drop constraint care_step_done_step_id_fkey;

-- ---------------------------------------------------------------------------
-- 2. Drop the two globally-scoped unique indexes
-- ---------------------------------------------------------------------------

drop index public.care_done_log_care_routine_id_done_on_idx;
drop index public.care_step_done_step_id_done_on_idx;

-- ---------------------------------------------------------------------------
-- 3. Swap twelve primary keys to (user_id, id)
--
-- goals and profile are already primary key (user_id) — not touched.
-- Dropping a primary key drops the unique index behind it; adding the new one
-- builds a fresh index named <table>_pkey over both columns.
-- ---------------------------------------------------------------------------

alter table public.foods             drop constraint foods_pkey;
alter table public.foods             add primary key (user_id, id);

alter table public.log_entries       drop constraint log_entries_pkey;
alter table public.log_entries       add primary key (user_id, id);

alter table public.measurements      drop constraint measurements_pkey;
alter table public.measurements      add primary key (user_id, id);

alter table public.custom_exercises  drop constraint custom_exercises_pkey;
alter table public.custom_exercises  add primary key (user_id, id);

alter table public.workouts          drop constraint workouts_pkey;
alter table public.workouts          add primary key (user_id, id);

alter table public.workout_sets      drop constraint workout_sets_pkey;
alter table public.workout_sets      add primary key (user_id, id);

alter table public.routines          drop constraint routines_pkey;
alter table public.routines          add primary key (user_id, id);

alter table public.routine_exercises drop constraint routine_exercises_pkey;
alter table public.routine_exercises add primary key (user_id, id);

alter table public.care_routines     drop constraint care_routines_pkey;
alter table public.care_routines     add primary key (user_id, id);

alter table public.care_steps        drop constraint care_steps_pkey;
alter table public.care_steps        add primary key (user_id, id);

alter table public.care_done_log     drop constraint care_done_log_pkey;
alter table public.care_done_log     add primary key (user_id, id);

alter table public.care_step_done    drop constraint care_step_done_pkey;
alter table public.care_step_done    add primary key (user_id, id);

-- ---------------------------------------------------------------------------
-- 4. Recreate the two unique indexes, scoped to the user
--
-- Same guarantee as before — one row per routine per day, one per step per day
-- — but per account. That was always the intent; uniqueness across strangers
-- was never wanted and is what broke the second-account push.
-- ---------------------------------------------------------------------------

create unique index care_done_log_user_id_care_routine_id_done_on_idx
  on public.care_done_log (user_id, care_routine_id, done_on);

create unique index care_step_done_user_id_step_id_done_on_idx
  on public.care_step_done (user_id, step_id, done_on);

-- ---------------------------------------------------------------------------
-- 5. Recreate the six foreign keys as composite
--
-- Stronger than what they replace: it is now structurally impossible for one
-- account's child row to reference another account's parent. Cascade preserved
-- exactly as read from the live database on 2026-08-10.
-- ---------------------------------------------------------------------------

alter table public.workout_sets
  add constraint workout_sets_workout_id_fkey
  foreign key (user_id, workout_id) references public.workouts (user_id, id)
  on delete cascade;

alter table public.routine_exercises
  add constraint routine_exercises_routine_id_fkey
  foreign key (user_id, routine_id) references public.routines (user_id, id)
  on delete cascade;

alter table public.care_steps
  add constraint care_steps_care_routine_id_fkey
  foreign key (user_id, care_routine_id) references public.care_routines (user_id, id)
  on delete cascade;

alter table public.care_done_log
  add constraint care_done_log_care_routine_id_fkey
  foreign key (user_id, care_routine_id) references public.care_routines (user_id, id)
  on delete cascade;

alter table public.care_step_done
  add constraint care_step_done_care_routine_id_fkey
  foreign key (user_id, care_routine_id) references public.care_routines (user_id, id)
  on delete cascade;

alter table public.care_step_done
  add constraint care_step_done_step_id_fkey
  foreign key (user_id, step_id) references public.care_steps (user_id, id)
  on delete cascade;

commit;