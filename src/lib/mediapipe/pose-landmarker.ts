import {
  FilesetResolver,
  PoseLandmarker,
  PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

const WASM_BASE_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm";

const POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let landmarkerInstance: PoseLandmarker | null = null;
let loadingPromise: Promise<PoseLandmarker> | null = null;

/**
 * Loads (once, memoized) the MediaPipe Pose Landmarker running on the GPU
 * delegate for zero-lag, client-side inference. Must run in the browser —
 * do not call from server components.
 */
export async function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (landmarkerInstance) return landmarkerInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);

    const landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: POSE_MODEL_URL,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    landmarkerInstance = landmarker;
    return landmarker;
  })();

  return loadingPromise;
}

/**
 * Runs pose detection on a single video frame. Caller is responsible for
 * driving this from a requestAnimationFrame loop and passing a monotonically
 * increasing timestamp (performance.now()).
 */
export function detectForVideo(
  landmarker: PoseLandmarker,
  video: HTMLVideoElement,
  timestampMs: number
): PoseLandmarkerResult {
  return landmarker.detectForVideo(video, timestampMs);
}

export function disposePoseLandmarker() {
  landmarkerInstance?.close();
  landmarkerInstance = null;
  loadingPromise = null;
}
