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
  const matchedWords = new Set<number>()

  for (const token of tokens) {
    let best = 0
    let bestWordIndex = -1

    words.forEach((word, i) => {
      let s = 0
      if (word === token) s = 100
      else if (word.startsWith(token)) s = 70
      else if (word.includes(token)) s = 40
      else if (token.length >= 4 && isNearMatch(word, token)) s = 25

      if (s > best) {
        best = s
        bestWordIndex = i
      }
    })

    if (best === 0) return 0
    score += best
    if (bestWordIndex >= 0) matchedWords.add(bestWordIndex)
  }

  const unmatchedWordCount = words.length - matchedWords.size
  return score - unmatchedWordCount * 25
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
  limit?: number,
  getBoost?: (item: T) => number
): T[] {
  if (!query.trim()) {
    const sorted = [...items].sort((a, b) => getText(a).localeCompare(getText(b)))
    return limit ? sorted.slice(0, limit) : sorted
  }

  const scored: Scored<T>[] = items
    .map((item) => ({ item, score: fuzzyScore(getText(item), query) }))
    .filter((s) => s.score > 0)
    .map((s) => (getBoost ? { ...s, score: s.score + getBoost(s.item) } : s))
    .sort((a, b) => b.score - a.score)

  const result = scored.map((s) => s.item)
  return limit ? result.slice(0, limit) : result
}