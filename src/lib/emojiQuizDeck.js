// Pool statico delle domande di Emoji Quiz.
//
// Carica le domande dal JSON bundlato (~110 puzzle, 5 categorie, 3 difficoltà)
// e le serve istantaneamente. Nessuna chiamata API a runtime → loading speed
// allineata a Trivia.
//
// Categorie: film | canzoni | serie_tv | videogiochi | marchi | tutte
// Difficoltà: 1 (easy) | 2 (medium) | 3 (hard)
//
// Lazy import + cache in memoria: async solo al primo accesso, poi istantaneo.

let _pool = null
let _loadPromise = null

const ensurePool = async () => {
  if (_pool) return _pool
  if (_loadPromise) return _loadPromise
  _loadPromise = import('../data/questions/emojiquiz.json').then((m) => {
    _pool = m.default
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

export const EMOJI_QUIZ_CATEGORIES = [
  { id: 'tutte',       label: 'Tutte',         emoji: '🎲', color: '#7C3AED' },
  { id: 'film',        label: 'Film',          emoji: '🎬', color: '#F97316' },
  { id: 'canzoni',     label: 'Canzoni',       emoji: '🎵', color: '#3B82F6' },
  { id: 'serie_tv',    label: 'Serie TV',      emoji: '📺', color: '#EC4899' },
  { id: 'videogiochi', label: 'Videogiochi',   emoji: '🎮', color: '#10B981' },
  { id: 'marchi',      label: 'Marchi',        emoji: '🏷️', color: '#F59E0B' },
]

export const getCategoryById = (id) =>
  EMOJI_QUIZ_CATEGORIES.find((c) => c.id === id) ?? EMOJI_QUIZ_CATEGORIES[0]

/**
 * Carica un deck di Emoji Quiz filtrato per categoria, con anti-repeat
 * tramite localStorage. Stesso pattern di triviaSetup.buildTriviaDeck.
 *
 *   categoryId: 'tutte' | 'film' | 'canzoni' | 'serie_tv' | 'videogiochi' | 'marchi'
 *   count: numero di puzzle desiderati
 */
export const loadEmojiQuizDeck = async (count = 7, categoryId = 'tutte') => {
  const pool = await ensurePool()
  const filtered = categoryId === 'tutte'
    ? pool
    : pool.filter((p) => p.category === categoryId)
  const basePool = filtered.length >= count * 2 ? filtered : pool

  const seen = loadSeen(categoryId)
  let candidates = basePool.filter((p) => !seen.has(p.id))

  // Pool fresco esaurito → reset.
  if (candidates.length < count) {
    seen.clear()
    saveSeen(categoryId, seen)
    candidates = basePool
  }

  const picked = shuffle(shuffle([...candidates])).slice(0, Math.min(count, candidates.length))

  // Marca come visti per la prossima partita.
  picked.forEach((p) => seen.add(p.id))
  saveSeen(categoryId, seen)

  return picked
}

// Preload sincrono — chiamabile dalla lobby per garantire deck istantaneo allo start.
export const preloadEmojiQuizPool = () => ensurePool()

// ── Anti-repeat localStorage (mirroring src/lib/triviaSetup.js) ────────

const SEEN_KEY = (cat) => `gn:emojiquiz:seen:${cat ?? 'tutte'}`
const SEEN_CAP = 80 // ~75% del pool totale (111 puzzle)

const loadSeen = (cat) => {
  try {
    const raw = localStorage.getItem(SEEN_KEY(cat))
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

const saveSeen = (cat, ids) => {
  try {
    const arr = [...ids].slice(-SEEN_CAP)
    localStorage.setItem(SEEN_KEY(cat), JSON.stringify(arr))
  } catch { /* localStorage pieno/disabilitato */ }
}

export const resetEmojiQuizSeen = (cat) => {
  try {
    if (cat) localStorage.removeItem(SEEN_KEY(cat))
    else {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('gn:emojiquiz:seen:'))
        .forEach((k) => localStorage.removeItem(k))
    }
  } catch { /* ignore */ }
}
