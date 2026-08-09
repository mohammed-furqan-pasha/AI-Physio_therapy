import { Cpu, Glasses, Smartphone } from "lucide-react";

export function HeroSection() {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-3 text-center">
      <div className="mx-auto flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium text-teal-300 backdrop-blur-md">
        <Glasses className="h-3.5 w-3.5" />
        AR-style motion coaching — no headset required
      </div>

      <h2 className="text-2xl font-bold sm:text-3xl">
        Your laptop becomes an AR display.
        <br className="hidden sm:block" /> Your phone becomes the motion sensor.
      </h2>

      <p className="mx-auto max-w-xl text-sm text-muted-foreground">
        This app recreates what dedicated AR hardware (like wall-mounted motion cameras or
        smart glasses) does — using devices you already own. Your phone films you from across
        the room like a wall sensor, and your laptop acts as the heads-up display, overlaying a
        live skeleton on your body and counting reps in real time.
      </p>

      <div className="mx-auto mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1">
          <Smartphone className="h-3 w-3 text-teal-300" /> Phone = camera sensor
        </span>
        <span className="text-white/30">+</span>
        <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1">
          <Cpu className="h-3 w-3 text-teal-300" /> Laptop = AI + display
        </span>
      </div>
    </div>
  );
}
