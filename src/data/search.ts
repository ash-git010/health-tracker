export interface Scored<T> {
  item: T
  score: number
}

export function fuzzyScore(text: string, query: string): number {
  const haystack = text.toLowerCase()
  const q = query.trim().toLowerCase()
  if (!q) return 1

  if (haystack === q) return 1000
  if (haystack.startsWith(q)) return 500
  if (haystack.includes(q)) return 300

  const tokens = q.split(/\s+/).filter(Boolean)
  const words = haystack.split(/[\s\-/(),]+/).filter(Boolean)

  let score = 0

  for (const token of tokens) {
    let best = 0

    for (const word of words) {
      if (word === token) best = Math.max(best, 100)
      else if (word.startsWith(token)) best = Math.max(best, 70)
      else if (word.includes(token)) best = Math.max(best, 40)
      else if (token.length >= 4 && isNearMatch(word, token)) best = Math.max(best, 25)
    }

    if (best === 0) return 0
    score += best
  }

  return score - haystack.length * 0.05
}

function isNearMatch(word: string, token: string): boolean {
  if (Math.abs(word.length - token.length) > 2) return false

  let mismatches = 0
  let i = 0
  let j = 0

  while (i < word.length && j < token.length) {
    if (word[i] === token[j]) {
      i++
      j++
      continue
    }
    mismatches++
    if (mismatches > 1) return false

    if (word.length > token.length) i++
    else if (token.length > word.length) j++
    else {
      i++
      j++
    }
  }

  return mismatches + (word.length - i) + (token.length - j) <= 1
}

export function fuzzySearch<T>(
  items: T[],
  query: string,
  getText: (item: T) => string,
  limit?: number
): T[] {
  if (!query.trim()) {
    const sorted = [...items].sort((a, b) => getText(a).localeCompare(getText(b)))
    return limit ? sorted.slice(0, limit) : sorted
  }

  const scored: Scored<T>[] = items
    .map((item) => ({ item, score: fuzzyScore(getText(item), query) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  const result = scored.map((s) => s.item)
  return limit ? result.slice(0, limit) : result
}