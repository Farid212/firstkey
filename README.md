<h1 align="center">Welcome to First Key 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-v 0.0.1-blue.svg?cacheSeconds=2592000" />
  <a href="na">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" target="_blank" />
  </a>
  <a href="na">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" target="_blank" />
  </a>
  <a href="https://twitter.com/faridh212">
    <img alt="Twitter: faridh212" src="https://img.shields.io/twitter/follow/faridh212.svg?style=social" target="_blank" />
  </a>
</p>

> This project I am working it for my daughter, I put the song she love.

> if you wanna your kids enjoy computer from very young

### 🏠 [Homepage](na)

## Tech

- ### Bootstrap
- ### CSS
- ### Javascript
- ### jQuery


## Author

👤 **Farid Hammouten**

* Twitter: [@faridh212](https://twitter.com/faridh212)
* Github: [@farid212](https://github.com/farid212)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/Farid212/firstkey/issues).

## Catégories de l'accueil

L'accueil montre « ▶ Jouer · tout mélangé », puis trois catégories (`CATEGORIES` dans `assets/js/blocks.js`, dans l'ordre d'affichage): Lire et écrire, Nombres et logique, Programmer. Un clic ouvre la page de la catégorie (← Retour ou Échap) avec les cartes de jeux et leur grille de niveaux; en sortant d'une partie, on revient à cette page. Une catégorie n'est affichée que si au moins un de ses jeux jouables est coché dans les réglages; les jeux « bientôt » (`playable: false`) y apparaissent toujours, désactivés, et n'ont pas de case dans les réglages.

- **Ajouter un jeu**: une entrée dans `BLOCKS` avec un `id` stable (clé de la progression sauvegardée), `label`, `minAge`, `playable`, `category` et `group` (`'py'` / `'js'` dans Programmer, sinon `null`), plus une icône dans `ICONS` (`assets/js/ui-home.js`) et ses couleurs `.block-<id>` dans `style.css`. Ne jamais renommer un `id` existant.
- **Ajouter une catégorie**: une entrée dans `CATEGORIES` (id, nom, icône) et ses couleurs `.cat-<id>` dans `style.css`.

## Récompenses et collection

Les récompenses vivent dans `assets/js/rewards/`. Pour ajouter une créature: une entrée dans `creatures.js` (id, famille `animal` ou `character`, noms fr/en/ja, à la fin pour garder l'ordre de déblocage), un module d'art dans `art/` qui exporte `ART = { id: { draw, cry, act } }`, puis l'ajouter au registre `art/index.js`. Passer `CREATURE_COUNT` dans `model.js` à la nouvelle taille. `npm test` échoue tant qu'une créature n'a pas d'art. Pour revoir une animation sans jouer: `document.dispatchEvent(new CustomEvent('firstkey:preview', { detail: { id: 'cow' } }))` (aussi `badge:<id>`, `levelup:stickman`, `levelup:party`).

## Bloc Calcul

`assets/js/math.js` génère les questions (module pur). Niveaux 1 à 57: choix multiple (3 puis 4 boutons, touches 1 à 4); niveaux 58 à 114: réponse tapée. Opérations par bandes de niveaux: addition 1-24, soustraction 25-44, multiplication 45-74, division 75-94, mélange 95-114.

## Blocs JavaScript et Python

Niveaux 1 à 57: « Que s'affiche-t-il ? » en choix multiple; niveaux 58 à 114: retaper une ligne de code. Les exemples sont dans `assets/js/data/code-js.js` et `code-python.js` (`quiz` et `lines`); `npm test` exécute chaque programme (JavaScript dans Node, Python avec `python3` s'il est installé) pour vérifier sa réponse. « Tout mélangé » ne tire un bloc que si l'âge réglé atteint son âge minimal (`minAge` dans `blocks.js`).

## Programmation en jeu (labyrinthes)

Le bloc « Programmation » est un terminal puis un éditeur: l'enfant tape de vraies commandes Python ou JavaScript (langage choisi dans les réglages) pour guider une créature de sa collection jusqu'à l'étoile. **Un niveau est un tour de 3 exercices du même style**, du plus facile au plus difficile; chaque tour reprend la notion du tour précédent (`assets/js/maze/curriculum.js` est la source de vérité: nom, notion et compétences cumulées de chaque tour).

- **Niveaux 1 à 72, terminal ligne par ligne** (Entrée exécute): `forward()`, `forward(3)`, virages, boucle `for`, `if` / `while` sur une ligne.
- **Niveaux 73 à 114, éditeur de programme**: plusieurs lignes, variables, boucles imbriquées (73-86), fonctions (87-100), programmes généraux testés dans 3 mondes avec `while` / `if` / `else` (101-114), avec un **budget de lignes** déduit d'un programme de référence.
- Code dans `assets/js/maze/`: `gen.js` (segments étiquetés, solveur), `curriculum.js`, `levels-gen.js` (générateur: labyrinthes, références, budgets, mondes), `levels.js` (`levelSpec(niveau, exercice)`, lit les 342 exercices précalculés de `levels-data.js`), `lang.js` (analyseur écrit à la main, jamais d'`eval`; `parse` pour une ligne, `parseProgram` pour un programme), `world.js` (exécution). Écran: `assets/js/ui-maze.js`. Pour ajouter un tour: une ligne dans `curriculum.js` et un segment ou une famille dans `levels-gen.js`; les tests vérifient les règles de tour, la solubilité, que chaque programme de référence atteint l'étoile dans les deux langages et que la notion est vraiment demandée (sans elle, le programme dépasse le budget).
- **Après toute modification du générateur** (`levels-gen.js`, `gen.js`, `lang.js`, `world.js`): `npm run build:levels` (ou `node scripts/build-levels.mjs`) régénère `assets/js/maze/levels-data.js`; `npm test` échoue tant que ce fichier est périmé.

## Show your support

Give a ⭐️ if this project helped you!

<a href="#">
  <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

## 📝 License

Copyright © 2019 [Farid Hammouten](https://github.com/farid212).<br />
This project is [MIT](LICENSE.md) licensed.

***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
