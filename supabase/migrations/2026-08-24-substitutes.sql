-- Upkeep — migration 2026-08-24
-- Substitute exercise keys on a routine exercise
--
-- Why: swap-exercise (mid-workout) and the JSON program import both need a
-- place to hang alternative exercises for a given routine exercise — an
-- author-supplied substitution from an imported program, or a user's own
-- pick. Same reasoning as routine_exercises.sets on 2026-08-17: jsonb on the
-- existing row, not a child table, since this is a small ordered list that
-- only ever belongs to one parent.
--
-- Additive and nullable-by-default (empty array), so a client running
-- without this column's application code keeps working unchanged.

begin;

alter table public.routine_exercises
  add column substitutes jsonb not null default '[]'::jsonb
  constraint routine_exercises_substitutes_is_array
    check (jsonb_typeof(substitutes) = 'array');

commit;
