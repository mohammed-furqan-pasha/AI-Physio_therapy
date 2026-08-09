"use client";

import { useCallback, useRef, useState } from "react";

interface UseLocalCameraResult {
  localStream: MediaStream | null;
  error: string | null;
  starting: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

/**
 * Solo-mode camera source: captures the laptop's own webcam directly via
 * getUserMedia, bypassing PeerJS entirely. The resulting MediaStream feeds
 * into the exact same VideoCanvas pipeline (MediaPipe + One Euro Filter +
 * FSM) as the phone-streamed path — so tracking quality and performance
 * are identical, this just skips the phone/QR handshake.
 */
export function useLocalCamera(): UseLocalCameraResult {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    setStarting(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setLocalStream(stream);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to access camera");
    } finally {
      setStarting(false);
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLocalStream(null);
  }, []);

  return { localStream, error, starting, start, stop };
}
