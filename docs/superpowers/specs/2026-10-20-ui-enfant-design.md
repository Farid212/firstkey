# First Key: interface enfant plus agréable et centrée

Date: 2026-10-20. Demande de Farid: « l'UI pour les enfants doit être plus agréable et centrée ». Choix du développeur (pilote automatique), à relire.

## Constat (captures)
- Accueil: simple liste de boutons blancs collée en haut, sans titre ni identité, pastilles de niveaux minuscules.
- Jeu: la lettre ou la question est en haut de l'écran, de grands vides en dessous, la barre (retour, score) est petite et alignée à gauche.

## Objectifs
- **Jeu centré**: la question (lettre, mot, calcul, code) et les réponses sont centrées horizontalement et verticalement dans la zone haute de l'écran (au-dessus de la bande basse réservée aux animations de récompense, soit les 62 % du haut), dans une grande carte blanche arrondie qui « pop » à chaque nouvelle question (animation douce, respecte `prefers-reduced-motion`). Barre du haut: bouton retour rond, pastille de score, et une **barre de progression du niveau** (réponses justes / réponses par niveau) colorée avec le numéro du niveau.
- **Accueil centré et chaleureux**: titre « First Key » avec une petite touche ludique, pastille de score total, grosse carte « ▶ Jouer (tout mélangé) », puis une grille de cartes de blocs (une couleur et une icône par bloc: Lettres 🔤, Mots 📖, Calcul ➕, JavaScript 🟨, Python 🐍), chacune avec le niveau actuel, la grille de niveaux (pastilles plus grosses, 44 px au moins) dans la carte; bouton « 🎒 Ma collection ». Colonne centrée (max 720 px), espacements réguliers, mobile et tablette d'abord (cibles tactiles ≥ 48 px).
- Les autres écrans (réglages, collection) gardent leur fonctionnement mais reprennent les mêmes marges, la même carte et la même typographie.

## Contraintes
- Aucune dépendance, aucun fichier image (emojis et CSS seulement), textes via `textContent`.
- Rien ne change dans la logique: événements `firstkey:*`, états, scores, récompenses, QCM; tests existants verts.
- Rien ne masque la bande basse de l'écran (l'animation stickman, les animaux et les badges y vivent): le contenu du jeu reste dans les 62 % du haut sur un écran de 812 px de haut (et proportionnellement sur tablette); la collection garde son padding bas.
- Jamais plus de 3 clignotements par seconde; animation de « pop » ≤ 300 ms; `prefers-reduced-motion`: pas d'animation.
- Mobile 360 px sans défilement horizontal, grand écran sans étirement excessif.
- Lisible: contraste suffisant, focus visible, boutons réels.

## Laissé au développeur
Palette exacte, emojis, taille des polices (garder le comportement de réduction pour les longs textes), structure DOM de la barre de progression, nom des classes CSS.
