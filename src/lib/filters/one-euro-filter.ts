/**
 * One Euro Filter (Casiez, Roussel, Vogel 2012).
 * Adaptive low-pass filter: aggressive smoothing at low speed (removes jitter),
 * light smoothing at high speed (preserves responsiveness). Ideal for
 * de-jittering raw MediaPipe landmark coordinates before angle calculation.
 */

class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  filter(value: number, alpha: number): number {
    if (this.y === null) {
      this.s = value;
    } else {
      this.s = alpha * value + (1 - alpha) * (this.s as number);
    }
    this.y = value;
    return this.s as number;
  }

  get lastRaw(): number | null {
    return this.y;
  }

  reset() {
    this.y = null;
    this.s = null;
  }
}

function smoothingAlpha(cutoff: number, dt: number): number {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
}

export interface OneEuroOptions {
  /** Minimum cutoff frequency. Lower = smoother but more lag. */
  minCutoff?: number;
  /** Speed coefficient. Higher = more responsive during fast movement. */
  beta?: number;
  /** Cutoff frequency for the derivative filter. */
  dCutoff?: number;
}

export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xFilter = new LowPassFilter();
  private dxFilter = new LowPassFilter();
  private lastTime: number | null = null;

  constructor(options: OneEuroOptions = {}) {
    this.minCutoff = options.minCutoff ?? 1.0;
    this.beta = options.beta ?? 0.02;
    this.dCutoff = options.dCutoff ?? 1.0;
  }

  /** @param value raw signal value @param timestampMs current time in ms (e.g. performance.now()) */
  filter(value: number, timestampMs: number): number {
    if (this.lastTime === null) {
      this.lastTime = timestampMs;
      this.xFilter.filter(value, 1);
      return value;
    }

    let dt = (timestampMs - this.lastTime) / 1000;
    this.lastTime = timestampMs;
    if (dt <= 0) dt = 1 / 60; // guard against duplicate/out-of-order timestamps

    const prevRaw = this.xFilter.lastRaw ?? value;
    const dx = (value - prevRaw) / dt;
    const edx = this.dxFilter.filter(dx, smoothingAlpha(this.dCutoff, dt));

    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    return this.xFilter.filter(value, smoothingAlpha(cutoff, dt));
  }

  reset() {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = null;
  }
}

/** Convenience wrapper: filters x, y, z of a 3D landmark together. */
export class LandmarkOneEuroFilter {
  private fx: OneEuroFilter;
  private fy: OneEuroFilter;
  private fz: OneEuroFilter;

  constructor(options: OneEuroOptions = {}) {
    this.fx = new OneEuroFilter(options);
    this.fy = new OneEuroFilter(options);
    this.fz = new OneEuroFilter(options);
  }

  filter(x: number, y: number, z: number, timestampMs: number) {
    return {
      x: this.fx.filter(x, timestampMs),
      y: this.fy.filter(y, timestampMs),
      z: this.fz.filter(z, timestampMs),
    };
  }

  reset() {
    this.fx.reset();
    this.fy.reset();
    this.fz.reset();
  }
}
