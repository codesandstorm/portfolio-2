/**
 * Synthesised sound for the constellation. Everything is generated with the
 * Web Audio API — no files, no voices. Created lazily on a user gesture.
 */

const PENTATONIC = [0, 3, 5, 7, 10, 12, 15];
const BASE_HZ = 220;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientBus: GainNode | null = null;
  private fxBus: GainNode | null = null;
  private delay: DelayNode | null = null;
  private ambientNodes: AudioScheduledSourceNode[] = [];
  private lastShimmer = 0;
  private enabled = false;

  private ensure() {
    if (this.ctx) return this.ctx;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    this.ambientBus = ctx.createGain();
    this.ambientBus.gain.value = 0.5;
    this.ambientBus.connect(this.master);

    this.fxBus = ctx.createGain();
    this.fxBus.gain.value = 0.5;
    // A soft echo gives the shimmers a sense of space.
    this.delay = ctx.createDelay(1);
    this.delay.delayTime.value = 0.32;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.28;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    this.fxBus.connect(this.master);
    this.fxBus.connect(this.delay);
    this.delay.connect(feedback).connect(this.delay);
    this.delay.connect(wet).connect(this.master);
    return ctx;
  }

  private startAmbient() {
    const ctx = this.ctx!;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.7;
    filter.connect(this.ambientBus!);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 160;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();

    const drone = (hz: number, gain: number, type: OscillatorType) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = hz;
      const g = ctx.createGain();
      g.gain.value = gain;
      o.connect(g).connect(filter);
      o.start();
      return o;
    };

    // Air: looped, band-passed noise.
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 900;
    band.Q.value = 0.6;
    const ng = ctx.createGain();
    ng.gain.value = 0.025;
    noise.connect(band).connect(ng).connect(this.ambientBus!);
    noise.start();

    this.ambientNodes = [lfo, drone(55, 0.18, "sine"), drone(82.6, 0.1, "sine"), drone(110.4, 0.05, "triangle"), noise];
  }

  async setEnabled(on: boolean) {
    this.enabled = on;
    if (on) {
      const ctx = this.ensure();
      if (ctx.state === "suspended") await ctx.resume();
      if (!this.ambientNodes.length) this.startAmbient();
      this.master!.gain.cancelScheduledValues(ctx.currentTime);
      this.master!.gain.setTargetAtTime(0.55, ctx.currentTime, 0.8);
    } else if (this.ctx && this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
    }
  }

  setVolumes(ambient: number, effects: number) {
    if (!this.ctx) return;
    this.ambientBus?.gain.setTargetAtTime(ambient, this.ctx.currentTime, 0.2);
    this.fxBus?.gain.setTargetAtTime(effects, this.ctx.currentTime, 0.2);
  }

  private ok() {
    return this.enabled && this.ctx && this.ctx.state === "running";
  }

  /** A soft bell — a connection forming. */
  shimmer(step?: number) {
    if (!this.ok()) return;
    const ctx = this.ctx!;
    if (ctx.currentTime - this.lastShimmer < 0.06) return;
    this.lastShimmer = ctx.currentTime;
    const semis = PENTATONIC[(step ?? Math.floor(Math.random() * PENTATONIC.length)) % PENTATONIC.length] + 12;
    const hz = BASE_HZ * Math.pow(2, semis / 12);
    const t = ctx.currentTime;
    for (const [mult, amp] of [[1, 0.12], [2.01, 0.04]] as const) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = hz * mult;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      o.connect(g).connect(this.fxBus!);
      o.start(t);
      o.stop(t + 1.7);
    }
  }

  /** A quiet tactile tick — hover / select. */
  tick() {
    if (!this.ok()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(1600, t);
    o.frequency.exponentialRampToValueAtTime(700, t + 0.05);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(g).connect(this.fxBus!);
    o.start(t);
    o.stop(t + 0.08);
  }

  /** A low swell between chapters, or a convergence event when `bright`. */
  swell(bright = false) {
    if (!this.ok()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = bright ? 110 : 55;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(80, t);
    f.frequency.exponentialRampToValueAtTime(bright ? 2400 : 700, t + 1.4);
    f.frequency.exponentialRampToValueAtTime(120, t + 3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(bright ? 0.09 : 0.06, t + 1.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    o.connect(f).connect(g).connect(this.fxBus!);
    o.start(t);
    o.stop(t + 3.3);
    if (bright) [0, 2, 4].forEach((s, i) => setTimeout(() => this.shimmer(s), 900 + i * 120));
  }
}

export const audio = new AudioEngine();
