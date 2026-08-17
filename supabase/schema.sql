-- Upkeep — complete Supabase schema
--
-- WARNING: the drop statements below destroy all data in these tables.
-- NEVER run this file against the live project — write incremental migrations
-- in supabase/migrations/ instead. This file describes the *current* shape of
-- the database so a fresh project can be built from scratch; it is not a
-- history and it is not runnable against production.
--
-- Reflects all migrations up to and including:
--   supabase/migrations/2026-08-10-composite-pk.sql
--
-- Where to run: Supabase dashboard -> SQL Editor -> New query
-- Everything is wrapped in a transaction: if any statement fails, the whole
-- thing rolls back and the database is left untouched. Same reasoning as the
-- single-transaction Dexie migration.

begin;

drop table if exists care_step_done cascade;
drop table if exists care_done_log cascade;
drop table if exists care_steps cascade;
drop table if exists care_routines cascade;
drop table if exists routine_exercises cascade;
drop table if exists routines cascade;
drop table if exists workout_sets cascade;
drop table if exists workouts cascade;
drop table if exists custom_exercises cascade;
drop table if exists measurements cascade;
drop table if exists log_entries cascade;
drop table if exists foods cascade;
drop table if exists profile cascade;
drop table if exists goals cascade;


-- ---------------------------------------------------------------------------
-- Primary keys are (user_id, id), not id alone.
--
-- Every row carries a device-minted UUID. A device that has synced with one
-- account keeps those UUIDs when it signs into a second one, and a primary key
-- on id alone made Postgres match the existing row and turn the insert into an
-- UPDATE of a row owned by someone else. RLS refused it:
--
--   403: new row violates row-level security policy (USING expression)
--
-- Including user_id in the key means the same UUID can legitimately exist once
-- per account, which is what "start over with a new email" requires.
--
-- The same reasoning applies to the two unique indexes at the bottom of
-- care_done_log and care_step_done, and to the six child foreign keys, which
-- are composite for the same reason.
--
-- Foreign keys are named explicitly. Left implicit, Postgres would name a
-- composite key <table>_<col1>_<col2>_fkey, which would not match the names in
-- the live database — those came from the 2026-08-10 migration, which kept the
-- original single-column names. Future migrations reference them by name.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- Singletons: one row per user, so user_id IS the primary key.
-- No separate id column, and no deleted_at — you never delete your goals.
-- Unaffected by the composite key change: user_id was already the key.
-- ---------------------------------------------------------------------------

create table goals (
  user_id uuid primary key references auth.users(id) on delete cascade,

  daily_calories numeric not null,
  protein_percent numeric not null,
  carbs_percent numeric not null,
  fat_percent numeric not null,
  min_protein_grams numeric not null,

  updated_at timestamptz not null
);

create table profile (
  user_id uuid primary key references auth.users(id) on delete cascade,

  name text not null,
  folder_order text[],

  created_at timestamptz not null,
  updated_at timestamptz not null
);


-- ---------------------------------------------------------------------------
-- Nutrition
-- ---------------------------------------------------------------------------

create table foods (
  id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  brand text,
  unit text not null check (unit in ('g', 'ml')),

  kcal numeric not null,
  protein numeric not null,
  carbs numeric not null,
  fat numeric not null,
  fiber numeric,
  sugar numeric,

  piece_grams numeric,
  piece_label text,

  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,

  primary key (user_id, id)
);

create index on foods (user_id, updated_at);

-- food_id deliberately has NO foreign key: a log entry is a historical record
-- with its macros already snapshotted, and must survive its food being deleted.
create table log_entries (
  id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,

  logged_on date not null,
  meal text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snack')),

  food_id uuid,
  food_name text not null,
  amount numeric not null,
  unit text not null check (unit in ('g', 'ml')),

  kcal numeric not null,
  protein numeric not null,
  carbs numeric not null,
  fat numeric not null,

  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,

  primary key (user_id, id)
);

create index on log_entries (user_id, updated_at);
create index on log_entries (user_id, logged_on);


-- ---------------------------------------------------------------------------
-- Body
-- ---------------------------------------------------------------------------

create table measurements (
  id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,

  measured_on date not null,
  weight_kg numeric not null,
  height_cm numeric,

  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,

  primary key (user_id, id)
);

create index on measurements (user_id, updated_at);
create index on measurements (user_id, measured_on);


-- ---------------------------------------------------------------------------
-- Workouts
--
-- The 1,324 bundled exercises never come here. Only user-created ones.
-- No `custom` column: every row in this table is custom by definition.
-- ---------------------------------------------------------------------------

create table custom_exercises (
  id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,

  seed_id text,
  name text not null,
  body_part text not null,
  equipment text not null,
  target text not null,
  secondary text[] not null default '{}',
  steps text[] not null default '{}',

  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,

  primary key (user_id, id)
);

create index on custom_exercises (user_id, updated_at);

-- routine_id has no foreign key, on purpose: deleting a routine must not
-- delete the workouts you already performed from it.
create table workouts (
  id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,

  performed_on date not null,
  name text not null,
  started_at timestamptz not null,
  finished_at timestamptz,
  notes text,
  routine_id uuid,

  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,

  primary key (user_id, id)
);

