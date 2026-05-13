// Wrapper client per generazione domande via AI con fallback al pool locale.
// Strategia:
//   1. Cache per categoria in sessionStorage (refresh ad ogni sessione di app)
//   2. Se cache vuota → chiama /api/generate-trivia (Groq via Vercel function)
//   3. Se AI fallisce o non ne ritorna abbastanza → fallback al pool locale
//   4. Il pool locale segue il dedup di triviaSetup (gn:trivia:seen:*)

import questionsAll from '../data/questions/trivia.json'
import { shuffle } from '../utils/deck'

const CACHE_KEY = (cat) => `gn:ai:cache:${cat}`
// Cache valida per la sessione corrente dell'app. Pulita ad ogni reload.
const CACHE_STORAGE = typeof sessionStorage !== 'undefined' ? sessionStorage : null

const loadCache = (cat) => {
  try {
    const raw = CACHE_STORAGE?.getItem(CACHE_KEY(cat))
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

const saveCache = (cat, questions) => {
  try {
    CACHE_STORAGE?.setItem(CACHE_KEY(cat), JSON.stringify(questions))
  } catch { /* ignore */ }
}

const consumeFromCache = (cat, count) => {
  const cached = loadCache(cat)
  if (cached.length < count) return null
  const taken = cached.slice(0, count)
  const remaining = cached.slice(count)
  saveCache(cat, remaining)
  return taken
}

// Pulisce tutte le cache AI (es. all'avvio di una nuova sessione di gioco).
export const clearAiCache = () => {
  try {
    const keys = []
    for (let i = 0; i < (CACHE_STORAGE?.length ?? 0); i++) {
      const k = CACHE_STORAGE.key(i)
      if (k?.startsWith('gn:ai:cache:')) keys.push(k)
    }
    keys.forEach((k) => CACHE_STORAGE.removeItem(k))
  } catch { /* ignore */ }
}

// Pool locale come fallback. Replica logica di triviaSetup ma più semplice
// (questo file viene usato solo quando l'AI non risponde).
const fallbackFromLocal = (category, count) => {
  const filtered = questionsAll.filter((q) => q.category === category)
  const pool = filtered.length >= count ? filtered : questionsAll
  return shuffle(shuffle([...pool])).slice(0, count)
}

const normalize = (q, category) => ({
  question: q.question,
  answers: q.answers,
  correct: q.correct,
  difficulty: q.difficulty ?? 'medium',
  topic: q.topic ?? null,
  category: q.category ?? category,
})

// Genera un deck di N domande per la categoria specificata.
// Pre-fetch suggerito: chiama questa funzione appena entri in TriviaLobby così
// le domande sono pronte quando l'utente spinna la wheel.
export const generateDeck = async (category, count = 10) => {
  // 1. Prova dalla cache di sessione (già fetched in precedenza)
  const cached = consumeFromCache(category, count)
  if (cached) return cached.map((q) => normalize(q, category))

  // 2. Chiama API AI con un margine (chiediamo ~50% in più per riempire la cache)
  const askCount = Math.max(count + 5, Math.ceil(count * 1.5))
  try {
    const resp = await fetch('/api/generate-trivia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, count: askCount }),
    })
    if (resp.ok) {
      const data = await resp.json().catch(() => ({}))
      const qs = Array.isArray(data?.questions) ? data.questions : []
      if (qs.length >= count) {
        // Tieni l'eccesso in cache per le partite successive
        const taken = qs.slice(0, count)
        const overflow = qs.slice(count)
        if (overflow.length > 0) saveCache(category, overflow)
        return taken.map((q) => normalize(q, category))
      }
      // AI ha risposto ma con poche/nessuna domanda → log + fallback
      // eslint-disable-next-line no-console
      console.warn('[ai] not enough questions (' + qs.length + '), falling back')
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[ai] generation failed:', err?.message ?? err)
  }

  // 3. Fallback: pool locale
  return fallbackFromLocal(category, count).map((q) => normalize(q, category))
}

// Pre-fetch background — chiamato dalla TriviaLobby per scaldare la cache.
// Non blocca, errori silenziosi.
export const prefetchCategory = (category, count = 12) => {
  generateDeck(category, count).catch(() => { /* ignore */ })
}
