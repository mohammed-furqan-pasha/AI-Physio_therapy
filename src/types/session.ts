/**
 * Session summary types. Per spec, NO database writes happen during the
 * live session — this shape is only sent once, when the user clicks
 * "Finish Session".
 */

export interface SessionSummaryPayload {
  exerciseId: string;
  exerciseName: string;
  totalReps: number;
  /** Session duration in seconds. */
  durationSeconds: number;
  maxAngle: number;
  /** Distinct form warnings encountered during the session. */
  formWarningsEncountered: string[];
  completedAt: string; // ISO timestamp
}

export interface SessionRecord extends SessionSummaryPayload {
  id: string;
  userId: string;
  createdAt: string;
}
