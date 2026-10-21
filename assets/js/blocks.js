export const MAX_LEVEL = 114;

// Ordre d'affichage sur l'accueil
export const CATEGORIES = [
  { id: 'read', name: 'Lire et écrire', icon: '📚' },
  { id: 'logic', name: 'Nombres et logique', icon: '🧩' },
  { id: 'code', name: 'Programmer', icon: '💻' },
];

// group: sous-groupe de « Programmer » ('py' | 'js'), null ailleurs et pour le labyrinthe (deux langages)
export const BLOCKS = [
  { id: 'letters', minAge: 2, label: 'Lettres', playable: true, category: 'read', group: null },
  { id: 'words', minAge: 2, label: 'Mots et histoires', playable: true, category: 'read', group: null },
  { id: 'math', minAge: 5, label: 'Calcul', playable: true, category: 'logic', group: null },
  { id: 'logic', minAge: 4, label: 'Logique et suites', playable: false, category: 'logic', group: null },
  { id: 'maze', minAge: 7, label: 'Labyrinthe', playable: true, mix: false, category: 'code', group: null },
  { id: 'python', minAge: 8, label: 'Quiz Python', playable: true, category: 'code', group: 'py' },
  { id: 'guess', minAge: 8, label: 'Devine le nombre', playable: false, category: 'code', group: 'py' },
  { id: 'hangman', minAge: 8, label: 'Pendu', playable: false, category: 'code', group: 'py' },
  { id: 'js', minAge: 8, label: 'Quiz JavaScript', playable: true, category: 'code', group: 'js' },
  { id: 'cookie', minAge: 8, label: 'Cookie clicker', playable: false, category: 'code', group: 'js' },
];
