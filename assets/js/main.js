import { loadState, saveState } from './store.js';
import { renderHome } from './ui-home.js';
import { startGame } from './ui-game.js';
import { openSettings } from './ui-settings.js';

const root = document.getElementById('app');
const gear = document.getElementById('gear');
let state = loadState();

const onChange = (s) => {
  state = s;
  saveState(s);
};

function home() {
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

gear.onclick = () => openSettings(root, state, { onChange, onClose: home });
home();
