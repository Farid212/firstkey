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

## Récompenses et collection

Les récompenses vivent dans `assets/js/rewards/`. Pour ajouter une créature: une entrée dans `creatures.js` (id, famille `animal` ou `character`, noms fr/en/ja, à la fin pour garder l'ordre de déblocage), un module d'art dans `art/` qui exporte `ART = { id: { draw, cry, act } }`, puis l'ajouter au registre `art/index.js`. Passer `CREATURE_COUNT` dans `model.js` à la nouvelle taille. `npm test` échoue tant qu'une créature n'a pas d'art. Pour revoir une animation sans jouer: `document.dispatchEvent(new CustomEvent('firstkey:preview', { detail: { id: 'cow' } }))` (aussi `badge:<id>`, `levelup:stickman`, `levelup:party`).

## Bloc Calcul

`assets/js/math.js` génère les questions (module pur). Niveaux 1 à 57: choix multiple (3 puis 4 boutons, touches 1 à 4); niveaux 58 à 114: réponse tapée. Opérations par bandes de niveaux: addition 1-24, soustraction 25-44, multiplication 45-74, division 75-94, mélange 95-114.

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
