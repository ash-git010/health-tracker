// A last-resort classifier for exercise names that don't confidently match the
// 1,324-exercise seed library during a program import. Without this, an
// unmatched name (common — PDF programs use informal names the library
// doesn't) got minted as a custom exercise with bodyPart/equipment/target all
// 'other' and secondary empty, which is why the muscle-balance chart in
// WorkoutProgressScreen read "Other" for anything imported that way.
//
// Rules are ordered most-specific-first and matched against the exercise
// name; the first hit wins. The muscle assignments follow standard,
// uncontroversial exercise-science classification (the same primary/secondary
// muscle calls any certified-trainer resource — ExRx.net, ACE, NASM — would
// make for these movement families); a handful of less obvious ones were
// checked against named sources rather than assumed, see docs/HANDOVER.md's
// entry for this session.
//
// target/secondary use the exact vocabulary muscleGroups.ts's groupFor()
// already maps (see MUSCLE_MAP there) — anything outside that vocabulary
// would silently fall into 'Other' regardless of how accurate it is.

export interface ClassifiedExercise {
  bodyPart: string
  equipment: string
  target: string
  secondary: string[]
}

interface Rule {
  pattern: RegExp
  result: ClassifiedExercise
}

function rule(
  pattern: RegExp,
  bodyPart: string,
  target: string,
  secondary: string[] = []
): Rule {
  return { pattern, result: { bodyPart, equipment: 'other', target, secondary } }
}

// Checked in order — a name can match more than one pattern, so the specific
// compound movements (leg curl, calf raise, wrist curl…) are listed before
// the generic word they contain (curl, raise…) would otherwise catch them.
const RULES: Rule[] = [
  // --- Forearms / wrists — before the generic curl/extension rules below
  rule(/wrist (curl|flexor)/i, 'lower arms', 'forearms', ['wrist flexors']),
  rule(/wrist extens/i, 'lower arms', 'forearms', ['wrist extensors']),
  rule(/(farmer|farmers).?(carry|walk)/i, 'lower arms', 'forearms', ['grip muscles', 'traps']),

  // --- Triceps-specific "kickback" — checked before the Glutes section's own
  // generic kickback rule below, which would otherwise win for a name like
  // "Cable Triceps Kickback" since it appears first in the array.
  rule(/triceps.*(kickback|push.?down|extension)/i, 'upper arms', 'triceps', []),

  // --- Quads / legs — before the generic press/extension/curl rules below
  rule(/leg extension/i, 'upper legs', 'quads', []),
  rule(/reverse nordic/i, 'upper legs', 'quads', ['hip flexors']),
  rule(/(step.?up|split squat|bulgarian)/i, 'upper legs', 'quads', ['glutes', 'hamstrings']),
  rule(/(squat|lunge)/i, 'upper legs', 'quads', ['glutes', 'hamstrings']),
  rule(/leg press/i, 'upper legs', 'quads', ['glutes', 'hamstrings']),

  // --- Hamstrings / posterior chain
  rule(/leg curl/i, 'upper legs', 'hamstrings', ['glutes']),
  rule(/nordic (ham|hamstring)/i, 'upper legs', 'hamstrings', ['glutes']),
  rule(/(rdl|romanian dead ?lift)/i, 'upper legs', 'hamstrings', ['glutes', 'lower back']),
  rule(/good morning/i, 'upper legs', 'hamstrings', ['glutes', 'lower back']),
  rule(/\bdead ?lift\b/i, 'back', 'hamstrings', ['glutes', 'lower back', 'traps']),

  // --- Glutes
  rule(/hip thrust|glute bridge/i, 'upper legs', 'glutes', ['hamstrings']),
  rule(/(hip |plate |cable |machine )?abduction/i, 'upper legs', 'abductors', ['glutes']),
  rule(/(hip |cable )?(kickback|kick.?back)/i, 'upper legs', 'glutes', ['hamstrings']),
  rule(/adduction/i, 'upper legs', 'adductors', ['groin']),

  // --- Calves
  rule(/calf raise/i, 'lower legs', 'calves', []),

  // --- Chest — "reverse pec deck/fly/crossover" targets the rear delts, not
  // the chest, so that has to be checked before the plain pec-deck/fly rule
  // and before the plain "crossover" rule a few lines down.
  rule(/reverse.*(pec deck|fly|flye|crossover)/i, 'shoulders', 'delts', [
    'rhomboids',
    'trapezius',
    'rotator cuff',
  ]),
  rule(/(pec deck|pec.?fly|chest fly|cable fly|cable flye|flye|fly)/i, 'chest', 'pectorals', [
    'deltoids',
  ]),
  rule(/(chest|bench|incline|decline).*(press)/i, 'chest', 'pectorals', ['triceps', 'deltoids']),
  rule(/crossover/i, 'chest', 'pectorals', ['deltoids']),
  rule(/push.?up/i, 'chest', 'pectorals', ['triceps', 'deltoids']),

  // --- Triceps — before the generic "press"/"dip" rules elsewhere in this
  // list, since "close-grip ..." and a bare "dip" would otherwise be caught
  // by a chest rule first. The kickback/pushdown/extension rule for this
  // group is up with Forearms above, ahead of the Glutes section's own
  // kickback rule.
  rule(/(jm press|skull ?crusher|lying triceps|overhead.*triceps)/i,
    'upper arms', 'triceps', ['deltoids']),
  // "Close-Grip Lat Pulldown" is a back exercise (grip width, not target
  // muscle) — deliberately excluded here so the back rules below catch it.
  rule(/(close.?grip).*(press|dip)/i, 'upper arms', 'triceps', ['pectorals', 'deltoids']),
  rule(/\bdip\b/i, 'upper arms', 'triceps', ['pectorals', 'deltoids']),

  // --- Back
  rule(/(lat pulldown|pull.?down)/i, 'back', 'lats', ['biceps', 'upper back']),
  rule(/(pull.?up|chin.?up)/i, 'back', 'lats', ['biceps', 'upper back']),
  rule(/dead ?hang/i, 'back', 'lats', ['forearms', 'grip muscles', 'rotator cuff']),
  rule(/shrug/i, 'back', 'traps', ['upper back', 'rhomboids']),
  rule(/(t.?bar|chest.?supported|seal|barbell|cable|machine|db|dumbbell)?.*\brow\b/i, 'back', 'lats', [
    'upper back',
    'biceps',
    'rhomboids',
  ]),
  rule(/(back extension|hyperextension)/i, 'back', 'lats', ['glutes', 'lower back']),
  rule(/face pull/i, 'shoulders', 'delts', ['upper back', 'rotator cuff', 'trapezius']),
  // "reverse crossover/fly/pec deck" is already caught by the Chest section's
  // own rule above; this catches "rear delt" named without "reverse".
  rule(/rear delt/i, 'shoulders', 'delts', ['rhomboids', 'trapezius', 'rotator cuff']),

  // --- Shoulders
  rule(/(y.?raise|w.?raise)/i, 'shoulders', 'delts', ['trapezius', 'rear deltoids']),
  rule(/lateral raise/i, 'shoulders', 'delts', ['trapezius']),
  rule(/front raise/i, 'shoulders', 'delts', []),
  rule(/upright row/i, 'shoulders', 'delts', ['trapezius', 'biceps']),
  rule(/(overhead|shoulder|military|arnold).*press/i, 'shoulders', 'delts', ['triceps']),

  // --- Biceps — Zottman/hammer/preacher before the generic curl rule
  rule(/zottman/i, 'upper arms', 'biceps', ['forearms', 'brachialis']),
  rule(/hammer curl/i, 'upper arms', 'biceps', ['forearms', 'brachialis']),
  rule(/preacher/i, 'upper arms', 'biceps', ['forearms']),
  rule(/\bcurl\b/i, 'upper arms', 'biceps', ['forearms']),

  // --- Core
  rule(/(crunch|sit.?up)/i, 'waist', 'abs', []),
  rule(/plank/i, 'waist', 'abs', ['core']),
  rule(/leg raise/i, 'waist', 'abs', ['hip flexors']),
  rule(/(russian twist|wood ?chop|oblique)/i, 'waist', 'abs', ['obliques']),
]

