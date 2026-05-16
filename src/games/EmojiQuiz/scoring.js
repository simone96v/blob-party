// Calcolo punteggio Emoji Quiz.
// Più rispondi veloce → più punti. Le combo (>=2 corrette di fila) moltiplicano fino a 2x.

export const ROUND_MS = 25000

export const round10 = (x) => Math.round(x / 10) * 10

// Moltiplicatore combo: streak 1 → 1x, 2 → 1.2x, 3 → 1.4x, ..., cap 2.0x.
export const comboMult = (streak) => (streak < 2 ? 1 : Math.min(1 + 0.2 * (streak - 1), 2))

// Punti base: lineari sul tempo residuo.
//   - elapsed = 0   → 800 punti
//   - elapsed = ROUND_MS → 150 punti
export function basePoints(elapsedMs) {
  const r = Math.max(0, Math.min(1, (ROUND_MS - elapsedMs) / ROUND_MS))
  return 150 + r * 650
}
