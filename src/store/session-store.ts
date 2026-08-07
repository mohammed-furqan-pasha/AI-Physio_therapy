import { create } from "zustand";
import { ExerciseConfig, RepState } from "@/types/exercise";
import { DEFAULT_EXERCISE_ID, getExerciseById } from "@/config/exercises";

interface SessionState {
  exercise: ExerciseConfig;
  reps: number;
  fsmState: RepState;
  currentAngle: number;
  maxAngleThisSession: number;
  formWarnings: string[];
  /** Union of every distinct warning message seen this session, for the summary POST. */
  formWarningsEncountered: Set<string>;
  sessionStartedAt: number | null;
  isSessionActive: boolean;

  setExercise: (exerciseId: string) => void;
  updateFromFsm: (snapshot: {
    state: RepState;
    reps: number;
    currentAngle: number;
    maxAngleThisRep: number;
    formWarnings: string[];
  }) => void;
  startSession: () => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  exercise: getExerciseById(DEFAULT_EXERCISE_ID)!,
  reps: 0,
  fsmState: "ready",
  currentAngle: 0,
  maxAngleThisSession: 0,
  formWarnings: [],
  formWarningsEncountered: new Set(),
  sessionStartedAt: null,
  isSessionActive: false,

  setExercise: (exerciseId) => {
    const exercise = getExerciseById(exerciseId);
    if (!exercise) return;
    set({ exercise });
    get().resetSession();
  },

  updateFromFsm: (snapshot) => {
    const encountered = get().formWarningsEncountered;
    snapshot.formWarnings.forEach((w) => encountered.add(w));

    set({
      fsmState: snapshot.state,
      reps: snapshot.reps,
      currentAngle: snapshot.currentAngle,
      maxAngleThisSession: Math.max(
        get().maxAngleThisSession,
        snapshot.maxAngleThisRep
      ),
      formWarnings: snapshot.formWarnings,
      formWarningsEncountered: new Set(encountered),
    });
  },

  startSession: () => {
    set({
      sessionStartedAt: Date.now(),
      isSessionActive: true,
      reps: 0,
      maxAngleThisSession: 0,
      formWarnings: [],
      formWarningsEncountered: new Set(),
      fsmState: "ready",
    });
  },

  resetSession: () => {
    set({
      reps: 0,
      fsmState: "ready",
      currentAngle: 0,
      maxAngleThisSession: 0,
      formWarnings: [],
      formWarningsEncountered: new Set(),
      sessionStartedAt: null,
      isSessionActive: false,
    });
  },
}));
