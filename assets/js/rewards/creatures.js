import { byLang } from '../i18n.js';

const A = 'animal';
const C = 'character';
const c = (id, kind, fr, en, ja, es) => ({ id, kind, names: byLang(fr, en, ja, es) });

export const CREATURES = [
  c('stickman', C, 'Stickman', 'Stickman', 'ぼうにんげん', 'Monigote'),
  c('cow', A, 'Vache', 'Cow', 'うし', 'Vaca'),
  c('cat', A, 'Chat', 'Cat', 'ねこ', 'Gato'),
  c('robot', C, 'Robot', 'Robot', 'ロボット', 'Robot'),
  c('frog', A, 'Grenouille', 'Frog', 'かえる', 'Rana'),
  c('ghost', C, 'Fantôme', 'Ghost', 'おばけ', 'Fantasma'),
  c('dog', A, 'Chien', 'Dog', 'いぬ', 'Perro'),
  c('dinosaur', C, 'Dinosaure', 'Dinosaur', 'きょうりゅう', 'Dinosaurio'),
  c('pig', A, 'Cochon', 'Pig', 'ぶた', 'Cerdo'),
  c('wizard', C, 'Magicien', 'Wizard', 'まほうつかい', 'Mago'),
  c('duck', A, 'Canard', 'Duck', 'あひる', 'Pato'),
  c('alien', C, 'Extraterrestre', 'Alien', 'うちゅうじん', 'Extraterrestre'),
  c('sheep', A, 'Mouton', 'Sheep', 'ひつじ', 'Oveja'),
  c('pirate', C, 'Pirate', 'Pirate', 'かいぞく', 'Pirata'),
  c('lion', A, 'Lion', 'Lion', 'ライオン', 'León'),
  c('clown', C, 'Clown', 'Clown', 'ピエロ', 'Payaso'),
  c('elephant', A, 'Éléphant', 'Elephant', 'ぞう', 'Elefante'),
  c('ninja', C, 'Ninja', 'Ninja', 'にんじゃ', 'Ninja'),
  c('monkey', A, 'Singe', 'Monkey', 'さる', 'Mono'),
  c('mermaid', C, 'Sirène', 'Mermaid', 'にんぎょ', 'Sirena'),
  c('penguin', A, 'Pingouin', 'Penguin', 'ペンギン', 'Pingüino'),
  c('chef', C, 'Cuisinier', 'Chef', 'コック', 'Cocinero'),
  c('hen', A, 'Poule', 'Hen', 'にわとり', 'Gallina'),
  c('astronaut', C, 'Astronaute', 'Astronaut', 'うちゅうひこうし', 'Astronauta'),
];
