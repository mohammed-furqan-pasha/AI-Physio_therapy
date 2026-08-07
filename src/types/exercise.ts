/**
 * Core domain types for exercises, joints, and the rep-counting FSM.
 * These types are shared between the exercise config, the FSM, the
 * geometry/angle utilities, and the live session UI.
 */

/** MediaPipe Pose Landmarker landmark indices (33-point model). */
export type LandmarkIndex = number;

export interface JointTriplet {
  /** Landmark index for the proximal joint (e.g. shoulder). */
  a: LandmarkIndex;
  /** Landmark index for the vertex / joint being measured (e.g. elbow). */
  b: LandmarkIndex;
  /** Landmark index for the distal joint (e.g. wrist). */
  c: LandmarkIndex;
}

/** Which side of the body to track. Bilateral exercises track both and average. */
export type Laterality = "left" | "right" | "bilateral";

export interface AngleThresholds {
  /** Angle (degrees) considered the "resting/ready" position. */
  minAngle: number;
  /** Angle (degrees) considered the "peak contraction" position. */
  maxAngle: number;
  /** Degrees of slack allowed around min/max before FSM reacts (noise tolerance). */
  tolerance: number;
  /** Milliseconds the angle must stay near maxAngle to count as a valid peak hold. */
  peakHoldMs: number;
}

export interface FormRule {
  /** Human-readable warning shown to the user when this rule is violated. */
  message: string;
  /** Landmark triplet used to evaluate the secondary form-check angle. */
  joint: JointTriplet;
  /** Valid range (degrees) for the form-check joint while exercising. */
  min: number;
  max: number;
}

export interface ExerciseConfig {
  id: string;
  name: string;
  description: string;
  bodyPart: string;
  laterality: Laterality;
  /** Primary joint triplet used for rep-counting angle calculation. */
  primaryJoint: JointTriplet;
  angleThresholds: AngleThresholds;
  /** Optional secondary checks that produce on-screen form warnings. */
  formRules: FormRule[];
  tutorialMediaUrl?: string;
  tutorialMediaType?: "image" | "gif" | "video";
}

/** FSM states for repetition counting, per spec: Ready -> Moving -> Peak Hold -> Returning. */
export type RepState = "ready" | "moving" | "peak_hold" | "returning";

export interface RepCounterSnapshot {
  state: RepState;
  reps: number;
  currentAngle: number;
  maxAngleThisRep: number;
  formWarnings: string[];
}

/** A single 2D/3D landmark as returned by MediaPipe Tasks Vision. */
export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}
