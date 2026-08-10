import { AngleThresholds, FormRule, RepState, RepCounterSnapshot } from "@/types/exercise";
import { angleToProgress } from "@/lib/geometry/angles";

/**
 * Rep-counting Finite State Machine — tuned for a middle ground between
 * "too strict" (missing legitimate partial reps) and "too loose" (firing
 * multiple reps from a single noisy frame).
 *
 * Key behaviors:
 *  - PEAK_TRIGGER_FRACTION is intentionally lenient (~55% of the exercise's
 *    full angle range) so a half-effort rep still counts — full range of
 *    motion is not required.
 *  - Both the "reached peak" and "returned to ready" transitions require a
 *    short DEBOUNCE window of consecutive frames in that zone before being
 *    confirmed — a single jittery frame crossing the line does not, by
 *    itself, trigger a state change.
 *  - REFRACTORY_MS enforces a minimum gap between two counted reps, since
 *    no real rep can complete faster than that — this is the main defense
 *    against "fires continuously" from landmark noise.
 */

const PEAK_TRIGGER_FRACTION = 0.55; // reach ~55% of the way = counts as a peak
const READY_TRIGGER_FRACTION = 0.25; // back within ~25% of start = counts as returned
const PEAK_DEBOUNCE_MS = 100;
const READY_DEBOUNCE_MS = 120;
const REFRACTORY_MS = 400;

export class RepCounterFSM {
  private state: RepState = "ready";
  private reps = 0;
  private maxAngleThisRep = 0;
  private formWarnings: Set<string> = new Set();

  private peakCandidateSince: number | null = null;
  private readyCandidateSince: number | null = null;
  private lastRepCountedAt: number | null = null;

  private readonly readyBand: number;
  private readonly peakBand: number;

  constructor(private thresholds: AngleThresholds) {
    // thresholds.tolerance is intentionally NOT used to size these bands
    // anymore — for small angle-range exercises (e.g. neck side bend) a
    // tolerance-derived band was too tight and caused both missed reps and
    // noise-driven false triggers. Fixed fractions + debounce are more
    // stable across exercises with very different ranges.
    this.readyBand = READY_TRIGGER_FRACTION;
    this.peakBand = PEAK_TRIGGER_FRACTION;
  }

  update(
    angle: number,
    formChecks: { rule: FormRule; angle: number }[],
    timestampMs: number
  ): RepCounterSnapshot {
    const progress = angleToProgress(angle, this.thresholds.minAngle, this.thresholds.maxAngle);

    this.evaluateFormRules(formChecks);

    switch (this.state) {
      case "ready":
        if (progress > this.readyBand) {
          this.state = "moving";
          this.maxAngleThisRep = angle;
        }
        break;

      case "moving":
        this.maxAngleThisRep = this.pickExtremum(this.maxAngleThisRep, angle);

        if (progress >= this.peakBand) {
          if (this.peakCandidateSince === null) {
            this.peakCandidateSince = timestampMs;
          } else if (timestampMs - this.peakCandidateSince >= PEAK_DEBOUNCE_MS) {
            this.state = "peak_hold";
            this.peakCandidateSince = null;
          }
        } else {
          this.peakCandidateSince = null; // dipped back down — reset debounce
          if (progress < this.readyBand) {
            this.state = "ready"; // bounced back without reaching peak, no rep counted
          }
        }
        break;

      case "peak_hold":
        this.maxAngleThisRep = this.pickExtremum(this.maxAngleThisRep, angle);
        if (progress < this.peakBand) {
          this.state = "returning";
        }
        break;

      case "returning":
        if (progress <= this.readyBand) {
          if (this.readyCandidateSince === null) {
            this.readyCandidateSince = timestampMs;
          } else if (timestampMs - this.readyCandidateSince >= READY_DEBOUNCE_MS) {
            const canCount =
              this.lastRepCountedAt === null ||
              timestampMs - this.lastRepCountedAt >= REFRACTORY_MS;

            if (canCount) {
              this.reps += 1;
              this.lastRepCountedAt = timestampMs;
            }

            this.state = "ready";
            this.maxAngleThisRep = 0;
            this.readyCandidateSince = null;
          }
        } else {
          this.readyCandidateSince = null; // bounced back up — reset debounce
          if (progress >= this.peakBand) {
            this.state = "peak_hold"; // user pushed back up instead of returning
          }
        }
        break;
    }

    return this.snapshot(angle);
  }

  private pickExtremum(current: number, next: number): number {
    const currentProgress = angleToProgress(current, this.thresholds.minAngle, this.thresholds.maxAngle);
    const nextProgress = angleToProgress(next, this.thresholds.minAngle, this.thresholds.maxAngle);
    return nextProgress > currentProgress ? next : current;
  }

  private evaluateFormRules(formChecks: { rule: FormRule; angle: number }[]) {
    this.formWarnings.clear();
    for (const { rule, angle } of formChecks) {
      if (angle < rule.min || angle > rule.max) {
        this.formWarnings.add(rule.message);
      }
    }
  }

  private snapshot(currentAngle: number): RepCounterSnapshot {
    return {
      state: this.state,
      reps: this.reps,
      currentAngle,
      maxAngleThisRep: this.maxAngleThisRep,
      formWarnings: Array.from(this.formWarnings),
    };
  }

  getReps(): number {
    return this.reps;
  }

  reset() {
    this.state = "ready";
    this.reps = 0;
    this.maxAngleThisRep = 0;
    this.peakCandidateSince = null;
    this.readyCandidateSince = null;
    this.lastRepCountedAt = null;
    this.formWarnings.clear();
  }
}
