import { loadState, saveState } from './store.js';
import { renderHome } from './ui-home.js';
import { startGame } from './ui-game.js';
import { startMaze } from './ui-maze.js';
import { startDiscover } from './ui-discover.js';
import { renderCollection } from './ui-collection.js';
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
for (const t of ['keydown', 'pointerdown']) document.addEventListener(t, audio.unlock, { once: true });

function home(focusBlock) {
  director.clear();
  gear.hidden = false;
  renderHome(root, state, {
    onPlay: (blockId) => game({ blockId }),
    onPickLevel: (blockId, level) => game({ blockId, level }),
    onOpenCollection: collection,
  }, focusBlock);
}

function collection() {
  director.clear();
  gear.hidden = true;
  renderCollection(root, state, { onBack: () => home(), onChange, onReplay: (id) => director.replay(id) });
}

function game(target) {
  gear.hidden = true;
  const onExit = () => home(target.blockId);
  const start = { maze: startMaze, discover: startDiscover, discover2: startDiscover }[target.blockId] ?? startGame;
  start(root, state, target, { onChange, getState: () => state, onExit });
}

gear.onclick = () => { director.clear(); openSettings(root, state, { onChange, onClose: () => home() }); };
home();
