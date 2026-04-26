import { Star } from "lucide-react"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function VideoCard({
  workerName = "Ravi Kumar",
  rating = 4.8,
  distance = "1.2 km away",
  category = "Plumber",
  videoSrc = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border-zinc-800 bg-zinc-900/80 p-0">
      <AspectRatio ratio={9 / 16} className="relative bg-zinc-950">
        <video
          src={videoSrc}
          muted
          loop
          playsInline
          autoPlay
          className="h-full w-full object-cover"
        />

        <Badge className="absolute left-3 top-3 rounded-full border-zinc-700 bg-zinc-900/85 text-zinc-100">
          {category}
        </Badge>

        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-zinc-950/35 p-3 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between text-zinc-100">
            <p className="font-medium">{workerName}</p>
            <p className="text-sm text-zinc-300">{distance}</p>
          </div>

          <div className="mb-3 flex items-center gap-1 text-amber-300">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className="size-4"
                fill={index < Math.round(rating) ? "currentColor" : "none"}
              />
            ))}
            <span className="ml-1 text-sm text-zinc-200">{rating.toFixed(1)}</span>
          </div>

          <Button className="w-full rounded-2xl bg-indigo-600 text-white hover:bg-indigo-500">
            Book Now
          </Button>
        </div>
      </AspectRatio>
    </Card>
  )
}
