"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PainRatingDialogProps {
  open: boolean;
  onSubmit: (painLevel: number) => void;
}

function paintColor(value: number): string {
  if (value <= 3) return "text-emerald-400";
  if (value <= 6) return "text-amber-400";
  return "text-red-400";
}

export function PainRatingDialog({ open, onSubmit }: PainRatingDialogProps) {
  const [value, setValue] = useState(0);

  return (
    <Dialog open={open}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Rate your pain / exertion</DialogTitle>
          <DialogDescription>
            How much pain or discomfort did you feel during this session?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <p className={cn("text-center text-4xl font-bold", paintColor(value))}>{value}</p>

          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full accent-teal-400"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 · No pain</span>
            <span>5 · Moderate</span>
            <span>10 · Worst pain</span>
          </div>

          <Button size="lg" onClick={() => onSubmit(value)}>
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
