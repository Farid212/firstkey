# First Key: catégories sur l'écran d'accueil (spec 7)

Date: 2026-10-21. Demande de Farid: « je voudrais créer des catégories »; JavaScript et Python vont dans « Programmer »; « Programmer reste toujours ouvert, ce sont juste les niveaux qui suivent la progression ». Pilote automatique: choix du développeur, à relire.

## Constat
L'accueil montre 6 blocs à plat (Lettres, Mots et histoires, Calcul, Programmation, Quiz JavaScript, Quiz Python), chacun avec sa grille de 114 niveaux. Avec les jeux à venir (Logique et suites, Cookie clicker, Devine le nombre, Pendu), la page devient une longue liste sans fil conducteur.

## Objectifs
1. Trois **catégories**, dans l'ordre d'apprentissage:
   - **Lire et écrire** (📚): Lettres, Mots et histoires.
   - **Nombres et logique** (🧩): Calcul, puis Logique et suites (spec à venir).
   - **Programmer** (💻): Labyrinthe (Python ou JavaScript selon `codeLanguage`), puis deux sous-groupes **Python** (Quiz Python, Devine le nombre, Pendu) et **JavaScript** (Quiz JavaScript, Cookie clicker).
2. **Rien n'est verrouillé** par la catégorie: toutes les catégories et tous les jeux restent ouverts (sous réserve du réglage parent existant: blocs cochés et `minAge`). La progression est portée uniquement par les **niveaux de chaque jeu** (comme aujourd'hui: grille de niveaux, niveaux pas encore atteints grisés).
3. **Chaque jeu garde ses propres niveaux** (son compteur dans `progress`), y compris les futurs mini-jeux: un mini-jeu n'est pas inséré dans les niveaux du quiz de son langage.
4. Les jeux à venir apparaissent tout de suite dans leur catégorie avec la mention « bientôt » (`playable: false`, carte désactivée, comme le prévoit déjà `ui-home.js`).

## Interface
- Accueil: titre, score, bouton « ▶ Jouer · tout mélangé » (inchangé), puis **3 cartes de catégorie** (icône, nom, nombre de jeux, petit résumé « Niveau 12 en Lettres… » du jeu le plus avancé). Un clic ouvre la **page de la catégorie**: bouton ← Retour, titre de la catégorie, puis les cartes de jeux actuelles (icône, nom, « Niveau N », grille de niveaux). Dans « Programmer », deux intertitres **Python** et **JavaScript** au-dessus de leurs jeux; le Labyrinthe en premier, sans intertitre, avec la mention du langage choisi (« en Python »).
- Une catégorie dont aucun jeu n'est coché dans les réglages n'est pas affichée.
- Retour d'une partie: on revient à la page de la catégorie d'où l'on vient (pas à l'accueil).
- Clavier et accessibilité: cartes de catégorie = boutons avec `aria-label` (« Programmer, 5 jeux »), Échap ou ← revient à l'accueil, le focus revient sur la carte de la catégorie quittée. Textes via `textContent`. Tout reste dans les 62 % du haut sur tablette.
- Le « tout mélangé » ne change pas (il tire parmi les blocs jouables, sauf `mix: false`).

## Données
- `blocks.js`: chaque bloc reçoit `category: 'read' | 'logic' | 'code'` et, pour Programmer, `group: 'py' | 'js' | null`; nouvelles entrées `logic` (Logique et suites), `cookie` (Cookie clicker, groupe js), `guess` (Devine le nombre, groupe py), `hangman` (Pendu, groupe py), toutes `playable: false` pour l'instant. Table `CATEGORIES` (id, nom, icône, ordre).
- `store.js`: `progress` et `settings.blocks` acceptent les nouveaux ids (migration douce des anciennes sauvegardes: niveaux existants conservés, nouveaux blocs au niveau 1, cochés par défaut).
- Aucun changement de règles de progression (`progress.js`).

## Hors périmètre
Les jeux eux-mêmes (Logique et suites, Cookie clicker, Devine le nombre, Pendu: une spec chacun ou une spec « mini-jeux »), verrouillage par âge ou par progression, nouveaux sons, refonte visuelle des cartes de jeu.

## À éviter
Perte de progression d'une ancienne sauvegarde; catégorie vide affichée; jeu « bientôt » cliquable; focus perdu en revenant d'une partie; casser le labyrinthe ou les quiz existants.

## Laissé au développeur
Icônes et couleurs des catégories, texte du résumé de catégorie, animation d'ouverture d'une catégorie (légère, respectant `prefers-reduced-motion`).

## Suite prévue (specs séparées)
1. **Mini-jeux « complète le jeu »**: l'écran et le squelette sont fournis, l'enfant écrit 1-2 fonctions; des cas de test vérifient, puis le jeu se débloque pour jouer. Cookie clicker en JavaScript (`clic(score)` → `return score + 1`, puis bonus, boutique), Devine le nombre en Python (`verifier(devine, secret)` → « plus grand / plus petit / gagné »), puis Pendu (`contient(mot, lettre)`, `afficher(mot, trouvees)`). Demande une extension du langage (return, textes, `>=`/`<=`, parcours d'un mot), toujours sans `eval`.
2. **Logique et suites**: tours de 3 exercices, de motifs visuels (1-12) aux suites de nombres, intrus, sudoku 4×4 et règles « si… alors » (85-114), qui préparent les notions du labyrinthe.
