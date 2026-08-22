/**
 * Turns typed text into a number, accepting both '.' and ',' as the decimal
 * separator. German keyboards produce ',' and German users type it.
 *
 * Lives here rather than inside NumberField because two places now need it:
 * the labelled field component, and the bare 3.5rem inputs in the active
 * workout's set rows. One parser, one home — a second copy is how one of them
 * gets fixed and the other doesn't.
 *
 * Returns:
 *   number — a committable value
 *   ''     — the field is empty
 *   null   — mid-typing, not yet a number ('67.', '-', ','). The draft is
 *            kept on screen but nothing is emitted, so the user can keep going.
 */
export function parseDecimal(raw: string): number | '' | null {
  const trimmed = raw.trim()
  if (trimmed === '') return ''

  const normalised = trimmed.replace(',', '.')
  // One optional sign, digits, one optional point, digits. Rejects a second
  // separator, so '6,7,5' never silently becomes something else.
  if (!/^-?\d*\.?\d*$/.test(normalised)) return null

  const n = Number(normalised)
  return Number.isFinite(n) ? n : null
}