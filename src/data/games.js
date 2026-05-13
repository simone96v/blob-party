// Registro dei giochi disponibili nell'hub.
// `component` è lazy-loaded così il bundle iniziale resta minimo.
// `locked: true` → "Prossimamente", non giocabile.
// `compatibility.multi/single` → in quali modalità mostrarlo.
// `compatibility.excludedCategories` → categorie in cui NON mostrarlo.

import { lazy } from 'react'

export const GAMES = [
  {
    id: 'trivia',
    name: 'Trivia',
    emoji: '🧠',
    tagline: 'Chi sa di più?',
    description: 'Cultura, scienza, sport e gossip. Chi sa di più vince.',
    difficulty: 2,
    minPlayers: 2,
    maxPlayers: 8,
    locked: false,
    bg: 'linear-gradient(145deg, #A78BFA 0%, #7C3AED 60%, #6D28D9 100%)',
    shadow: 'rgba(124, 58, 237, 0.40)',
    compatibility: { multi: true, single: false, excludedCategories: [] },
    component: lazy(() => import('../games/Trivia')),
  },
  {
    id: 'bottle',
    name: 'Bottiglia!',
    emoji: '🍾',
    tagline: 'Verità o obbligo',
    description: 'Gira la bottiglia e mettiti in gioco. Verità o obbligo?',
    difficulty: 1,
    minPlayers: 2,
    maxPlayers: 8,
    locked: true,
    bg: 'linear-gradient(145deg, #34D399 0%, #10B981 60%, #047857 100%)',
    shadow: 'rgba(16, 185, 129, 0.40)',
    compatibility: { multi: true, single: true, excludedCategories: [] },
    component: lazy(() => import('../games/Bottle')),
  },
  {
    id: 'spinwheel',
    name: 'Spin the Wheel',
    emoji: '🎡',
    tagline: 'Gira la ruota, bevi (forse)',
    description: 'Una ruota di destini alcolici. Tu giri, la sorte decide chi beve.',
    difficulty: 1,
    minPlayers: 2,
    maxPlayers: 8,
    locked: true,
    bg: 'linear-gradient(145deg, #FBBF24 0%, #F59E0B 60%, #D97706 100%)',
    shadow: 'rgba(245, 158, 11, 0.40)',
    compatibility: { multi: true, single: true, excludedCategories: ['couple', 'gamenight'] },
    component: lazy(() => import('../games/SpinTheWheel')),
  },
  {
    id: 'truthordare',
    name: 'Obbligo o Verità',
    emoji: '💋',
    tagline: 'Niente bottiglia, niente filtri',
    description: 'Estrazione casuale. Scegli verità o obbligo. Bevi se ti tiri indietro.',
    difficulty: 1,
    minPlayers: 2,
    maxPlayers: 8,
    locked: true,
    bg: 'linear-gradient(145deg, #F472B6 0%, #EC4899 60%, #DB2777 100%)',
    shadow: 'rgba(236, 72, 153, 0.40)',
    compatibility: { multi: true, single: true, excludedCategories: ['couple', 'gamenight'] },
    component: lazy(() => import('../games/TruthOrDare')),
  },
  {
    id: 'neverhave',
    name: 'Non ho mai',
    emoji: '🍻',
    tagline: 'Chi l\'ha fatto beve',
    description: 'Si pesca una carta "Non ho mai...". Chi l\'ha fatto beve.',
    difficulty: 1,
    minPlayers: 2,
    maxPlayers: 8,
    locked: true,
    bg: 'linear-gradient(145deg, #FB923C 0%, #F97316 60%, #EA580C 100%)',
    shadow: 'rgba(249, 115, 22, 0.40)',
    compatibility: { multi: true, single: true, excludedCategories: ['couple', 'gamenight'] },
    component: lazy(() => import('../games/NeverHaveI')),
  },
  {
    id: 'stop',
    name: 'Stop!',
    emoji: '✏️',
    tagline: 'Cervello vs. timer',
    description: 'Data una lettera, riempi le categorie prima dello stop.',
    difficulty: 2,
    minPlayers: 2,
    maxPlayers: 8,
    locked: true,
    bg: 'linear-gradient(145deg, #FCD34D 0%, #F59E0B 60%, #D97706 100%)',
    shadow: 'rgba(245, 158, 11, 0.35)',
    compatibility: { multi: true, single: true, excludedCategories: [] },
  },
  {
    id: 'bluff',
    name: 'Bluff',
    emoji: '🃏',
    tagline: 'Mentire è un\'arte',
    description: 'Inventa definizioni false. Vince il più convincente.',
    difficulty: 3,
    minPlayers: 3,
    maxPlayers: 8,
    locked: true,
    bg: 'linear-gradient(145deg, #F87171 0%, #EF4444 60%, #DC2626 100%)',
    shadow: 'rgba(239, 68, 68, 0.35)',
    compatibility: { multi: true, single: false, excludedCategories: [] },
  },
  {
    id: 'mimo',
    name: 'Mimo',
    emoji: '🎭',
    tagline: 'Recita o sparisci',
    description: 'Fai indovinare solo col corpo. Nessuna parola.',
    difficulty: 1,
    minPlayers: 4,
    maxPlayers: 8,
    locked: true,
    bg: 'linear-gradient(145deg, #F472B6 0%, #EC4899 60%, #DB2777 100%)',
    shadow: 'rgba(236, 72, 153, 0.35)',
    compatibility: { multi: true, single: true, excludedCategories: [] },
  },
]

export const getGame = (id) => GAMES.find((g) => g.id === id)

// Filtra i giochi giocabili in una certa mode + categoria.
export const availableGamesFor = ({ mode, categoryId }) => GAMES.filter((g) => {
  if (g.locked) return false
  if (mode === 'local' && !g.compatibility?.single) return false
  if (mode === 'online' && !g.compatibility?.multi) return false
  if (categoryId && g.compatibility?.excludedCategories?.includes(categoryId)) return false
  return true
})
