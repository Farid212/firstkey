import { loadState, saveState } from './store.js';
import { renderHome } from './ui-home.js';
import { startGame } from './ui-game.js';

const root = document.getElementById('app');
let state = loadState();

const onChange = (s) => {
  state = s;
  saveState(s);
};

function home() {
  renderHome(root, state, {
    onPlay: (blockId) => game({ blockId }),
    onPickLevel: (blockId, level) => game({ blockId, level }),
    onOpenSettings: () => {},
  });
}

function game(target) {
  startGame(root, state, target, { onChange, onExit: home });
}

// Réglages: Task 7 branchera ici l'ouverture (porte parentale)
document.getElementById('gear').onclick = () => {};
home();