create index on workouts (user_id, updated_at);
create index on workouts (user_id, performed_on);

-- workout_id DOES get a real foreign key: a set without its workout is
-- meaningless data. exercise_key stays plain text so bundled and custom
-- exercises can share one field.
--
-- The key is composite, which also makes it structurally impossible for one
-- account's set to reference another account's workout.
create table workout_sets (
  id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid not null,

  exercise_key text not null,
  exercise_name text not null,
  sort_order integer not null,
  set_number integer not null,

  weight_kg numeric not null,
  reps integer not null,
  type text not null check (type in ('normal', 'warmup', 'drop', 'failure')),
  rest_seconds integer not null default 0,
  completed boolean not null default false,
  rpe numeric check (rpe is null or (rpe >= 1 and rpe <= 10)),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,

  primary key (user_id, id),
  constraint workout_sets_workout_id_fkey
    foreign key (user_id, workout_id) references workouts (user_id, id)
    on delete cascade
);

create index on workout_sets (user_id, updated_at);
create index on workout_sets (workout_id);


-- ---------------------------------------------------------------------------
-- Workout routines
-- ---------------------------------------------------------------------------

create table routines (
  id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  folder text,
  sort_order integer,
  notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,

  primary key (user_id, id)
);

create index on routines (user_id, updated_at);

create table routine_exercises (
  id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid not null,

  exercise_key text not null,
  exercise_name text not null,
  sort_order integer not null,
  target_sets integer not null,
  rest_seconds integer not null default 0,
  
  notes text,
  sets jsonb not null default '[]'::jsonb
    check (jsonb_typeof(sets) = 'array'),

  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,

  primary key (user_id, id),
  constraint routine_exercises_routine_id_fkey
    foreign key (user_id, routine_id) references routines (user_id, id)
    on delete cascade
);

create index on routine_exercises (user_id, updated_at);
create index on routine_exercises (routine_id);


-- ---------------------------------------------------------------------------
-- Care routines (skin, hair, anything)
-- ---------------------------------------------------------------------------

create table care_routines (
  id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  kind text not null,
  time_of_day text not null check (time_of_day in ('morning', 'evening', 'anytime')),
  sort_order integer not null default 0,

  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,

  primary key (user_id, id)
);

create index on care_routines (user_id, updated_at);

create table care_steps (
  id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  care_routine_id uuid not null,

  name text not null,
  product text,
  notes text,
  sort_order integer not null,

  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,

  primary key (user_id, id),
  constraint care_steps_care_routine_id_fkey
    foreign key (user_id, care_routine_id) references care_routines (user_id, id)
    on delete cascade
);

create index on care_steps (user_id, updated_at);
create index on care_steps (care_routine_id);

-- One row per routine per day, holding skip state only.
create table care_done_log (
  id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  care_routine_id uuid not null,

  done_on date not null,
  skipped boolean not null default false,

  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,

  primary key (user_id, id),
  constraint care_done_log_care_routine_id_fkey
    foreign key (user_id, care_routine_id) references care_routines (user_id, id)
    on delete cascade
);

create index on care_done_log (user_id, updated_at);

-- Scoped to the user. Without user_id this was table-wide, so a second account
-- pushing a row for the same routine and date hit 23505 on a row its own RLS
-- policy would not let it see. Confirmed 2026-08-10 before the migration.
create unique index on care_done_log (user_id, care_routine_id, done_on);

-- One row per ticked step per day. Unticking sets deleted_at; re-ticking
-- clears it on the same row. Two devices ticking different steps write two
-- different rows, so nothing is ever lost to last-write-wins.
create table care_step_done (
  id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  care_routine_id uuid not null,
  step_id uuid not null,

  done_on date not null,

  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,

  primary key (user_id, id),
  constraint care_step_done_care_routine_id_fkey
    foreign key (user_id, care_routine_id) references care_routines (user_id, id)
    on delete cascade,
  constraint care_step_done_step_id_fkey
    foreign key (user_id, step_id) references care_steps (user_id, id)
    on delete cascade
);

create index on care_step_done (user_id, updated_at);
create unique index on care_step_done (user_id, step_id, done_on);


-- ---------------------------------------------------------------------------
-- Row level security
--
-- The project's event trigger already enables RLS on new tables. These lines
-- are deliberately redundant: if that trigger ever fails or is removed, a
-- table would be world-readable to anyone holding the project URL.
-- ---------------------------------------------------------------------------

alter table goals             enable row level security;
alter table profile           enable row level security;
alter table foods             enable row level security;
alter table log_entries       enable row level security;
alter table measurements      enable row level security;
alter table custom_exercises  enable row level security;
alter table workouts          enable row level security;
alter table workout_sets      enable row level security;
alter table routines          enable row level security;
alter table routine_exercises enable row level security;
alter table care_routines     enable row level security;
alter table care_steps        enable row level security;
alter table care_done_log     enable row level security;
alter table care_step_done    enable row level security;

create policy "own rows" on goals             for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on profile           for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on foods             for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on log_entries       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on measurements      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on custom_exercises  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on workouts          for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on workout_sets      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on routines          for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on routine_exercises for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on care_routines     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on care_steps        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on care_done_log     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on care_step_done    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

commit;