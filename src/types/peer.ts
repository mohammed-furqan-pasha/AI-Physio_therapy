/**
 * Shared types for the PeerJS WebRTC link between the laptop (host / "AR glasses"
 * display + compute) and the phone (client / "wall sensor" camera source).
 */

export type PeerRole = "host" | "client";

export type PeerConnectionStatus =
  | "idle"
  | "waiting_for_peer"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

/** Optional lightweight data-channel messages, separate from the media stream. */
export type PeerDataMessage =
  | { type: "ping" }
  | { type: "pong" }
  | { type: "ready" };
