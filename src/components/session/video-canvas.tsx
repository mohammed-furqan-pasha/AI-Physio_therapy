"use client";

import { useEffect, useRef } from "react";
import {
  getPoseLandmarker,
} from "@/lib/mediapipe/pose-landmarker";
import { drawSkeleton, clearCanvas } from "@/lib/mediapipe/draw-skeleton";
import { LandmarkOneEuroFilter } from "@/lib/filters/one-euro-filter";
import { calculateJointAngle } from "@/lib/geometry/angles";
import { RepCounterFSM } from "@/lib/fsm/rep-counter";
import { useSessionStore } from "@/store/session-store";
import { Landmark } from "@/types/exercise";

interface VideoCanvasProps {
  stream: MediaStream;
}

/**
 * Receives the phone's raw video stream, runs client-side MediaPipe pose
 * detection on the laptop (GPU delegate), smooths landmarks with a One Euro
 * Filter, computes joint angles, feeds them into the rep-counting FSM, and
 * draws the skeleton overlay directly on top of the video — the "AR glasses"
 * heads-up display.
 */
export function VideoCanvas({ stream }: VideoCanvasProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  // Persist filters/FSM across renders and across exercise changes.
  const landmarkFiltersRef = useRef<Map<number, LandmarkOneEuroFilter>>(new Map());
  const fsmRef = useRef<RepCounterFSM | null>(null);
  const currentExerciseIdRef = useRef<string | null>(null);

  const exercise = useSessionStore((s) => s.exercise);
  const updateFromFsm = useSessionStore((s) => s.updateFromFsm);
  const isSessionActive = useSessionStore((s) => s.isSessionActive);

  // (Re)initialize the FSM whenever the selected exercise changes.
  useEffect(() => {
    if (currentExerciseIdRef.current !== exercise.id) {
      fsmRef.current = new RepCounterFSM(exercise.angleThresholds);
      landmarkFiltersRef.current.clear();
      currentExerciseIdRef.current = exercise.id;
    }
  }, [exercise]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;
    video.play().catch(() => {
      /* autoplay may be blocked until user gesture; controls/muted handle most cases */
    });

    let cancelled = false;

    async function runLoop() {
      const landmarker = await getPoseLandmarker();
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas || !video) return;

      const loop = () => {
        if (cancelled) return;

        if (video.readyState >= 2 && video.videoWidth > 0) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          const timestampMs = performance.now();
          const result = landmarker.detectForVideo(video, timestampMs);
          const ctx = canvas.getContext("2d");

          if (ctx) {
            clearCanvas(ctx, canvas.width, canvas.height);

            const rawLandmarks = result.landmarks?.[0];
            if (rawLandmarks && fsmRef.current) {
              const smoothed = smoothLandmarks(
                rawLandmarks,
                landmarkFiltersRef.current,
                timestampMs
              );

              const { a, b, c } = exercise.primaryJoint;
              if (smoothed[a] && smoothed[b] && smoothed[c]) {
                const primaryAngle = calculateJointAngle(
                  smoothed[a],
                  smoothed[b],
                  smoothed[c]
                );

                const formChecks = exercise.formRules
                  .map((rule) => {
                    const { a: fa, b: fb, c: fc } = rule.joint;
                    if (!smoothed[fa] || !smoothed[fb] || !smoothed[fc]) return null;
                    return {
                      rule,
                      angle: calculateJointAngle(smoothed[fa], smoothed[fb], smoothed[fc]),
                    };
                  })
                  .filter((v): v is { rule: typeof exercise.formRules[number]; angle: number } => v !== null);

                const snapshot = fsmRef.current.update(
                  primaryAngle,
                  formChecks,
                  timestampMs
                );

                if (isSessionActive) {
                  updateFromFsm(snapshot);
                }

                drawSkeleton(ctx, smoothed, canvas.width, canvas.height, {
                  highlightIndices: [a, b, c],
                });
              } else {
                drawSkeleton(ctx, smoothed, canvas.width, canvas.height);
              }
            }
          }
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    }

    runLoop();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, exercise, isSessionActive]);

  return (
    <div className="relative w-full max-w-3xl overflow-hidden rounded-xl border bg-black">
      <video
        ref={videoRef}
        className="w-full -scale-x-100 transform"
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="absolute left-0 top-0 h-full w-full -scale-x-100 transform"
      />
    </div>
  );
}

function smoothLandmarks(
  raw: { x: number; y: number; z: number; visibility?: number }[],
  filters: Map<number, LandmarkOneEuroFilter>,
  timestampMs: number
): Landmark[] {
  return raw.map((lm, idx) => {
    if (!filters.has(idx)) {
      filters.set(idx, new LandmarkOneEuroFilter({ minCutoff: 1.0, beta: 0.02 }));
    }
    const filtered = filters.get(idx)!.filter(lm.x, lm.y, lm.z, timestampMs);
    return { ...filtered, visibility: lm.visibility };
  });
}
