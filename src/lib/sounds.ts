// Web Audio API sound effects — no external dependencies needed

let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  // Resume if suspended (browsers block audio until user gesture)
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
};

/** Soft chime — two gentle bell tones for goodnight */
export const playChime = () => {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25]; // C5, E5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.3);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.3 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.3 + 1.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.3);
      osc.stop(now + i * 0.3 + 1.3);
    });
  } catch (e) {
    console.warn("Audio playback failed:", e);
  }
};

/** Heartbeat thump — low-frequency double pulse */
export const playHeartbeat = () => {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    const thump = (time: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(80, time);
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.3, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.25);
    };

    thump(now);
    thump(now + 0.25);
  } catch (e) {
    console.warn("Audio playback failed:", e);
  }
};

/** Twinkle — high sparkle sound for shooting star wishes */
export const playTwinkle = () => {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    const freqs = [1047, 1319, 1568, 2093]; // C6, E6, G6, C7
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.08, now + i * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.7);
    });
  } catch (e) {
    console.warn("Audio playback failed:", e);
  }
};

/** Pre-warm the AudioContext on first user interaction */
export const initAudio = () => {
  getCtx();
};
