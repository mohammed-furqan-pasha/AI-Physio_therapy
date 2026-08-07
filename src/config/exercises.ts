import { ExerciseConfig } from "@/types/exercise";

/**
 * MediaPipe Pose Landmarker (33-point BlazePose) index reference, for clarity:
 * 11 = left shoulder    12 = right shoulder
 * 13 = left elbow       14 = right elbow
 * 15 = left wrist       16 = right wrist
 * 23 = left hip         24 = right hip
 * 25 = left knee        26 = right knee
 * 27 = left ankle       28 = right ankle
 *
 * NOTE: These are standard/dummy landmark wiring for MVP purposes. The spec
 * calls out that exact indices/angles will be manually tuned later once
 * real capture data is available — do not treat these numbers as clinically
 * validated.
 */

export const EXERCISES: ExerciseConfig[] = [
  {
    id: "bicep-curl",
    name: "Bicep Curl",
    description:
      "Standing dumbbell-free bicep curl. Tracks elbow flexion from a straight arm to full contraction.",
    bodyPart: "Elbow / Upper Arm",
    laterality: "left",
    primaryJoint: { a: 11, b: 13, c: 15 }, // shoulder -> elbow -> wrist
    angleThresholds: {
      minAngle: 160, // arm extended (ready position)
      maxAngle: 45, // full curl (peak contraction)
      tolerance: 8,
      peakHoldMs: 300,
    },
    formRules: [
      {
        message: "Keep your elbow tucked in — avoid swinging your shoulder",
        joint: { a: 23, b: 11, c: 13 }, // hip -> shoulder -> elbow
        min: 0,
        max: 40,
      },
    ],
  },
  {
    id: "bodyweight-squat",
    name: "Bodyweight Squat",
    description:
      "Standing squat. Tracks knee flexion from standing tall to depth position.",
    bodyPart: "Knee / Hip",
    laterality: "left",
    primaryJoint: { a: 23, b: 25, c: 27 }, // hip -> knee -> ankle
    angleThresholds: {
      minAngle: 170, // standing (ready position)
      maxAngle: 90, // squat depth (peak contraction)
      tolerance: 10,
      peakHoldMs: 400,
    },
    formRules: [
      {
        message: "Straighten your back — avoid leaning too far forward",
        joint: { a: 11, b: 23, c: 25 }, // shoulder -> hip -> knee
        min: 60,
        max: 180,
      },
    ],
  },
  {
    id: "lateral-raise",
    name: "Lateral Raise",
    description:
      "Standing arm abduction to shoulder height, tracked at the shoulder joint.",
    bodyPart: "Shoulder",
    laterality: "left",
    primaryJoint: { a: 13, b: 11, c: 23 }, // elbow -> shoulder -> hip
    angleThresholds: {
      minAngle: 15, // arm at side (ready position)
      maxAngle: 85, // arm raised to shoulder height (peak contraction)
      tolerance: 8,
      peakHoldMs: 300,
    },
    formRules: [
      {
        message: "Avoid shrugging — keep your shoulder relaxed",
        joint: { a: 13, b: 11, c: 15 }, // elbow -> shoulder -> wrist (elbow should stay near-straight)
        min: 140,
        max: 180,
      },
    ],
  },
];

export function getExerciseById(id: string): ExerciseConfig | undefined {
  return EXERCISES.find((e) => e.id === id);
}

export const DEFAULT_EXERCISE_ID = EXERCISES[0].id;
