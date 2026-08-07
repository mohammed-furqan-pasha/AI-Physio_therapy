"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Peer, { MediaConnection } from "peerjs";
import { PeerConnectionStatus } from "@/types/peer";
import { buildPeerOptions } from "./use-peer-host";

interface UsePeerClientResult {
  status: PeerConnectionStatus;
  localStream: MediaStream | null;
  error: string | null;
  /** Call once a hostPeerId has been scanned from the QR code. */
  connectToHost: (hostPeerId: string) => Promise<void>;
  disconnect: () => void;
}

/**
 * Phone-side ("wall sensor" camera source) PeerJS hook.
 * Acquires the rear camera via getUserMedia, then dials the laptop's
 * Peer ID (scanned from its QR code) and streams video directly to it.
 */
export function usePeerClient(): UsePeerClientResult {
  const [status, setStatus] = useState<PeerConnectionStatus>("idle");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const isConnectingRef = useRef(false);

  useEffect(() => {
    const options = buildPeerOptions();
    const peer = options ? new Peer(options) : new Peer();
    peerRef.current = peer;

    peer.on("error", (err) => {
      setError(err.message ?? "Peer error");
      setStatus("error");
    });

    return () => {
      callRef.current?.close();
      localStream?.getTracks().forEach((t) => t.stop());
      peer.destroy();
      peerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectToHost = useCallback(async (hostPeerId: string) => {
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;
    
    setStatus("connecting");
    setError(null);

    try {
      // Delay to ensure the QR scanner's camera track releases the hardware completely on mobile
      await new Promise((resolve) => setTimeout(resolve, 600));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          // Use `ideal` rather than hard-locking width/height — this lets
          // the browser report the camera's natural orientation (portrait
          // or landscape) based on how the phone is actually held, instead
          // of forcing a landscape-shaped frame regardless of rotation.
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });
      setLocalStream(stream);

      const peer = peerRef.current;
      if (!peer) throw new Error("Peer not initialized");

      const attemptCall = () => {
        const call = peer.call(hostPeerId, stream);
        callRef.current = call;

        call.on("stream", () => {
          // Host doesn't send a stream back, but reaching this confirms link.
          setStatus("connected");
        });

        call.on("close", () => setStatus("disconnected"));
        call.on("error", (err) => {
          setError(err.message ?? "Call error");
          setStatus("error");
        });

        // PeerJS media calls are considered connected once negotiation
        // completes; mark connected optimistically after a short delay
        // if no stream event fires back (host is receive-only).
        setTimeout(() => {
          setStatus((prev) => (prev === "connecting" ? "connected" : prev));
        }, 1500);
      };

      if (peer.open) {
        attemptCall();
      } else {
        peer.once("open", attemptCall);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to access camera");
      setStatus("error");
    } finally {
      isConnectingRef.current = false;
    }
  }, []);

  const disconnect = useCallback(() => {
    callRef.current?.close();
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setStatus("disconnected");
  }, [localStream]);

  return { status, localStream, error, connectToHost, disconnect };
}
