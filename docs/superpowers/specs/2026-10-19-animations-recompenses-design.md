# First Key: animations, sons et collection (spec 2/4)

Date: 2026-10-19. Suite de `2026-10-19-moteur-design.md` (spec 1, livrée). Ordre des specs: 1. moteur (fait), 2. animations et récompenses (ce document), 3. calcul, 4. contenu de programmation.

## Pourquoi

Les enfants de Farid (dès 2 ans) adorent les sons et les couleurs mais s'ennuient vite: c'est la répétition qui les lasse. Les récompenses doivent surprendre et amuser par de la variété: des animaux qui surgissent avec un cri rigolo, des personnages loufoques qui font une blague avec la lettre ou le numéro du niveau, des fêtes entre les niveaux. Réussir des niveaux débloque de nouveaux personnages et animaux à collectionner, que l'enfant retrouve dans une page à lui. Le but: que l'enfant ait envie de continuer à taper, et que ça le fasse rire.

## Objectifs

- Des **récompenses aléatoires**, de temps en temps (pas à chaque bonne réponse).
- Des **animations vraiment soignées et fluides** (mouvements articulés, anticipation, impact, rebond), pas des glissements de blocs.
- **24 personnages et animaux** dessinés et animés par le développeur, avec des **sons synthétisés rigolos**.
- Une **animation de passage de niveau** à chaque niveau gagné.
- Une **collection** commune à tout le jeu: un nouveau personnage ou animal se débloque tous les 5 niveaux gagnés, tous blocs confondus.
- Une **page « Ma collection »** avec les silhouettes des personnages à découvrir.
- Des **badges** qui récompensent des exploits, en plus des personnages, avec deux habillages selon l'âge réglé: têtes d'animaux « kawaii » pour les petits, insignes brillants style « arène » pour les plus grands.
- Un réglage parent pour couper les animations et les sons de récompense.

## Hors périmètre

- Rien ne change dans le score, les niveaux ou la progression (spec 1).
- Pas de musique de fond, pas de voix, pas de vrais enregistrements d'animaux.
- Pas de collection par bloc, pas de partage, pas de comptes, pas de boutique ni d'achats.
- Les contenus de maths et de programmation (specs 3 et 4).
- Pas d'animation sur une mauvaise réponse: elle ne joue que le son « raté » existant.

## À éviter à tout prix

- Qu'une animation **bloque la frappe**: l'enfant doit pouvoir continuer à taper pendant toute animation, même la plus longue. Elle vit sur une couche à part qui ne capte ni touches ni clics.
- Qu'une erreur déclenche quelque chose de négatif ou de moqueur.
- Des clignotements rapides (risque photosensible): jamais plus de 3 flashs par seconde sur une zone large.
- Des images ou des sons effrayants. Tout est rond, coloré, drôle.
- Qu'un enfant voie deux fois de suite exactement la même récompense.

## Contraintes

- Site statique sur GitHub Pages, JS simple (modules ES), pas de build, **aucune dépendance**.
- **Aucun fichier image, vidéo ni audio ajouté**: tous les dessins sont du SVG construit par le code, tous les sons sont synthétisés avec l'API Web Audio. (Les fichiers audio existants `CA1.mp3` pour « correct » et `WA3.mp3` pour « raté » restent utilisés tels quels par le moteur.)
- Fluidité sur une tablette ou un ordinateur modeste: viser 60 images par seconde, s'arrêter quand rien ne s'anime, se mettre en pause quand l'onglet est caché.
- Respecter `prefers-reduced-motion`: dans ce cas, remplacer les mouvements par une apparition simple et douce.
- Le son ne démarre qu'après une action de l'enfant (règle des navigateurs); le premier appui sur une touche suffit.
- Interface en français. Noms des personnages affichés dans la langue choisie dans les réglages (fr, en, ja).
- Les animations sont décoratives: cachées des lecteurs d'écran.
- S'appuyer sur ce qui existe: événements `document` `firstkey:correct` (`detail: { blockId, level }`) et `firstkey:levelup` (`detail: { blockId, level, newLevel }`, `level` = niveau qui vient d'être fini), émis par `assets/js/ui-game.js`. L'état est dans `localStorage` via `assets/js/store.js`.

