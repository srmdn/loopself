/**
 * Web Audio SFX — unlock on first user gesture.
 * No assets, no packages.
 */

/** @type {AudioContext | null} */
let ctx = null;

/** @type {GainNode | null} */
let masterGain = null;
/** @type {DynamicsCompressorNode | null} */
let masterCompressor = null;

/**
 * Route all SFX through one full-level, peak-safe output stage.
 * Device/browser volume remains the final user-facing volume control.
 * @param {AudioContext} a
 * @returns {GainNode}
 */
function output(a) {
  if (masterGain) return masterGain;

  masterGain = a.createGain();
  masterGain.gain.value = 1;

  masterCompressor = a.createDynamicsCompressor();
  masterCompressor.threshold.value = -12;
  masterCompressor.knee.value = 6;
  masterCompressor.ratio.value = 6;
  masterCompressor.attack.value = 0.003;
  masterCompressor.release.value = 0.12;

  masterGain.connect(masterCompressor);
  masterCompressor.connect(a.destination);
  return masterGain;
}

export function ensureAudio() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

export function unlockAudio() {
  const a = ensureAudio();
  if (!a) return;
  if (a.state === "suspended") a.resume();
}

/**
 * @param {OscillatorType} type
 * @param {number} freq
 * @param {number} dur
 * @param {number} gain
 * @param {number} [freqEnd]
 */
function blip(type, freq, dur, gain, freqEnd) {
  const a = ensureAudio();
  if (!a) return;
  if (a.state === "suspended") a.resume();

  const t0 = a.currentTime;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(output(a));
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** Soft tick near end of loop (optional pressure). */
export function playTick() {
  blip("sine", 880, 0.04, 0.1);
}

/** Whoosh when a loop commits / soft-resets. */
export function playLoop() {
  blip("triangle", 220, 0.18, 0.2, 90);
  setTimeout(() => blip("sine", 160, 0.12, 0.12, 60), 40);
}

/** Win chime. */
export function playWin() {
  blip("sine", 523, 0.1, 0.2);
  setTimeout(() => blip("sine", 659, 0.1, 0.18), 90);
  setTimeout(() => blip("sine", 784, 0.18, 0.2), 180);
}

/** Soft UI confirm. */
export function playUi() {
  blip("sine", 440, 0.1, 0.12);
}

/** Hard reset wipe. */
export function playReset() {
  blip("sawtooth", 180, 0.1, 0.12, 60);
}
