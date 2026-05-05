import { cn } from "@/lib/utils";
import React from "react";

export default function GridBackgroundDemo({ className = "" }) {
  return (
    <div className={cn("absolute inset-0", className)}>
      <div
        className="pointer-events-none absolute inset-0 bg-zinc-950/40 mask-[radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-20",
          "bg-size-[32px_32px]",
          // lighter, more visible grid lines on dark background
          "bg-[linear-gradient(to_right,rgba(200,200,200,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(200,200,200,0.12)_1px,transparent_1px)]"
        )} />
    </div>
  );
}
