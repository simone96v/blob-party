// Pool statico dei luoghi di Mappa.
//
// Carica le domande dal JSON bundlato (~125 luoghi italiani con storie/aneddoti)
// e le serve istantaneamente. Lazy import + cache in memoria.
//
// Difficoltà disponibili: 1 (facile) | 2 (medio) | 3 (difficile) | 'mix' (tutte).
// Distribuzione attuale: 20 easy / 39 medium / 66 hard.

let _pool = null
let _loadPromise = null

const ensurePool = async () => {
  if (_pool) return _pool
  if (_loadPromise) return _loadPromise
  _loadPromise = import('../games/Mappa/data/mappa.json').then((m) => {
    _pool = m.default.questions
    return _pool
  })
  return _loadPromise
}

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const MAPPA_DIFFICULTIES = [
  { id: 'mix',  label: 'Mix',       emoji: '🎲', color: '#7C3AED' },
  { id: 1,      label: 'Facile',    emoji: '🟢', color: '#10B981' },
  { id: 2,      label: 'Medio',     emoji: '🟡', color: '#F59E0B' },
  { id: 3,      label: 'Difficile', emoji: '🔴', color: '#EF4444' },
]

/**
 * Carica un deck di Mappa filtrato per difficoltà, con anti-repeat localStorage.
 *
 *   count: numero di luoghi da pescare
 *   difficulty: 'mix' | 1 | 2 | 3
 */
export const loadMappaDeck = async (count = 10, difficulty = 'mix') => {
  const pool = await ensurePool()
  const filtered = difficulty === 'mix' ? pool : pool.filter((q) => q.difficulty === difficulty)
  const basePool = filtered.length >= count * 2 ? filtered : pool

  const seen = loadSeen(difficulty)
  let candidates = basePool.filter((q) => !seen.has(q.id))

  if (candidates.length < count) {
    seen.clear()
    saveSeen(difficulty, seen)
    candidates = basePool
  }

  const picked = shuffle(shuffle([...candidates])).slice(0, Math.min(count, candidates.length))
  picked.forEach((q) => seen.add(q.id))
  saveSeen(difficulty, seen)
  return picked
}

export const preloadMappaPool = () => ensurePool()

// ── Anti-repeat localStorage (mirroring triviaSetup) ────────────────────

const SEEN_KEY = (diff) => `gn:mappa:seen:${diff ?? 'mix'}`
const SEEN_CAP = 90 // ~75% del pool (125)

const loadSeen = (diff) => {
  try {
    const raw = localStorage.getItem(SEEN_KEY(diff))
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

const saveSeen = (diff, ids) => {
  try {
    const arr = [...ids].slice(-SEEN_CAP)
    localStorage.setItem(SEEN_KEY(diff), JSON.stringify(arr))
  } catch { /* ignore */ }
}

export const resetMappaSeen = (diff) => {
  try {
    if (diff !== undefined) localStorage.removeItem(SEEN_KEY(diff))
    else {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('gn:mappa:seen:'))
        .forEach((k) => localStorage.removeItem(k))
    }
  } catch { /* ignore */ }
}
