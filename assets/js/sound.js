export function play(id, getState) {
  if (getState().settings.rewardSounds === false) return;
  const a = document.getElementById(id);
  if (!a) return;
  a.currentTime = 0;
  a.play().catch(() => {});
}
