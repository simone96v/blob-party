# Trivia — Game Design Document

> Stato: v2 (post-restructure 2026-05)

---

## 1. Vision

Trivia è il **gioco di punta** di Blob Party: quiz a risposta multipla sincronizzato, dove
2–8 amici si sfidano in tempo reale a chi sa di più (o chi clicca più veloce). Il gioco
deve **funzionare in qualunque contesto**: bar, casa, gita in macchina con audio chiacchierato.

### Pilastri
1. **Velocità di onboarding**: dal join al primo +punto in <30 secondi.
2. **Tensione di gara**: ogni domanda ha clock visibile, pressione sociale visibile.
3. **Skill+speed**: chi sa risponde, chi sa veloce vince. Il fortunato pesca, lo studioso vince.
4. **No-shame**: chi sbaglia non viene umiliato (no -10), ma chi non risponde sì.
5. **Sessione 5–10 min**: una partita standard dura quanto una pausa caffè.

### Anti-vision
- Non è Kahoot: niente classifica intermedia mostrata male, niente toni infantili.
- Non è Trivial Pursuit: niente ruote, categorie, set di 6 — è velocità.

---

## 2. Game Loop

```
┌─────────────────────────────────────────────────────────────────┐
│ LOBBY → CATEGORIA → DECK BUILT → COUNTDOWN (4s) → ┐             │
│                                                   ↓             │
│          ┌─────── QUESTION (Ns) ──────┐  ─── REVEAL ──┐         │
│          │                            │                ↓         │
│          └────── tutti rispondono ────┘   host: AVANTI ──┐       │
│                                                          ↓       │
│   (round < total?) ◄─────────────────────────────────────┘       │
│        │  no                                                     │
│        ↓                                                         │
│      FINAL (podio + classifica + MVP) → host: RIGIOCA / CAMBIA   │
└─────────────────────────────────────────────────────────────────┘
```

### Durata
- **Countdown**: 4 secondi (3-2-1-VIA)
- **Question**: 15s default (range 10–30s, settabile)
- **Reveal**: indefinito, host clicca per avanzare (target 5–8s di consultazione)
- **Default partita**: 10 domande = ~3.5 min di gameplay attivo

---

## 3. Scoring System v2

Il sistema vecchio (+10/-10/-5) era piatto e punitivo. Il nuovo premia **skill + speed +
consistency** senza schiacciare chi sbaglia.

### Formula
```
points_per_correct = (BASE + speed_bonus + streak_bonus) * difficulty_mult
```

| Componente | Valori | Note |
|---|---|---|
| `BASE` | 10 | Risposta corretta |
| `speed_bonus` | `round((1 - elapsed/timer_duration) * 5)` | 0–5 punti — più veloce = più punti |
| `streak_bonus` | `min((current_streak - 1) * 2, 10)` | 0 alla 1ª, +2 alla 2ª, ... cap +10 alla 6ª |
| `difficulty_mult` | easy 1.0, medium 1.2, hard 1.5 | Letto dal deck |

### Penalità
| Caso | Punti |
|---|---|
| Risposta **sbagliata** | 0 |
| **Timeout** (non hai risposto) | 0 |

> Razionale: -10 per errore e -5 per timeout erano demotivanti. Ora chi sbaglia perde solo
> l'opportunità di guadagnare. Lo streak (che si **azzera** sbagliando o timeoutando) è la
> vera "penalità nascosta": chi sbaglia perde il bonus accumulato.

### Esempi
- **Corretto, lento, easy, 1ª della streak**: (10 + 1 + 0) * 1.0 = **11 pt**
- **Corretto, medio-veloce, medium, 3ª della streak**: (10 + 3 + 4) * 1.2 = **20 pt**
- **Corretto, fulmineo, hard, 6ª della streak (cap)**: (10 + 5 + 10) * 1.5 = **37 pt**
- **Sbagliato, qualunque**: 0 pt, streak azzerata

