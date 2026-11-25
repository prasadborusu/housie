/**
 * Web Audio API Sound Effects & Speech Synthesis for HOUSEY
 * Zero external mp3 dependencies - works offline and reliably!
 */

class SoundManager {
  constructor() {
    this.isMuted = localStorage.getItem('housey_muted') === 'true';
    this.isVoiceEnabled = localStorage.getItem('housey_voice') !== 'false';
    this.audioCtx = null;
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('housey_muted', this.isMuted.toString());
    return this.isMuted;
  }

  setMuted(val) {
    this.isMuted = Boolean(val);
    localStorage.setItem('housey_muted', this.isMuted.toString());
  }

  toggleVoice() {
    this.isVoiceEnabled = !this.isVoiceEnabled;
    localStorage.setItem('housey_voice', this.isVoiceEnabled.toString());
    return this.isVoiceEnabled;
  }

  // Play subtle UI button click
  playClick() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // AudioContext policy suppression fallback
    }
  }

  // Play chime when a new number is drawn
  playNumberCall(number) {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (ctx) {
        // Bright pleasant ding
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15); // C6

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      }

      // Voice callout (e.g. "Number 42")
      if (this.isVoiceEnabled && 'speechSynthesis' in window && number) {
        window.speechSynthesis.cancel(); // Cancel any lingering utterance
        const utterance = new SpeechSynthesisUtterance(`Number ${number}`);
        utterance.rate = 1.05;
        utterance.pitch = 1.1;
        utterance.volume = 0.85;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // Fail safely
    }
  }

  // Play celebration fanfare for valid claim/winner
  playFanfare() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [
        { freq: 523.25, time: 0.00, dur: 0.12 }, // C5
        { freq: 659.25, time: 0.13, dur: 0.12 }, // E5
        { freq: 783.99, time: 0.26, dur: 0.12 }, // G5
        { freq: 1046.50, time: 0.39, dur: 0.35 } // C6
      ];

      notes.forEach(({ freq, time, dur }) => {
        const start = ctx.currentTime + time;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      });
    } catch {
      // Fallback
    }
  }

  // Play error buzzer for rejected claims
  playError() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.setValueAtTime(110, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Fallback
    }
  }
}

export const sounds = new SoundManager();

