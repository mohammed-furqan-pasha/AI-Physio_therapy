"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Peer, { MediaConnection } from "peerjs";
import { PeerConnectionStatus } from "@/types/peer";

interface UsePeerHostResult {
  peerId: string | null;
  status: PeerConnectionStatus;
  remoteStream: MediaStream | null;
  error: string | null;
  disconnect: () => void;
}

/**
 * Laptop-side ("AR glasses" / compute + display) PeerJS hook.
 * Generates a Peer ID, exposes it for QR display, and waits passively for
 * the phone to call in with its camera stream. The laptop never sends
 * media — it only receives.
 */
export function usePeerHost(): UsePeerHostResult {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [status, setStatus] = useState<PeerConnectionStatus>("idle");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);

  useEffect(() => {
    setStatus("waiting_for_peer");
    const options = buildPeerOptions();
    const peer = options ? new Peer(options) : new Peer();
    peerRef.current = peer;

    peer.on("open", (id) => {
      setPeerId(id);
    });

    peer.on("call", (call) => {
      setStatus("connecting");
      callRef.current = call;
      // Host answers with no outgoing stream — it only receives the phone's feed.
      call.answer();

      call.on("stream", (stream) => {
        setRemoteStream(stream);
        setStatus("connected");
      });

      call.on("close", () => {
        setStatus("disconnected");
        setRemoteStream(null);
      });

      call.on("error", (err) => {
        setError(err.message ?? "Call error");
        setStatus("error");
      });
    });

    peer.on("error", (err) => {
      setError(err.message ?? "Peer error");
      setStatus("error");
    });

    peer.on("disconnected", () => {
      setStatus("disconnected");
    });

    return () => {
      callRef.current?.close();
      peer.destroy();
      peerRef.current = null;
    };
  }, []);

  const disconnect = useCallback(() => {
    callRef.current?.close();
    setRemoteStream(null);
    setStatus("disconnected");
  }, []);

  return { peerId, status, remoteStream, error, disconnect };
}

/**
 * Builds PeerJS constructor options. If NEXT_PUBLIC_PEERJS_HOST is unset,
 * PeerJS falls back to its free public cloud broker — fine for local dev
 * and same-WiFi laptop/phone pairing.
 */
export function buildPeerOptions() {
  const host = process.env.NEXT_PUBLIC_PEERJS_HOST;
  const port = process.env.NEXT_PUBLIC_PEERJS_PORT;
  const path = process.env.NEXT_PUBLIC_PEERJS_PATH;

  if (!host) return undefined;

  return {
    host,
    port: port ? Number(port) : undefined,
    path: path || "/",
    secure: true,
  };
}
