"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface QrScannerProps {
  onScanned: (peerId: string) => void;
  disabled?: boolean;
}

export function QrScanner({ onScanned, disabled }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (disabled) return;

    const reader = new BrowserQRCodeReader();
    let cancelled = false;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result) => {
        if (cancelled || !result) return;

        try {
          const parsed = JSON.parse(result.getText());
          if (parsed?.type === "physio-peer-id" && parsed?.peerId) {
            onScanned(parsed.peerId);
          }
        } catch {
          // Not a valid payload from our host QR — ignore and keep scanning.
        }
      })
      .then((controls) => {
        controlsRef.current = controls;
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Camera access failed");
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle>Scan laptop QR code</CardTitle>
        <CardDescription>Point your camera at the code on your laptop screen</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          {disabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
