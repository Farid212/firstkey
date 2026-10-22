const WAVES = ['sine', 'square', 'sawtooth', 'triangle', 'noise'];
const FILTERS = ['lowpass', 'highpass', 'bandpass'];

export function validateSound(def) {
  const errs = [];
  const vs = def && def.voices;
  if (!Array.isArray(vs) || vs.length < 1 || vs.length > 6) return ['voices: 1 to 6 required'];
  let sum = 0;
  vs.forEach((x, i) => {
    const p = `voice ${i}: `;
    if (!WAVES.includes(x.wave)) errs.push(p + 'unknown wave');
    for (const k of ['f0', 'f1']) if (!(x[k] >= 20 && x[k] <= 4000)) errs.push(p + k + ' out of 20..4000');
    if (!(x.t >= 0)) errs.push(p + 't < 0');
    if (!(x.d >= 0.02 && x.d <= 2.5)) errs.push(p + 'd out of 0.02..2.5');
    if (!(x.t + x.d <= 3)) errs.push(p + 't + d > 3');
    if (!(x.g >= 0.001 && x.g <= 0.3)) errs.push(p + 'g out of 0.001..0.3');
    if (x.filter && !FILTERS.includes(x.filter.type)) errs.push(p + 'unknown filter');
    sum += x.g;
  });
  if (!(sum <= 0.6 + 1e-9)) errs.push('sum of g > 0.6');
  return errs;
}

const s = (wave, f0, f1, t, d, g, extra) => ({ wave, f0, f1, t, d, g, ...extra });

export const SFX = {
  pop: { voices: [s('sine', 500, 900, 0, 0.12, 0.25), s('triangle', 1000, 1400, 0.02, 0.1, 0.1)] },
  whoosh: { voices: [s('noise', 400, 2000, 0, 0.5, 0.18, { filter: { type: 'bandpass', freq: 900 } })] },
  pow: { voices: [s('square', 300, 80, 0, 0.3, 0.15), s('noise', 1500, 300, 0, 0.25, 0.2, { filter: { type: 'lowpass', freq: 1200 } })] },
  boing: { voices: [s('sine', 200, 600, 0, 0.45, 0.25, { vib: { rate: 14, depth: 25 } })] },
  fanfare: { voices: [
    s('triangle', 523, 523, 0, 0.18, 0.12), s('triangle', 659, 659, 0.18, 0.18, 0.12),
    s('triangle', 784, 784, 0.36, 0.18, 0.12), s('triangle', 1047, 1047, 0.54, 0.7, 0.12),
    s('sine', 523, 523, 0.54, 0.7, 0.08),
  ] },
  sparkle: { voices: [
    s('sine', 1500, 1800, 0, 0.15, 0.12), s('sine', 2000, 2400, 0.1, 0.15, 0.12),
    s('sine', 2600, 3000, 0.2, 0.15, 0.12), s('sine', 3200, 3600, 0.3, 0.3, 0.1),
  ] },
  giftOpen: { voices: [
    s('sine', 300, 700, 0, 0.35, 0.2), s('noise', 800, 3000, 0, 0.3, 0.1, { filter: { type: 'highpass', freq: 2000 } }),
    s('triangle', 880, 1320, 0.35, 0.5, 0.2),
  ] },
  step: { voices: [s('sine', 220, 160, 0, 0.08, 0.2)] },
};

export function createAudio() {
  let ctx = null, enabled = true, noiseBuf = null;

  function unlock() {
    try {
      if (!ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return;
        ctx = new AC();
      }
      if (ctx.state === 'suspended') ctx.resume?.();
    } catch { ctx = null; }
  }

  function noise() {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }

  function play(def) {
    if (!enabled || !ctx) return;
    try {
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(ctx.destination);
      for (const v of def.voices) {
        const t0 = now + v.t, t1 = t0 + v.d, att = Math.min(0.01, v.d / 4);
        let src;
        if (v.wave === 'noise') {
          src = ctx.createBufferSource();
          src.buffer = noise();
        } else {
          src = ctx.createOscillator();
          src.type = v.wave;
        }
        const filt = ctx.createBiquadFilter();
        const ft = v.filter || (v.wave === 'noise' ? { type: 'bandpass', freq: v.f0 } : null);
        let node = src;
        if (ft) {
          filt.type = ft.type;
          filt.frequency.setValueAtTime(ft.freq, t0);
          if (v.wave === 'noise') filt.frequency.exponentialRampToValueAtTime(Math.max(20, v.f1 * (ft.freq / v.f0)), t1);
          src.connect(filt);
          node = filt;
        }
        if (v.wave !== 'noise') {
          src.frequency.setValueAtTime(v.f0, t0);
          if (v.f1 !== v.f0) src.frequency.exponentialRampToValueAtTime(v.f1, t1);
          if (v.vib) {
            const lfo = ctx.createOscillator(), lg = ctx.createGain();
            lfo.frequency.value = v.vib.rate;
            lg.gain.value = v.vib.depth;
            lfo.connect(lg).connect(src.frequency);
            lfo.start(t0);
            lfo.stop(t1 + 0.02);
          }
        }
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, t0);
        env.gain.linearRampToValueAtTime(v.g, t0 + att);
        env.gain.setValueAtTime(v.g, Math.max(t0 + att, t1 - 0.03));
        env.gain.linearRampToValueAtTime(0.0001, t1);
        node.connect(env).connect(master);
        src.start(t0);
        src.stop(t1 + 0.02);
      }
    } catch { }
  }

  return { unlock, play, setEnabled(on) { enabled = !!on; } };
}
