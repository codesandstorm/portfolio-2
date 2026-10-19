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

  private noiseBuffer(seconds: number) {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  private env(g: GainNode, t: number, peak: number, attack: number, release: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  }

  /** Fire wakes: a warm low rumble and sparse crackle — energy, not a campfire. */
  fireWake() {
    if (!this.ok()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(7);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 170;
    const g = ctx.createGain();
    this.env(g, t, 0.16, 2.2, 4.5);
    src.connect(lp).connect(g).connect(this.fxBus!);
    src.start(t);
    for (let i = 0; i < 22; i++) {
      const at = t + 0.4 + Math.random() * 5.5;
      const c = ctx.createBufferSource();
      c.buffer = this.noiseBuffer(0.02);
      const hp = ctx.createBiquadFilter();
      hp.type = "bandpass";
      hp.frequency.value = 1800 + Math.random() * 2500;
      const cg = ctx.createGain();
      this.env(cg, at, 0.02 + Math.random() * 0.03, 0.002, 0.03);
      c.connect(hp).connect(cg).connect(this.fxBus!);
      c.start(at);
    }
  }

  /** Ice wakes: a glassy, slightly inharmonic resonance. */
  iceWake() {
    if (!this.ok()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    [1760, 2349, 3136, 4186.5].forEach((hz, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = hz * (1 + (Math.random() - 0.5) * 0.004);
      const g = ctx.createGain();
      this.env(g, t + i * 0.18, 0.035 / (i + 1), 0.9, 4.2);
      o.connect(g).connect(this.fxBus!);
      o.start(t + i * 0.18);
      o.stop(t + i * 0.18 + 5.5);
    });
  }

  /** Attraction: tension rising toward the collision. */
  riser(seconds: number) {
    if (!this.ok()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(seconds + 0.2);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 3;
    bp.frequency.setValueAtTime(220, t);
    bp.frequency.exponentialRampToValueAtTime(3200, t + seconds);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + seconds);
    g.gain.exponentialRampToValueAtTime(0.0001, t + seconds + 0.15);
    src.connect(bp).connect(g).connect(this.fxBus!);
    src.start(t);
  }

  /** The collision: a controlled low impact with a bright tail. */
  impact() {
    if (!this.ok()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(78, t);
    o.frequency.exponentialRampToValueAtTime(34, t + 1.4);
    const g = ctx.createGain();
    this.env(g, t, 0.32, 0.01, 1.8);
    o.connect(g).connect(this.fxBus!);
    o.start(t);
    o.stop(t + 2);
    const n = ctx.createBufferSource();
    n.buffer = this.noiseBuffer(1.6);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(6000, t);
    lp.frequency.exponentialRampToValueAtTime(200, t + 1.2);
    const ng = ctx.createGain();
    this.env(ng, t, 0.12, 0.005, 1.3);
    n.connect(lp).connect(ng).connect(this.fxBus!);
    n.start(t);
  }

  /** The name resolves: a warm open chord. */
  resolve() {
    if (!this.ok()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    [220, 329.6, 440, 554.4, 659.3].forEach((hz, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 ? "sine" : "triangle";
      o.frequency.value = hz;
      const g = ctx.createGain();
      this.env(g, t + i * 0.05, 0.04 / (1 + i * 0.4), 1.1, 4.5);
      o.connect(g).connect(this.fxBus!);
      o.start(t + i * 0.05);
      o.stop(t + 6);
    });
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
