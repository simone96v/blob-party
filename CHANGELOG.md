# Changelog

Tutti i cambiamenti notabili a BlobParty sono documentati qui.

Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.1.0/), e questo
progetto aderisce a [Semantic Versioning](https://semver.org/lang/it/).

## [0.1.0] — 2026-05-16

### Added — Nuovo minigame: Emoji Quiz 🎬

Aggiunto il sesto minigame: **Emoji Quiz** — decifra il titolo di un film o
canzone nascosto dietro a una sequenza di emoji. Il primo che indovina vince.

- **Single-player** (modalità solo): 7 round contro il bot Blobby con difficoltà
  scalata sulla complessità del puzzle. Combo moltiplicatore fino a ×2.0 per
  vincite consecutive. Indizio opzionale (riduce i punti massimi a 350).
- **Multiplayer** (2-8 giocatori online): modello host-client su Supabase Realtime.
  L'host carica il deck, orchestra le transizioni di fase, valida i guess e
  arbitra il winner del round confrontando i `timeMs` (non l'ordine d'arrivo dei
  pacchetti). I client validano il guess localmente e inviano via
  `castVote('eqGuesses', { round, timeMs })`.
- **Puzzle bank** spostato dal bundle locale a una tabella Supabase `emoji_puzzles`
  (migration in `scripts/sql/emoji_quiz_setup.sql`). Seed iniziale: 17 puzzle
  (12 film + 5 canzoni). Fallback automatico al bundle locale se la tabella
  non è ancora applicata.
- **Matching fuzzy** con normalizzazione Unicode (NFD, no diacritici, no
  stopwords) e distanza di Levenshtein ≤ 2 (≤ 1 per stringhe ≤ 4 caratteri).
- **Punteggio**: `150 + (timeLeft/total) × 650`, con cap a 350 quando si usa
  l'indizio. Moltiplicatore combo `1.0 → 2.0` partendo da streak ≥ 2.
- **UI scalabile**: layout 1v1 (Tu vs Blobby/Leader) durante il gioco; podio
  top 3 + leaderboard estesa per N>3 giocatori nello schermo finale.
- **Audio** Web Audio scoped (zero dipendenze), togglabile con il pulsante 🔊.

### Tests
- Aggiunto Playwright (`@playwright/test`) come dev dependency.
- Script npm: `test:e2e`, `test:e2e:ui`, `test:e2e:headed`.
- Due spec end-to-end:
  - `tests/e2e/emojiquiz-solo.spec.js`: percorso single-player completo.
  - `tests/e2e/emojiquiz-multi.spec.js`: due browser context creano una stanza
    reale, votano Emoji Quiz, l'host avvia, entrambi vedono lo stesso emoji
    (verifica della sincronizzazione del deck).

### Fixed
- Transizione `emojiquiz_countdown → emojiquiz_playing` ora event-driven via
  `CountdownOverlay.onComplete` invece di `setTimeout(3000)`, evitando il
  problema del double-mount di React StrictMode in dev che cancellava il
  timer prima del firing.
