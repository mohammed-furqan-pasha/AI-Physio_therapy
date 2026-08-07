"use client";

import { useEffect, useRef } from "react";
import { usePeerClient } from "@/lib/peer/use-peer-client";
import { QrScanner } from "@/components/camera/qr-scanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export function CameraStream() {
  const { status, localStream, error, connectToHost } = usePeerClient();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
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
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle>Streaming to laptop</CardTitle>
        <CardDescription>Keep this phone steady and in view of your movement</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <div className="relative aspect-[9/16] w-full max-w-[240px] overflow-hidden rounded-lg border bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline autoPlay />
        </div>
        <ConnectionBadge status={status} />
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
