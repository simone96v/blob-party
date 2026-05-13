# Style Snapshot — GameNight

> Audit for Sentenza implementation. Reference for consistent UI, tokens, and patterns.

---

## 1. Design Tokens (CSS Variables — `src/index.css`)

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#F5F3FF` | Page background (light violet) |
| `--bg2` | `#EDE9FE` | Secondary bg (cards, chips) |
| `--surface` | `#FFFFFF` | Card / panel background |
| `--surface2` | `#F4F0FF` | Muted card bg (timer ring, progress) |
| `--accent` | `#7C3AED` | Primary brand violet |
| `--accent2` | `#EC4899` | Secondary pink (gradients) |
| `--accent3` | `#06B6D4` | Tertiary cyan |
| `--success` | `#22C55E` | Correct / positive |
| `--danger` | `#EF4444` | Wrong / negative |
| `--warning` | `#F59E0B` | Caution |
| `--text` | `#1F2937` | Primary text (dark gray) |
| `--muted` | `#6B7280` | Secondary text |
| `--border` | `rgba(31,41,55,0.08)` | Light border |
| `--border-strong` | `rgba(31,41,55,0.16)` | Emphasized border |
| `--radius` | `22px` | Large radius (cards) |
| `--radius-sm` | `14px` | Small radius (tiles, buttons) |
| `--shadow-sm/md/lg` | Violet-tinted box-shadows | Elevation levels |

---

## 2. Reusable UI Components

### `Button` (`src/components/ui/Button.jsx`)
- Props: `variant` (`primary`/`secondary`), `width` (`full`), `disabled`, `onClick`
- Primary: accent gradient. Secondary: outlined.
- Used everywhere for CTAs.

### `GradientTitle` (`src/components/ui/GradientTitle.jsx`)
- Props: `as` (`h1`/`h2`), `size` (`sm`/`md`/`lg`/`xl`), `gradient` (custom), children
- Default gradient: violet→pink. Used for screen titles.

### `IconButton` (`src/components/ui/IconButton.jsx`)
- Props: `ariaLabel`, `onClick`, children (icon text)
- Used in headers for back/exit buttons.

### `PlayerAvatar` (`src/components/PlayerAvatar.jsx`)
- Props: `player` (object with name/color), `showScore`, `size` (`sm`/`md`/`lg`)
- Circular avatar with player color + initial.

### `AppHeader` (`src/components/AppHeader.jsx`)
- Props: `leading` (left slot), `actions` (right slot)
- Standard top bar. Used in all game phases.

### `CountdownOverlay` (`src/components/CountdownOverlay.jsx`)
- Props: `questionStartedAt` (ISO string)
- Full-screen 3-2-1-VIA! overlay synced to server time.
- Haptic feedback on each step.

### `GameHUD` (`src/components/GameHUD.jsx`)
- Props: `questionNumber`, `totalQuestions`, `timeLeft`, `total`, `players`, `localPlayerId`, `phase`
- Top bar with: round progress, timer ring (SVG circle), player score chips.

### `AnswerTile` (`src/games/Trivia/components/AnswerTile.jsx`)
- Props: `index`, `text`, `mode` (`answer`/`reveal`), `isMine`, `isCorrect`, `isLocked`, `disabled`, `onClick`, `voters`
- Answer mode: colored tile (A/B/C/D), tap-to-select, spring animation.
- Reveal mode: green (correct) / red (wrong) with voter dots.
- Tile height: `clamp(56px, 8dvh, 72px)`, radius: `var(--radius-sm)`.
- **Reusable for Sentenza** with modifications (no correct/wrong, judge selection style).

### `Spinner` (`src/components/ui/Spinner.jsx`)
- Props: `size` (`sm`/`md`/`lg`)
- Loading indicator. Used in Suspense fallbacks.

---

## 3. Answer Tile Colors (Trivia)

| Index | Color | Label |
|---|---|---|
| 0 | `#7C3AED` (violet) | A |
| 1 | `#0891B2` (cyan) | B |
| 2 | `#D97706` (amber) | C |
| 3 | `#DC2626` (red) | D |

These are the 4 tile colors. Sentenza uses 4 answer cards per player — same pattern applies.

---

## 4. Layout Pattern (Screens)

```css
.screen          /* 100dvh flex column, overflow hidden */
.screen-narrow   /* max-width 520px on desktop, centered */
.screen-header   /* flex-shrink:0, 52-68px height */
.screen-body     /* flex:1, padding clamp, gap clamp */
.screen-footer   /* flex-shrink:0, 64-84px height */
.scrollable-list /* flex:1, overflow-y auto, hidden scrollbar */
```

All games use `className="screen screen-narrow"` via `<GameScreen />`.

---

## 5. Animation Patterns (Framer Motion)

### Entrance (stagger)
```jsx
initial={{ opacity: 0, y: 18, scale: 0.94 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 22 }}
```

### Tap feedback
```jsx
whileTap={{ scale: 0.96 }}
```

### Podium reveal (staggered by rank)
```jsx
transition={{ delay: rank === 0 ? 0.3 : rank === 1 ? 0.1 : 0.5 }}
```

### Timer pulse (urgent)
```jsx
animate={urgent ? { scale: [1, 1.15, 1] } : { scale: 1 }}
transition={urgent ? { repeat: Infinity, duration: 0.8 } : {}}
```

### Score popup
- Floating "+N" animation with translateY and opacity fade.

---

## 6. Microcopy Examples (Italian, Tone)

| Context | Text |
|---|---|
| Waiting for host | `Aspettando il boss... 👑` |
| Game start button | `Inizia!` / `Inizia! 🧠` |
| Vote submitted | `✓ Hai votato` |
| Loading game | `⚡ Avvio del gioco vincitore...` |
| Final title | `🏆 Classifica Finale` |
| Replay button | `🔄 Rigioca` |
| Change game | `🎮 Cambia gioco` |
| Next round | `Avanti tutta! →` / `Prossimo round →` |
| Timer expired | `⏰` (emoji only for auto-picks) |
| Round badge | `3/8` (compact fraction) |

**Tone**: informal, playful, Italian slang. Emoji used generously in buttons and labels. No formal "Lei" — always "tu" implied.

---

## 7. Styling Approach

- **Mixed**: Tailwind utilities for layout + inline `style={}` objects for dynamic/game-specific values.
- Game phases use **inline style objects** (const `S = { ... }`) at bottom of file — NOT Tailwind classes.
- Fluid sizing via `clamp()` everywhere (font-size, padding, gap).
- Unit preferences: `dvh` for vertical, `vw` for horizontal, `px` for fixed elements.
- No CSS modules. No styled-components.

---

## 8. Game-Specific Gradients

| Game | Gradient |
|---|---|
| Trivia | `linear-gradient(145deg, #A78BFA, #7C3AED, #6D28D9)` |
| Mappa | `linear-gradient(145deg, #34D399, #059669, #047857)` |
| NeverHaveI | `linear-gradient(145deg, #FB923C, #F97316, #EA580C)` |
| **Sentenza** | TBD — suggest violet-indigo to match judicial theme: `linear-gradient(145deg, #818CF8, #6366F1, #4F46E5)` |
