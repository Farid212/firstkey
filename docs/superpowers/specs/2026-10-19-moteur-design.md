# First Key: moteur de jeu (spec 1/4)

Date: 2026-10-19. Ordre des specs: 1. moteur et réglages (ce document), 2. animations et récompenses, 3. calcul, 4. contenu de programmation (JavaScript / Python).

## Pourquoi

First Key est un jeu de clavier que Farid a fait pour ses enfants, dès 2 ans. Il tourne sur GitHub Pages. Aujourd'hui: une lettre ou un mot s'affiche, l'enfant le tape, 25 bonnes réponses font monter d'un niveau. Les enfants adorent les sons et les couleurs mais s'ennuient vite. Farid veut un jeu qui grandit avec eux (frappe, mots, histoires, calcul, puis programmation) et qui surprend.

Ce document décrit seulement le **moteur**: l'écran d'accueil, les blocs, les niveaux, la sauvegarde, les réglages et la façon dont une question est posée. Animations, contenu de maths et contenu de code sont des specs séparées. Le moteur doit les accueillir sans être réécrit.

## Objectifs

- Un écran d'accueil avec des blocs: Lettres, Mots et histoires, Calcul, JavaScript, Python, plus « Tout mélangé » (aléatoire) en haut.
- Chaque bloc a environ 114 niveaux (ordre de grandeur, pas un chiffre exact) et sa propre progression.
- L'enfant ne voit que les niveaux déjà atteints d'un bloc.
- Le moteur pose des questions de types différents (frappe, choix à la souris, plus tard QCM et code). Les types viennent des blocs.
- Réglages protégés pour le parent (voir plus bas).
- Sauvegarde automatique: l'enfant retrouve son niveau et son score en revenant.
- Langues: français, anglais, japonais.

## Hors périmètre (dans ce document)

- Les animations de récompense (spec 2). Le moteur laisse seulement un point d'accroche: « bonne réponse » et « niveau gagné ».
- Le contenu des maths (spec 3), de JavaScript et Python (spec 4). Le moteur fournit le type de question « QCM » et « code », leurs contenus viennent après.
- Plusieurs profils d'enfants (non voulu), comptes, serveur, partage entre appareils.

## À éviter à tout prix

- Qu'une erreur punisse l'enfant: rien à perdre, rien à bloquer. Une mauvaise réponse joue le son raté, l'enfant réessaie.
- Qu'un enfant tombe sur les réglages en tapant au hasard.
- Qu'une animation ou un chargement l'empêche de continuer à taper.

## Contraintes

- Site statique sur GitHub Pages: HTML, CSS, JavaScript simple, pas de build, pas de serveur.
- Aucune donnée envoyée ailleurs. Les mots viennent de listes intégrées au jeu (voir plus bas).
- Sauvegarde dans le navigateur de l'appareil (`localStorage`): pas partagée entre ordinateur et tablette.
- Un seul profil par appareil.
- Utilisable par un enfant de 2 ans: gros éléments, rien à lire pour démarrer.

## Décisions de Farid

**Écran d'accueil.** « Tout mélangé » tout en haut, puis un bloc par chapitre. Chaque bloc affiche son niveau actuel. Le mode aléatoire pioche dans tous les blocs.

**Niveaux.** Ordre de grandeur ~114 niveaux par bloc. Un niveau est atteint par un nombre de bonnes réponses (aujourd'hui 25), qui peut dépendre de l'âge. L'enfant ne peut ouvrir que les niveaux déjà atteints.

**Bloc Mots et histoires.** Plus le niveau monte, plus il y a de texte. Les derniers niveaux font retaper une histoire, comme typing.com, avec des animations.

**Erreur.** Son raté, l'enfant réessaie. Pas de recul de niveau, pas de remise à zéro du score.

**Score.** Un total unique pour tout le jeu, tous blocs confondus. Il ne baisse jamais.

**Reprise.** À la reconnexion: le niveau de chaque bloc et le score total sont retrouvés.

**Réglages.** Une icône engrenage discrète dans un coin, protégée par un petit calcul (que seul un adulte résout). Réglages voulus: âge de l'enfant (adapte la difficulté), majuscules ou non, blocs actifs pour la partie en cours (par exemple « programmation seulement »), langue.

**Langues.** Français, anglais, japonais. En japonais: hiragana d'abord, puis katakana, puis kanji simples avec leur lecture en furigana. L'enfant tape en romaji sur un clavier normal (« k » puis « a » pour か). Pas besoin de clavier japonais.

## Mes choix (Claude), à confirmer en relisant

- Les mots du jeu viennent de listes intégrées pour le français, l'anglais et le japonais, adaptées à l'âge. L'API Datamuse (anglais seulement, appelée aujourd'hui) disparaît.
- Les 114 niveaux sont un ordre de grandeur: le nombre exact est un réglage, pas gravé dans le code.
- Le mode aléatoire pioche dans tous les blocs avec la difficulté de chaque bloc.
- La langue est un réglage global. Le japonais est un mode de Lettres et de Mots, pas un bloc à part.
- Le parent peut sauter à un niveau depuis les réglages (remplace le `prompt` actuel). Un bouton « recommencer à zéro » efface la sauvegarde.
- Les types de questions sont des modules interchangeables que les blocs combinent, pour que les specs 3 et 4 s'ajoutent sans toucher au cœur.

## Laissé au développeur

Structure des fichiers, format de la sauvegarde, nombre exact de bonnes réponses par niveau et par âge, tailles et polices, choix du petit calcul de protection, découpage en modules, façon d'écrire les listes de mots.

## État actuel du code (pour partir de l'existant)

`index.html`, `assets/js/app.js` (150 lignes), `assets/css/style.css`. jQuery est chargé mais inutilisé. Sons dans `assets/audio/` (4 « correct », 5 « raté », seuls CA1 et WA3 utilisés). Défauts connus à corriger au passage: le filtre alphanumérique n'existe qu'au niveau 1, le niveau de départ est une chaîne de caractères, `fetchData` renvoie l'erreur à la place d'un tableau, les majuscules (verrouillage) font échouer la comparaison.
