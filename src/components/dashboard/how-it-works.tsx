import { Card, CardContent } from "@/components/ui/card";
import { Laptop, QrCode, ScanLine, Activity } from "lucide-react";

const STEPS = [
  {
    icon: Laptop,
    title: "Open on your laptop",
    description: 'Click "Start Exercise Session" — it shows a QR code and waits.',
  },
  {
    icon: ScanLine,
    title: "Open on your phone",
    description: 'On your phone, click "Connect Camera" and scan the laptop\'s QR code.',
  },
  {
    icon: QrCode,
    title: "Devices link up",
    description: "Your phone streams video directly to your laptop over a local connection.",
  },
  {
    icon: Activity,
    title: "Track your reps",
    description: "The laptop overlays a skeleton and counts reps live — no data leaves your devices during the session.",
  },
];

export function HowItWorks() {
  return (
    <Card className="w-full max-w-3xl">
      <CardContent className="p-6">
        <p className="mb-4 text-sm font-semibold text-white/90">How a two-device session works</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-400/15 text-teal-300">
                <step.icon className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-white/40">Step {i + 1}</p>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Tip: You can also do this solo on one device — just point your laptop&apos;s own webcam at
          yourself and skip the phone-connect step, though a second device gives a better wide-angle view.
        </p>
      </CardContent>
    </Card>
  );
}
