// Compare chaque touche aux saisies acceptées; une erreur ne fait jamais reculer.
// opts.caseSensitive: « A » n'est pas « a » (Découvre le JavaScript); par défaut la casse est ignorée.
export function createTyper(accepts, opts = {}) {
  const fold = opts.caseSensitive ? (x) => x : (x) => x.toLowerCase();
  const words = accepts.map(fold);
  let typed = 0;
  let done = false;
  return {
    get typed() {
      return typed;
    },
    press(key) {
      if (done || key.length !== 1) return 'ignored';
      const k = fold(key);
      const next = words.filter((w) => w[typed] === k);
      if (!next.length) return 'wrong';
      words.splice(0, words.length, ...next);
      typed++;
      if (words.some((w) => w.length === typed)) {
        done = true;
        return 'done';
      }
      return 'right';
    },
  };
}
