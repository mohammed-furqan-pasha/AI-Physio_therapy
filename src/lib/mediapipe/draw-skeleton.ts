import { PoseLandmarker } from "@mediapipe/tasks-vision";
import { Landmark } from "@/types/exercise";

/** BlazePose 33-point connection pairs (subset used for skeleton drawing). */
export const POSE_CONNECTIONS: [number, number][] =
  PoseLandmarker.POSE_CONNECTIONS.map((c) => [c.start, c.end]);

interface DrawOptions {
  lineColor?: string;
  pointColor?: string;
  highlightColor?: string;
  /** Landmark indices to draw larger/highlighted (e.g. the active joint triplet). */
  highlightIndices?: number[];
  lineWidth?: number;
  pointRadius?: number;
}

/**
 * Draws the pose skeleton overlay onto a canvas, matching the video's
 * displayed dimensions. `landmarks` are expected in normalized [0,1] space
 * (as returned directly by MediaPipe), which this function scales to pixels.
 */
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  canvasWidth: number,
  canvasHeight: number,
  options: DrawOptions = {}
) {
  const {
    lineColor = "rgba(56, 189, 248, 0.9)", // sky-400
    pointColor = "rgba(34, 197, 94, 0.9)", // green-500
    highlightColor = "rgba(251, 191, 36, 0.95)", // amber-400
    highlightIndices = [],
    lineWidth = 3,
    pointRadius = 5,
  } = options;

  ctx.save();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = lineColor;

  // Bones
  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];
    if (!start || !end) continue;
    if ((start.visibility ?? 1) < 0.3 || (end.visibility ?? 1) < 0.3) continue;

    ctx.beginPath();
    ctx.moveTo(start.x * canvasWidth, start.y * canvasHeight);
    ctx.lineTo(end.x * canvasWidth, end.y * canvasHeight);
    ctx.stroke();
  }

  // Joints
  landmarks.forEach((lm, idx) => {
    if ((lm.visibility ?? 1) < 0.3) return;
    const isHighlighted = highlightIndices.includes(idx);
    ctx.beginPath();
    ctx.fillStyle = isHighlighted ? highlightColor : pointColor;
    ctx.arc(
      lm.x * canvasWidth,
      lm.y * canvasHeight,
      isHighlighted ? pointRadius * 1.6 : pointRadius,
      0,
      2 * Math.PI
    );
    ctx.fill();
  });

  ctx.restore();
}

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.clearRect(0, 0, width, height);
}
