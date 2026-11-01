export function matchChoice(buffer, choices) {
  const texts = choices.map(String);
  const starts = texts.filter((c) => c.startsWith(buffer)).length;
  if (!starts) return { none: true };
  const pick = texts.indexOf(buffer);
  return pick >= 0 && starts === 1 ? { pick } : { wait: true };
}
