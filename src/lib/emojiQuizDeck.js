// Loader del deck di Emoji Quiz (multi-choice).
//
// Pipeline:
//   1. Carica TUTTI i puzzle (Supabase, fallback al bundle locale).
//   2. Mescola e seleziona `count` puzzle per la sessione.
//   3. Per ogni puzzle estratto, genera 4 opzioni di risposta:
//        - 1 corretta (il `title` del puzzle)
//        - 3 distractor: titoli random pescati dagli altri puzzle del pool
//      Mescola le posizioni e registra l'indice della risposta corretta.
//
// Shape del deck restituito:
//   [{ id, emoji, category, hint, title, answers: [4 strings], correct: int 0..3 }, ...]
//
// In modalità multiplayer questo deck viene pubblicato in `gameState.eqDeck` dall'host.

import { supabase } from './supabase'
import { PUZZLES } from '../data/emojiQuizPuzzles'

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Pesca 3 distractor dai puzzle del pool diversi da `correct`, evitando duplicati.
const pickDistractors = (correctTitle, pool) => {
  const candidates = pool
    .map((p) => p.title)
    .filter((t) => t !== correctTitle)
  return shuffle(candidates).slice(0, 3)
}

const buildOptions = (puzzle, pool) => {
  const distractors = pickDistractors(puzzle.title, pool)
  const options = shuffle([puzzle.title, ...distractors])
  const correct = options.indexOf(puzzle.title)
  return { answers: options, correct }
}

const loadPool = async () => {
  try {
    const { data, error } = await supabase
      .from('emoji_puzzles')
      .select('id, emoji, title, category, difficulty, hint')
    if (error) throw error
    if (!data || data.length === 0) throw new Error('empty_table')
    return data
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[emojiQuizDeck] fallback to local PUZZLES:', e?.message)
    return PUZZLES
  }
}

/**
 * Restituisce un deck di `count` puzzle pronti per il gioco, ognuno con 4
 * opzioni di risposta già preparate (1 corretta + 3 distractor).
 */
export const loadEmojiQuizDeck = async (count) => {
  const pool = await loadPool()
  const selected = shuffle(pool).slice(0, count)
  return selected.map((p) => {
    const { answers, correct } = buildOptions(p, pool)
    return {
      id: p.id,
      emoji: p.emoji,
      category: p.category,
      hint: p.hint,
      title: p.title,
      answers,
      correct,
    }
  })
}

export { PUZZLES }
