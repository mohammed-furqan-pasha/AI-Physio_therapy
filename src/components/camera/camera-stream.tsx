"use client";

import { useEffect, useRef, useState } from "react";
import { usePeerClient } from "@/lib/peer/use-peer-client";
import { QrScanner } from "@/components/camera/qr-scanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";

export function CameraStream() {
  const { status, localStream, error, connectToHost } = usePeerClient();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Tracks the video's actual intrinsic aspect ratio (width/height), which
  // flips automatically when the phone is rotated — the camera track's
  // reported dimensions change with device orientation on most mobile
  // browsers. Defaults to portrait until the first frame's metadata loads.
  const [aspectRatio, setAspectRatio] = useState(9 / 16);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video && localStream) {
      video.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateAspect = () => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w > 0 && h > 0) {
        setAspectRatio(w / h);
        setIsLandscape(w > h);
      }
    };

    video.addEventListener("loadedmetadata", updateAspect);
    video.addEventListener("resize", updateAspect); // fires on rotation on most Android browsers
    window.addEventListener("orientationchange", () => {
      // Give the browser a moment to actually rotate the video track before re-reading it.
      setTimeout(updateAspect, 300);
    });

    return () => {
      video.removeEventListener("loadedmetadata", updateAspect);
      video.removeEventListener("resize", updateAspect);
    };
  }, [localStream]);

  if (status === "idle" || status === "error") {
    return (
      <div className="flex flex-col items-center gap-4">
        <QrScanner onScanned={connectToHost} />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <Card className={isLandscape ? "w-full max-w-2xl" : "w-full max-w-sm"}>
      <CardHeader className="text-center">
        <CardTitle>Streaming to laptop</CardTitle>
        <CardDescription>
          {isLandscape
            ? "Landscape mode — good for full-body wide shots"
            : "Portrait mode — rotate for a wider view"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <div
          className="relative w-full max-w-[420px] overflow-hidden rounded-lg border bg-black"
          style={{ aspectRatio }}
        >
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            muted
            playsInline
            autoPlay
          />
        </div>
        <div className="flex items-center gap-2">
          <ConnectionBadge status={status} />
          <Badge variant="outline" className="gap-1">
            <RotateCcw className="h-3 w-3" />
            {isLandscape ? "Landscape" : "Portrait"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function ConnectionBadge({ status }: { status: string }) {
  if (status === "connected") {
    return (
      <Badge className="gap-1 bg-emerald-600 text-white">
        <CheckCircle2 className="h-3.5 w-3.5" /> Connected
      </Badge>
    );
  }
  if (status === "connecting") {
    return (
      <Badge className="gap-1 bg-sky-600 text-white">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Connecting...
      </Badge>
    );
  }
  return (
    <Badge className="gap-1 bg-destructive text-white">
      <XCircle className="h-3.5 w-3.5" /> Disconnected
    </Badge>
  );
}
