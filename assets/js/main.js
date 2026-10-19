import { loadState, saveState } from './store.js';
import { renderHome } from './ui-home.js';
import { startGame } from './ui-game.js';
import { openSettings } from './ui-settings.js';
import { createAudio } from './rewards/audio.js';
import { createFx } from './rewards/fx.js';
import { startDirector } from './rewards/director.js';

const root = document.getElementById('app');
const gear = document.getElementById('gear');
let state = loadState();

const onChange = (s) => {
  state = s;
  saveState(s);
};

const audio = createAudio();
const fx = createFx(document.body, audio);
const director = startDirector({ getState: () => state, onChange, audio, fx });
// le navigateur n'autorise le son qu'après un geste
for (const t of ['keydown', 'pointerdown']) document.addEventListener(t, audio.unlock, { once: true });

function home() {
  director.clear(); // quitter la partie: plus aucune animation en cours ou en file
  gear.hidden = false;
  renderHome(root, state, {
    onPlay: (blockId) => game({ blockId }),
    onPickLevel: (blockId, level) => game({ blockId, level }),
  });
}

function game(target) {
  gear.hidden = true; // pas de réglages pendant une partie (écouteurs clavier actifs)
  startGame(root, state, target, { onChange, getState: () => state, onExit: home });
}

gear.onclick = () => { director.clear(); openSettings(root, state, { onChange, onClose: home }); };
home();
