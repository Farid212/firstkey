// Compare chaque touche aux saisies acceptées; une erreur ne fait jamais reculer.
export function createTyper(accepts) {
  const words = accepts.map((a) => a.toLowerCase());
  let typed = 0;
  let done = false;
  return {
    get typed() {
      return typed;
    },
    press(key) {
      if (done || key.length !== 1) return 'ignored';
      const k = key.toLowerCase();
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
