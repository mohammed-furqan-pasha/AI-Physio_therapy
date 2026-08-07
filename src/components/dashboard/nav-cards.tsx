"use client";

import Link from "next/link";
import { Monitor, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function NavCards() {
  return (
    <div className="grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
      <Link href="/session">
        <Card className="h-full transition-colors hover:border-primary hover:bg-accent/40">
          <CardHeader>
            <Monitor className="mb-2 h-8 w-8 text-primary" />
            <CardTitle>Start Exercise Session</CardTitle>
            <CardDescription>
              Use this laptop as your AR display. Generates a QR code, waits
              for your phone to connect, then tracks reps live.
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>

      <Link href="/connect">
        <Card className="h-full transition-colors hover:border-primary hover:bg-accent/40">
          <CardHeader>
            <Smartphone className="mb-2 h-8 w-8 text-primary" />
            <CardTitle>Connect Camera</CardTitle>
            <CardDescription>
              Use this phone as the camera sensor. Scan your laptop's QR code
              to start streaming.
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>
    </div>
  );
}
