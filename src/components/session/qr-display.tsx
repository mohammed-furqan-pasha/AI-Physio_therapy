"use client";

import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface QrDisplayProps {
  peerId: string | null;
}

/**
 * Encodes the current page URL + peerId, so the phone's camera scanner
 * (which uses @zxing/browser) can extract the host's PeerJS ID directly
 * from the scanned payload.
 */
export function QrDisplay({ peerId }: QrDisplayProps) {
  const qrValue = peerId
    ? JSON.stringify({ type: "physio-peer-id", peerId })
    : "";

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle>Scan with your phone</CardTitle>
        <CardDescription>
          Open &quot;Connect Camera&quot; on your phone and scan this code
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {peerId ? (
          <div className="rounded-lg border bg-white p-4">
            <QRCodeSVG value={qrValue} size={220} />
          </div>
        ) : (
          <div className="flex h-[252px] w-[252px] items-center justify-center rounded-lg border bg-muted">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {peerId && (
          <p className="break-all text-center text-xs text-muted-foreground">
            ID: {peerId}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
