import { create } from "zustand";
import { ExerciseConfig, RepState } from "@/types/exercise";
import { DEFAULT_EXERCISE_ID, FALLBACK_EXERCISES } from "@/config/exercises";
import { fetchExercises } from "@/lib/supabase/exercises";

interface SessionState {
  /** The full catalog, fetched from Supabase (falls back to FALLBACK_EXERCISES). */
  exercises: ExerciseConfig[];
  exercisesLoading: boolean;
  exercise: ExerciseConfig;

  reps: number;
  fsmState: RepState;
  currentAngle: number;
  maxAngleThisSession: number;
  formWarnings: string[];
  /** Union of every distinct warning message seen this session, for the summary POST. */
  formWarningsEncountered: Set<string>;
  repTimestamps: number[];
  sessionStartedAt: number | null;
  isSessionActive: boolean;

  loadExercises: () => Promise<void>;
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

const initialExercise =
  FALLBACK_EXERCISES.find((e) => e.id === DEFAULT_EXERCISE_ID) ?? FALLBACK_EXERCISES[0];

export const useSessionStore = create<SessionState>((set, get) => ({
  exercises: FALLBACK_EXERCISES,
  exercisesLoading: false,
  exercise: initialExercise,

  reps: 0,
  fsmState: "ready",
  currentAngle: 0,
  maxAngleThisSession: 0,
  formWarnings: [],
  formWarningsEncountered: new Set(),
  repTimestamps: [],
  sessionStartedAt: null,
  isSessionActive: false,

  loadExercises: async () => {
    if (get().exercisesLoading) return;
    set({ exercisesLoading: true });

    const exercises = await fetchExercises();
    const currentId = get().exercise.id;
    const stillExists = exercises.find((e) => e.id === currentId);

    set({
      exercises,
      exercisesLoading: false,
      // Keep the current selection if it still exists in the fetched catalog,
      // otherwise fall back to the first exercise in the fetched list.
      exercise: stillExists ?? exercises[0] ?? initialExercise,
    });
  },

  setExercise: (exerciseId) => {
    const exercise = get().exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;
    set({ exercise });
    get().resetSession();
  },

  updateFromFsm: (snapshot) => {
    const encountered = get().formWarningsEncountered;
    let encounteredChanged = false;
    snapshot.formWarnings.forEach((w) => {
      if (!encountered.has(w)) {
        encountered.add(w);
        encounteredChanged = true;
      }
    });

    const prevReps = get().reps;
    const currentTimestamps = get().repTimestamps;
    let nextTimestamps = currentTimestamps;
    
    if (snapshot.reps > prevReps) {
      nextTimestamps = [...currentTimestamps];
      for (let i = 0; i < snapshot.reps - prevReps; i++) {
        nextTimestamps.push(Date.now());
      }
    }

    set({
      fsmState: snapshot.state,
      reps: snapshot.reps,
      currentAngle: snapshot.currentAngle,
      maxAngleThisSession: Math.max(
        get().maxAngleThisSession,
        snapshot.maxAngleThisRep
      ),
      formWarnings: snapshot.formWarnings,
      formWarningsEncountered: encounteredChanged ? new Set(encountered) : encountered,
      repTimestamps: nextTimestamps,
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
      repTimestamps: [],
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
      repTimestamps: [],
      sessionStartedAt: null,
      isSessionActive: false,
    });
  },
}));