### Range tipico per partita 10 domande
- Casual player (50% accuracy, no streak): ~80–120 pt
- Knower (80% accuracy, streak 3): ~200–280 pt
- Speed demon (90% accuracy, fast, streak): ~320–400 pt

---

## 4. Question Pool

### Schema
```json
{
  "id": "trv_001",
  "question": "Qual è la capitale dell'Australia?",
  "answers": ["Sydney", "Melbourne", "Canberra", "Brisbane"],
  "correct": 2,
  "category": "gamenight",     // bar | gamenight | couple | wild
  "difficulty": "easy",         // easy | medium | hard
  "topic": "geografia"          // arte | cinema | musica | sport | ...
}
```

### Distribuzione attuale
- **80 domande** totali
- **Categorie**: gamenight (25), bar (25), couple (15), wild (15)
- **Difficoltà**: easy (33), medium (33), hard (14)
- **Topic**: 18 topic distinti (cinema 12, musica 10, curiosità 8, …)

### Logica deck building
1. Filtra per categoria scelta
2. Se la categoria ha <= 2x numQuestions, espande all'intero pool
3. Double-shuffle per entropia
4. Slice top N
5. Ogni item include `question`, `answers`, `correct`, `difficulty`, `topic`

### TODO content
- [ ] Bilanciare difficulty: portare hard al 25% del pool
- [ ] Aggiungere ~50 domande topic-bilanciate (sport e politica sono sotto-rappresentati)
- [ ] Sistema di review/segnalazione domande errate

---

## 5. Per-Player Aggregates

In `state.players[]` vengono mantenuti, per ciascun giocatore:

| Campo | Tipo | Significato |
|---|---|---|
| `score` | int | Punteggio totale (visibile in HUD) |
| `current_streak` | int | Corrette consecutive (azzerato su errore/timeout) |
| `best_streak` | int | Record di streak nella partita |
| `correct_count` | int | N° risposte corrette |
| `total_speed_ms` | bigint | Somma `answered_at - question_started_at` per risposte corrette |

Da questi si derivano le MVP a fine partita (vedi §7).

---

## 6. Fasi e UI

### 6.1 Countdown
Full-screen overlay 3 → 2 → 1 → VIA! (4s totali).

### 6.2 Question
Layout verticale:
- **AppHeader**: ← Esci · logo · `7/10` badge
- **GameHUD**: progress bar · timer ring · player chips con score
- **QuestionCard**: chip topic + difficulty stars in alto, testo domanda
- **Grid 2x2 risposte**: 4 tile colorati (viola/ciano/ambra/rosso) con lettera A-D
- **Status bar**: "🔒 Bloccata!" / "🐌 Troppo lento!" sotto la grid

Stato locale:
- Hai cliccato → `localAnswer = idx` → tile evidenziato, altri al 45% opacity
- Submitting → spinner sull'angolo del tile cliccato
- Expired senza risposta → tutti i tile disabilitati, banner danger

### 6.3 Reveal
Layout uguale a Question ma:
- Tile corretto **verde**, gli altri attenuati
- Il tile scelto da te ha **bordo rosso** se sbagliato, **bordo verde** se corretto
- **ScorePopup** centrale: `+20` con colore success o `0` muted, animato spring
- **Streak indicator** sotto: `🔥 streak x3` (se attiva)
- **Answer distribution**: micro-istogramma con avatar dei giocatori sotto ogni tile
- Footer: host vede `Avanti →` / `Chi ha vinto?! 🏆`; altri vedono "Aspettando il boss... 👑"