const EQUIPMENT_RULES: [RegExp, string][] = [
  [/\bsmith\b/i, 'smith machine'],
  [/\bcable\b/i, 'cable'],
  [/\b(machine|leverage)\b/i, 'leverage machine'],
  [/\b(db|dumbbell)\b/i, 'dumbbell'],
  [/\b(bb|barbell)\b/i, 'barbell'],
  [/\bez\b/i, 'ez barbell'],
  [/\b(kb|kettlebell)\b/i, 'kettlebell'],
  [/\bband\b/i, 'band'],
  [/\b(bw|body ?weight)\b/i, 'body weight'],
  [/\bplate\b/i, 'weighted'],
  // Movements whose equipment is implied even when the name doesn't say so —
  // checked only once none of the explicit brand words above matched.
  [/pull.?down/i, 'cable'],
  [/\bt.?bar\b/i, 'leverage machine'],
  [/pec deck/i, 'leverage machine'],
  [/shrug/i, 'dumbbell'],
]

function detectEquipment(name: string): string {
  for (const [pattern, equipment] of EQUIPMENT_RULES) {
    if (pattern.test(name)) return equipment
  }
  return 'body weight'
}

/**
 * Best-effort classification from the exercise name alone, for when the name
 * didn't confidently match the seed library. Returns undefined for a name
 * that matches no known movement pattern — the caller should fall back to
 * 'other' in that case, same as before this existed.
 */
export function classifyExerciseName(name: string): ClassifiedExercise | undefined {
  for (const { pattern, result } of RULES) {
    if (pattern.test(name)) {
      return { ...result, equipment: detectEquipment(name) }
    }
  }
  return undefined
}
