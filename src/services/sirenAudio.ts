// Web Audio API Emergency Siren and Alarm Generator
// Generates a high-intensity pulsating distress siren without requiring external sound files.

let audioCtx: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let lfo: OscillatorNode | null = null;
let lfoGain: GainNode | null = null;
let isPlaying = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Starts the continuous emergency safety siren
 */
export function startEmergencySiren(): boolean {
  try {
    const ctx = getAudioContext();
    if (isPlaying) return true;

    // Master volume gain
    gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.1);
    gainNode.connect(ctx.destination);

    // Primary carrier oscillator (Alarm tone)
    oscillator = ctx.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);

    // Low Frequency Oscillator (LFO) to create the wailing siren oscillation (700Hz to 1200Hz)
    lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(1.8, ctx.currentTime); // 1.8 wails per second

    lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(350, ctx.currentTime); // modulate pitch by +/- 350 Hz

    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);

    oscillator.connect(gainNode);

    lfo.start();
    oscillator.start();
    isPlaying = true;
    return true;
  } catch (err) {
    console.warn('Could not start emergency audio siren:', err);
    return false;
  }
}

/**
 * Stops the continuous emergency siren smoothly
 */
export function stopEmergencySiren(): void {
  try {
    if (!isPlaying || !gainNode || !audioCtx) return;

    // Fade out to prevent popping
    gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);

    setTimeout(() => {
      try {
        if (oscillator) {
          oscillator.stop();
          oscillator.disconnect();
          oscillator = null;
        }
        if (lfo) {
          lfo.stop();
          lfo.disconnect();
          lfo = null;
        }
        if (lfoGain) {
          lfoGain.disconnect();
          lfoGain = null;
        }
        if (gainNode) {
          gainNode.disconnect();
          gainNode = null;
        }
      } catch (e) {
        // ignore cleanup error
      }
      isPlaying = false;
    }, 160);
  } catch (err) {
    console.warn('Error stopping siren:', err);
    isPlaying = false;
  }
}

/**
 * Plays a quick 1.5s sample test siren so family members can test their speaker volume
 */
export function playSampleSirenChirp(onEnd?: () => void): void {
  startEmergencySiren();
  setTimeout(() => {
    stopEmergencySiren();
    if (onEnd) onEnd();
  }, 1600);
}

export function isSirenActive(): boolean {
  return isPlaying;
}