### 6.4 Final
- **Podio** top 3 (con #1 più grande, scale 1.1)
- **Leaderboard** completa con la riga del local player evidenziata
- **MVP Awards**: 3 badge in fondo (vedi §7)
- Footer host: `🎮 Cambia gioco` (secondary) + `🔄 Rigioca` (primary)

---

## 7. MVP Awards (final)

Tre badge mostrati a fine partita, derivati dagli aggregate:

| Award | Criterio | Empty state |
|---|---|---|
| 🎯 **Cervellone** | Più `correct_count` (tie-break: speed_avg più basso) | "Nessuno azzecca? 🤷" |
| 🔥 **Streak Master** | Più `best_streak` (min 3 per assegnarlo) | "Niente streak degne" |
| ⚡ **Lampo** | `total_speed_ms / correct_count` più basso (min 3 corrette) | "Tutti lumache 🐌" |

Se un giocatore vince 2 MVP, ne vede entrambi. Se è anche 1° in classifica, è uno **slam**
(badge speciale con confetti).

---

## 8. Architettura tecnica

### 8.1 Server-authoritative
Tutto ciò che influenza scoring/transizioni vive in Postgres (Supabase):
- `start_game(code, deck, timer_duration)`: imposta deck e fase `countdown`
- `begin_round(code)`: countdown → question, set `question_started_at = now()`
- `submit_answer(code, player_id, round, idx)`: calcola punti, aggiorna streak; se tutti hanno risposto → `do_reveal`
- `timeout_reveal(code, round)`: idempotente, chiamato dai client quando timer scade
- `do_reveal(code, state)`: penalizza non-rispondenti, aggrega stat, set `phase=reveal`
- `host_advance(code, player_id)`: reveal → next question OR final; final → lobby

### 8.2 Realtime sync
- Tabella `rooms` (riga per stanza) con `state JSONB` + `phase` + `question_started_at`
- Subscribe Postgres CDC su `rooms` → push live a tutti i client
- Tabella `answers` (riga per risposta) per query lato server e tracking speed

### 8.3 Timer
- `useServerTimer(question_started_at, duration)` calcola `timeLeft` ogni RAF
- Nessun `setInterval` → no drift, fonte di verità unica = timestamp server

### 8.4 Idempotenza
- `submit_answer`: respinge `already_answered` e `wrong_round`
- `timeout_reveal`: respinge se phase ≠ question o round ≠ corrente
- `host_advance`: respinge se non sei host o phase ≠ {reveal, final}

---

## 9. File structure (post-restructure)

```
src/games/Trivia/
├── index.jsx                    # entry + phase routing
├── useTrivia.js                 # state hook
├── constants.js                 # answer colors, scoring config, labels
├── phases/
│   ├── QuestionPhase.jsx        # answering UI
│   ├── RevealPhase.jsx          # results + distribution
│   └── FinalPhase.jsx           # podio + MVP
└── components/
    ├── QuestionCard.jsx         # text + topic chip + difficulty
    ├── AnswerTile.jsx           # answer button (question + reveal)
    ├── ScorePopup.jsx           # +X punti animato
    ├── StreakBadge.jsx          # 🔥 streak x3
    ├── AnswerDistribution.jsx   # avatar sotto ogni tile in reveal
    └── MvpAwards.jsx            # 3 badge final
```

Il vecchio `HostView.jsx` viene **eliminato**: era dead code (mai importato).

---

## 10. Edge cases gestiti

| Caso | Comportamento |
|---|---|
| Player si disconnette in mid-question | Conta come timeout, 0 punti |
| Host esce a metà partita | (TODO) Promozione automatica nuovo host |
| Tutti i client perdono Realtime | Polling fallback (timer client comunque scatta) |
| Stessa risposta arriva 2x (doppio click) | `already_answered` respinto idempotente |
| Round desincronizzato (client su round vecchio) | `wrong_round` respinto |
| Timeout RPC chiamato 2x | `do_reveal` non rigirato se phase ≠ question |

---

## 11. Open questions / future

- **Power-up**: skip domanda, dimezza opzioni (50:50), raddoppia punti — 1 per partita?
- **Difficulty scaling**: domande sempre più difficili man mano che la partita avanza?
- **Categorie miste**: in modalità "random" pesca da tutto il pool?
- **Daily challenge**: deck del giorno uguale per tutti i party del mondo, leaderboard globale?
- **Time bank**: secondi avanzati nelle risposte rapide si accumulano in un timer di riserva?
