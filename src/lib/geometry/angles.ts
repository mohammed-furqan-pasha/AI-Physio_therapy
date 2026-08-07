import { Landmark } from "@/types/exercise";

/**
 * Calculates the angle (in degrees) at joint `b`, formed by points a-b-c,
 * using full 3D coordinates (x, y, z) from MediaPipe world/normalized landmarks.
 *
 * Example: for an elbow angle, a = shoulder, b = elbow, c = wrist.
 */
export function calculateJointAngle(
  a: Landmark,
  b: Landmark,
  c: Landmark
): number {
  const baX = a.x - b.x;
  const baY = a.y - b.y;
  const baZ = a.z - b.z;

  const bcX = c.x - b.x;
  const bcY = c.y - b.y;
  const bcZ = c.z - b.z;

  const dot = baX * bcX + baY * bcY + baZ * bcZ;
  const magBa = Math.sqrt(baX ** 2 + baY ** 2 + baZ ** 2);
  const magBc = Math.sqrt(bcX ** 2 + bcY ** 2 + bcZ ** 2);

  if (magBa === 0 || magBc === 0) return 0;

  // Clamp to avoid NaN from floating point drift pushing slightly outside [-1, 1].
  const cosAngle = Math.min(1, Math.max(-1, dot / (magBa * magBc)));
  const radians = Math.acos(cosAngle);

  return (radians * 180) / Math.PI;
}

/** Returns true if `value` is within [target - tolerance, target + tolerance]. */
export function withinTolerance(
  value: number,
  target: number,
  tolerance: number
): boolean {
  return Math.abs(value - target) <= tolerance;
}

/** Linearly maps an angle from [fromMin, fromMax] to a 0-1 progress value. Clamped. */
export function angleToProgress(
  angle: number,
  fromMin: number,
  fromMax: number
): number {
  const t = (angle - fromMin) / (fromMax - fromMin);
  return Math.min(1, Math.max(0, t));
}
