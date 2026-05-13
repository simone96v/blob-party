// Categorie di serata mostrate nella CategoryScreen.
// `triviaCategoryFor` mappa l'id categoria UI → categoria di trivia.json.

export const CATEGORIES = [
  {
    id: 'couple',
    label: 'Coppia',
    emoji: '💕',
    description: 'Solo io e te. Pronti a conoscerci sul serio?',
    bg: 'linear-gradient(135deg, #F472B6 0%, #EC4899 60%, #DB2777 100%)',
    shadow: 'rgba(236, 72, 153, 0.40)',
    ageWarning: true,
  },
  {
    id: 'gamenight',
    label: 'Serata tra amici',
    emoji: '🎮',
    description: 'Domande casual, sfide leggere. Classica.',
    bg: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 60%, #6D28D9 100%)',
    shadow: 'rgba(124, 58, 237, 0.40)',
  },
  {
    id: 'bar',
    label: 'Giochi alcolici',
    emoji: '🍺',
    description: 'Drink in mano. Freni inibitori giù.',
    bg: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 60%, #D97706 100%)',
    shadow: 'rgba(245, 158, 11, 0.40)',
    ageWarning: true,
  },
]

export const getCategory = (id) => CATEGORIES.find((c) => c.id === id)

// Mappa l'id UI → categoria nel pool trivia.json. Per ora 1:1.
export const triviaCategoryFor = (id) => id
