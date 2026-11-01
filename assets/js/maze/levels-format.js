import { byLang as L, pick } from '../i18n.js';

export const HINTS = {
  straight: L('Compte les cases jusqu’à l’étoile.', 'Count the squares up to the star.', 'ほしまで マスを かぞえてね。', 'Cuenta las casillas hasta la estrella.'),
  turnR: L('Tourne à droite au bon moment.', 'Turn right at the right moment.', 'いい ところで みぎに まわろう。', 'Gira a la derecha en el momento justo.'),
  turnL: L('Regarde de quel côté tourne le chemin.', 'Look which way the path turns.', 'みちが どっちに まがるか みてね。', 'Mira hacia qué lado gira el camino.'),
  L: L('Un chemin en L : un virage entre deux couloirs.', 'An L-shaped path: one turn between two corridors.', 'L の みち：2つの ろうかの あいだに まがりかどが 1つ。', 'Un camino en L: un giro entre dos pasillos.'),
  Z: L('Un chemin en Z : deux virages de sens opposés.', 'A Z-shaped path: two turns in opposite directions.', 'Z の みち：はんたいむきに 2かい まがる。', 'Un camino en Z: dos giros en sentidos opuestos.'),
  long: L('Un nombre dans forward() fait avancer de plusieurs cases.', 'A number inside forward() moves several squares.', 'forward() に かずを いれると なんマスも すすむよ。', 'Un número dentro de forward() hace avanzar varias casillas.'),
  U: L('Deux virages du même côté font demi-tour.', 'Two turns to the same side make a U-turn.', 'おなじ ほうに 2かい まがると U ターン。', 'Dos giros hacia el mismo lado hacen media vuelta.'),
  detour: L('Contourne le mur : monte, passe, redescends.', 'Go around the wall: up, across, back down.', 'かべを よけよう：のぼって、とおって、おりる。', 'Rodea el muro: sube, pasa y vuelve a bajar.'),
  square: L('Un carré, c’est le même côté répété : essaie une boucle.', 'A square is the same side repeated: try a loop.', 'しかくは おなじ へんの くりかえし：くりかえしを つかってみて。', 'Un cuadrado es el mismo lado repetido: prueba un bucle.'),
  rect: L('Un rectangle répète deux côtés différents : une boucle les répète.', 'A rectangle repeats two different sides: a loop repeats them.', 'ながしかくは ちがう 2つの へんの くりかえし：くりかえしで かけるよ。', 'Un rectángulo repite dos lados distintos: un bucle los repite.'),
  stairs: L('Une marche, deux commandes : répète-la avec une boucle.', 'One step, two commands: repeat it with a loop.', '1だんは コマンド 2つ：くりかえしで なんども やろう。', 'Un escalón, dos comandos: repítelo con un bucle.'),
  spiral: L('Une boucle par longueur de côté.', 'One loop for each side length.', 'へんの ながさ ごとに くりかえしを 1つ。', 'Un bucle por cada longitud de lado.'),
  zigzag: L('Le zigzag répète un motif : mets-le dans une boucle.', 'The zigzag repeats a pattern: put it in a loop.', 'ジグザグは もようの くりかえし：くりかえしに いれよう。', 'El zigzag repite un patrón: mételo en un bucle.'),
  nested: L('Essaie une boucle dans une boucle.', 'Try a loop inside a loop.', 'くりかえしの なかに くりかえしを いれてみて。', 'Prueba un bucle dentro de un bucle.'),
  vars: L('Une variable peut grandir à chaque tour : n += 1.', 'A variable can grow each time around: n += 1.', 'へんすうは まわるたびに ふやせるよ：n += 1', 'Una variable puede crecer en cada vuelta: n += 1.'),
  fn: L('Donne un nom au motif qui se répète avec une fonction.', 'Give the repeating pattern a name with a function.', 'くりかえす もように かんすうで なまえを つけよう。', 'Ponle nombre al patrón que se repite con una función.'),
  param: L('Une fonction avec un paramètre fait des motifs de tailles différentes.', 'A function with a parameter makes patterns of different sizes.', 'ひきすうつきの かんすうで いろいろな おおきさの もようが かけるよ。', 'Una función con parámetro hace patrones de distintos tamaños.'),
  while: L('Tu ne connais pas les longueurs : avance tant qu’il n’y a pas de mur.', 'You don’t know the lengths: move forward as long as there is no wall.', 'ながさは わからないね：かべが ない あいだ すすもう。', 'No conoces las longitudes: avanza mientras no haya muro.'),
  ifelse: L('Si un mur est devant, tourne ; sinon, avance.', 'If there is a wall ahead, turn; otherwise, move forward.', 'まえに かべが あったら まわる。なければ すすむ。', 'Si hay un muro delante, gira; si no, avanza.'),
  general: L('Un seul programme doit marcher dans les trois mondes.', 'One single program must work in all three worlds.', '1つの プログラムで 3つの せかい ぜんぶ クリアしよう。', 'Un solo programa debe funcionar en los tres mundos.'),
};

export const hintFor = (focus, lang) => pick(HINTS[focus], lang);

export function encodeSpec(s) {
  const world = (m) => [m.walls.map((r) => r.map((w) => (w ? '#' : '.')).join('')).join('/'),
    m.start.x, m.start.y, m.start.dir, m.goal.x, m.goal.y, m.par, m.tags.join(' ')];
  return [s.mode === 'program' ? 1 : 0, s.tags.join(' '), s.budget?.py ?? 0, s.budget?.js ?? 0, s.reference.py, s.reference.js, s.worlds.map(world)];
}

export function decodeSpec([mode, tags, bpy, bjs, py, js, worlds], level, exercise) {
  return {
    level, exercise, mode: mode ? 'program' : 'repl', tags: tags.split(' '),
    worlds: worlds.map(([walls, sx, sy, dir, gx, gy, par, t]) => {
      const rows = walls.split('/');
      return { w: rows.length, h: rows.length, walls: rows.map((r) => [...r].map((c) => c === '#')),
        start: { x: sx, y: sy, dir }, goal: { x: gx, y: gy }, par, tags: t.split(' ') };
    }),
    budget: mode ? { py: bpy, js: bjs } : null, reference: { py, js },
  };
}
