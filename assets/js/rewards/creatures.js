const A = 'animal';
const C = 'character';
const c = (id, kind, fr, en, ja) => ({ id, kind, names: { fr, en, ja } });

export const CREATURES = [
  c('stickman', C, 'Stickman', 'Stickman', 'ぼうにんげん'),
  c('cow', A, 'Vache', 'Cow', 'うし'),
  c('cat', A, 'Chat', 'Cat', 'ねこ'),
  c('robot', C, 'Robot', 'Robot', 'ロボット'),
  c('frog', A, 'Grenouille', 'Frog', 'かえる'),
  c('ghost', C, 'Fantôme', 'Ghost', 'おばけ'),
  c('dog', A, 'Chien', 'Dog', 'いぬ'),
  c('dinosaur', C, 'Dinosaure', 'Dinosaur', 'きょうりゅう'),
  c('pig', A, 'Cochon', 'Pig', 'ぶた'),
  c('wizard', C, 'Magicien', 'Wizard', 'まほうつかい'),
  c('duck', A, 'Canard', 'Duck', 'あひる'),
  c('alien', C, 'Extraterrestre', 'Alien', 'うちゅうじん'),
  c('sheep', A, 'Mouton', 'Sheep', 'ひつじ'),
  c('pirate', C, 'Pirate', 'Pirate', 'かいぞく'),
  c('lion', A, 'Lion', 'Lion', 'ライオン'),
  c('clown', C, 'Clown', 'Clown', 'ピエロ'),
  c('elephant', A, 'Éléphant', 'Elephant', 'ぞう'),
  c('ninja', C, 'Ninja', 'Ninja', 'にんじゃ'),
  c('monkey', A, 'Singe', 'Monkey', 'さる'),
  c('mermaid', C, 'Sirène', 'Mermaid', 'にんぎょ'),
  c('penguin', A, 'Pingouin', 'Penguin', 'ペンギン'),
  c('chef', C, 'Cuisinier', 'Chef', 'コック'),
  c('hen', A, 'Poule', 'Hen', 'にわとり'),
  c('astronaut', C, 'Astronaute', 'Astronaut', 'うちゅうひこうし'),
];
