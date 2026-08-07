import { AngleThresholds, FormRule, RepState, RepCounterSnapshot } from "@/types/exercise";
import { angleToProgress } from "@/lib/geometry/angles";

/**
 * Rep-counting Finite State Machine.
 *
 * States:
 *  ready      -> angle sits near minAngle (resting position)
 *  moving     -> angle progressing from minAngle toward maxAngle
 *  peak_hold  -> angle has reached maxAngle and must stay there for peakHoldMs
 *  returning  -> angle progressing back from maxAngle toward minAngle
 *
 * A rep is only counted when the full ready -> moving -> peak_hold -> returning
 * -> ready cycle completes. This avoids double-counting from noisy threshold
 * toggling near the boundaries (the failure mode of simple threshold FSMs).
 *
 * Angle direction (increasing or decreasing from min to max) is handled
 * generically via `angleToProgress`, which normalizes to a 0-1 range
 * regardless of whether minAngle > maxAngle or vice versa.
 */
export class RepCounterFSM {
  private state: RepState = "ready";
  private reps = 0;
  private maxAngleThisRep = 0;
  private peakEnteredAt: number | null = null;
  private formWarnings: Set<string> = new Set();

  // Progress-space bands, derived from the tolerance/(range) ratio so behavior
  // scales correctly whether the exercise's angle range is 20deg or 150deg.
  private readonly readyBand: number;
  private readonly peakBand: number;

  constructor(private thresholds: AngleThresholds) {
    const range = Math.abs(thresholds.maxAngle - thresholds.minAngle) || 1;
    const toleranceFraction = Math.min(0.4, thresholds.tolerance / range);
    this.readyBand = toleranceFraction;
    this.peakBand = 1 - toleranceFraction;
  }

  /**
   * Feed a new (already One-Euro-filtered) primary angle reading, plus any
   * form-check readings, and get back the current FSM snapshot.
   *
   * @param angle current primary joint angle (degrees)
   * @param formChecks array of { rule, angle } for secondary form validation
   * @param timestampMs current time (performance.now())
   */
  update(
    angle: number,
    formChecks: { rule: FormRule; angle: number }[],
    timestampMs: number
  ): RepCounterSnapshot {
    const progress = angleToProgress(
      angle,
      this.thresholds.minAngle,
      this.thresholds.maxAngle
    );

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
          this.state = "peak_hold";
          this.peakEnteredAt = timestampMs;
        } else if (progress < this.readyBand) {
          // Bounced back before reaching peak — reset to ready, no rep counted.
          this.state = "ready";
        }
        break;

      case "peak_hold":
        this.maxAngleThisRep = this.pickExtremum(this.maxAngleThisRep, angle);
        if (progress < this.peakBand) {
          // Left the peak zone before satisfying hold duration — treat as returning.
          this.state = "returning";
          this.peakEnteredAt = null;
        } else if (
          this.peakEnteredAt !== null &&
          timestampMs - this.peakEnteredAt >= this.thresholds.peakHoldMs
        ) {
          this.state = "returning";
        }
        break;

      case "returning":
        if (progress <= this.readyBand) {
          this.state = "ready";
          this.reps += 1;
          this.maxAngleThisRep = 0;
        } else if (progress >= this.peakBand) {
          // User pushed back up to peak instead of returning — go back to hold.
          this.state = "peak_hold";
          this.peakEnteredAt = timestampMs;
        }
        break;
    }

    return this.snapshot(angle);
  }

  private pickExtremum(current: number, next: number): number {
    // "Extremum" here means whichever value is closer to maxAngle, tracked
    // generically for both increasing and decreasing angle ranges.
    const currentProgress = angleToProgress(
      current,
      this.thresholds.minAngle,
      this.thresholds.maxAngle
    );
    const nextProgress = angleToProgress(
      next,
      this.thresholds.minAngle,
      this.thresholds.maxAngle
    );
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
    this.peakEnteredAt = null;
    this.formWarnings.clear();
  }
}