## Décisions de Farid

**Création.** Farid n'a rien de dessiné: le développeur crée tout (dessins, animations, sons). Les sons sont synthétisés et rigolos, pas réalistes (un « meuh » reconnaissable mais drôle).

**Rythme.** Une récompense de temps en temps, pas à chaque bonne réponse.

**Trois familles de récompenses**, tirées au hasard:
1. Un **animal** surgit et fait son cri rigolo.
2. Un **personnage loufoque** fait une blague (par exemple un stickman qui shoote la lettre hors de l'écran).
3. Un **écran de fête** entre les niveaux (ballons, cadeau, confettis).

**Passage de niveau.** À chaque niveau gagné, une animation de passage de niveau, par exemple le stickman qui shoote l'ancien numéro hors de l'écran puis peint le nouveau. Le prototype de référence est `docs/superpowers/specs/reference/prototype-stickman-passage-de-niveau.html` (marche avec foulée, préparation du coup de pied, impact « POW! » avec secousse, le « 2 » vole en arc, le pinceau suit le tracé du « 3 », deux sauts avec confettis). Farid l'a validé comme niveau de fluidité à atteindre. C'est un prototype jetable: il montre le ressenti, pas le code à garder.

**Collection.** Réussir des niveaux débloque de nouveaux personnages et animaux à collectionner. Le rythme est **tous les 5 niveaux environ**, avec une **collection unique pour tout le jeu**: les niveaux gagnés comptent tous blocs confondus. Il y a **24** personnages et animaux dans cette version (plus pourront être ajoutés plus tard). Une fois tout débloqué, les récompenses continuent au hasard parmi les 24.

**Page « Ma collection ».** Une page à l'enfant, avec des **silhouettes à découvrir** pour les personnages pas encore débloqués. Maquette validée: grille de cartes, un compteur « n / 24 découverts », deux sections (Animaux, Personnages), cartes débloquées colorées avec leur nom, cartes à découvrir en silhouette noire avec « ??? ».

**Badges.** Des badges ludiques en plus des personnages. Farid laisse le choix des exploits au développeur. Deux habillages selon l'âge de l'enfant (réglage « âge » de la spec 1): pour les petits (dès 2 ans), des **badges à tête d'animaux mignons**; pour les 6 ans et plus, des **badges façon insignes d'arène de jeu de monstres de poche**. Ce sont des dessins **originaux**, jamais ceux d'un vrai jeu (droits). Maquette validée: deux séries côte à côte, mêmes exploits, badges verrouillés grisés avec un cadenas.

## Mes choix (Claude), à confirmer en relisant

- **Badges, seuil d'âge**: habillage « animaux mignons » si l'âge réglé est strictement inférieur à 6, « insignes » à partir de 6. Changer l'âge change l'habillage de tous les badges (déjà gagnés compris).
- **Badges, exploits** (les mêmes pour les deux habillages, environ 17): première bonne réponse; 10 puis 25 bonnes réponses d'affilée; premier niveau gagné; niveau 10, 25, 50 puis 100 atteint dans un bloc; 100, 500 puis 1000 bonnes réponses au total; « Explorateur » = avoir joué à tous les blocs jouables; premier mot complet; première phrase complète; 12 puis 24 créatures dans la collection; jouer 3 jours de suite. Le développeur peut ajuster la liste.
- **Badges, où**: dans « Ma collection », une section « Badges » à côté de la section des créatures, avec cadenas pour ceux à gagner. Gagner un badge déclenche une petite fête avec le badge qui apparaît (même règle: jamais de blocage de la frappe).
- **Statistiques à sauvegarder** pour les badges, dans le champ `rewards` de l'état: bonnes réponses au total, série en cours et meilleure série, blocs déjà essayés, mot et phrase déjà tapés, jours joués de suite (dernier jour joué et longueur de la série de jours), badges gagnés et badges déjà vus. La « série d'affilée » repart à zéro à une mauvaise touche (rien d'autre n'arrive, c'est un compteur caché). `store.js` valide et complète ces champs.
- **Événements à compléter** dans `ui-game.js`: un nouvel événement `firstkey:wrong` (pour la série), et `firstkey:correct` doit aussi porter la longueur de la réponse et son type (lettre, mot, phrase) pour reconnaître « premier mot » et « première phrase ». Ce sont de petits ajouts au moteur.

- **Liste des 24** (modifiable): 12 animaux (vache, chat, grenouille, chien, cochon, canard, mouton, lion, éléphant, singe, pingouin, poule) et 12 personnages (stickman, robot, fantôme, dinosaure, magicien, extraterrestre, pirate, clown, ninja, sirène, cuisinier, astronaute). L'ordre de déblocage est fixe; le développeur peut l'ajuster.
- **Au départ**, 2 sont déjà débloqués (stickman et vache), pour que les récompenses marchent dès la première partie.
- **Fréquence**: une récompense aléatoire toutes les 6 à 10 bonnes réponses (tirage au hasard à chaque fois). Pas deux fois de suite la même créature, ni deux fois de suite la même famille.
- **Une récompense « animal » ou « personnage »** n'utilise que des créatures déjà débloquées.
- **Compteur de déblocage**: l'état gagne un champ `rewards` avec le nombre total de niveaux gagnés (`levelUps`), le nombre de créatures débloquées (`unlocked`) et le nombre déjà vues dans la collection (`seen`, pour afficher « nouveau! »). Un nouveau déblocage tous les 5 `levelUps`. Le saut de niveau des réglages parent (spec 1) **ne débloque rien** (seuls les vrais niveaux gagnés comptent). La remise à zéro des réglages efface aussi ce champ. `store.js` doit le valider et le compléter comme les autres champs.
- **Passage de niveau**: toujours une animation, choisie au hasard parmi 2 variantes au moins (le stickman et un écran de fête avec ballons et cadeau). Quand un niveau débloque une créature, un cadeau s'ouvre et la révèle avec son cri.
- **Les animations ne gênent pas la frappe**: la question suivante est déjà affichée et tapable pendant l'animation; la blague porte sur la lettre qui vient d'être validée (qui s'envole, disparaît, etc.), pas sur la suivante.
- **Dans la collection**, toucher une carte débloquée rejoue l'animation de la créature avec son cri.
- **Réglages parent**: deux cases « Animations de récompense » et « Sons de récompense » (activées par défaut). Elles n'affectent pas les sons « correct » et « raté » du moteur.
- **Volume** des sons synthétisés volontairement doux (pas de pics forts), car il s'agit de jeunes enfants.

## Laissé au développeur

L'organisation des fichiers (par exemple un dossier pour les créatures, un module audio de synthèse, un planificateur de récompenses qui écoute les événements, l'écran de collection), la technique d'animation (JS avec `requestAnimationFrame` ou Web Animations), les dessins exacts des 24 créatures, la blague et le cri de chacune, les durées et les courbes de mouvement, les paramètres de synthèse, la façon d'afficher la révélation d'un nouveau déblocage, les variantes de l'écran de fête, le dessin des badges (par exemple un générateur de formes paramétrées pour les insignes, une tête d'animal par exploit pour les petits), les noms des badges dans les trois langues, le bouton d'accès à « Ma collection » sur l'accueil, et les tests (la logique de rythme, de choix, de déblocage et de sauvegarde se teste avec `node --test` comme en spec 1; l'animation se vérifie à la main dans le navigateur).

## État actuel du code (pour partir de l'existant)

`assets/js/ui-game.js` émet `firstkey:correct` et `firstkey:levelup`. `assets/js/main.js` route accueil / jeu / réglages et sauvegarde via `saveState` à chaque `onChange`. `assets/js/ui-home.js` et `ui-settings.js` construisent leur DOM avec `textContent`, sans `innerHTML` sur des données: garder cette règle. Les fichiers audio `CA2` à `CA4` et `WA1`, `WA2`, `WA4`, `WA5` sont inutilisés: ils ne font pas partie de cette spec. Défauts connus laissés pour plus tard: aucun lien avec cette spec.
