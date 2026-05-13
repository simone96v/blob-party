// Testi variabili che cambiano in base alla categoria selezionata.
// Per ogni categoria definisce stringhe di UI (CTA, banner, ecc) che la app legge a runtime.
// Tenere tutto qui evita stringhe hard-coded sparse nelle screen.

export const COPY = {
  gamenight: {
    lobbyTitle: 'Chi si fa umiliare stasera? 🎮',
    startCTA: 'Che la carneficina abbia inizio!',
    roundEnd: 'Round finito! 🔥',
  },
  bar: {
    lobbyTitle: 'Chi è ancora sobrio qui? 🍺',
    startCTA: 'Cin cin, cervelli vuoti! 🥃',
    roundEnd: 'Ronda scoccata! 🍻',
  },
  couple: {
    lobbyTitle: 'Dimostra che mi conosci davvero 💕',
    startCTA: 'Iniziamo... se hai il coraggio 🔥',
    roundEnd: 'Carta scoperta! 💘',
  },
  wild: {
    lobbyTitle: 'Chi ha le palle di giocare? 🌶️',
    startCTA: 'Niente censura, si parte! 💥',
    roundEnd: 'Tutti hanno visto! 😈',
  },
}

// Lookup helper con fallback a gamenight in caso di categoria sconosciuta.
export const getCopy = (categoryId) => COPY[categoryId] ?? COPY.gamenight
