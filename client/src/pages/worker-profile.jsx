import { useEffect, useMemo, useState } from "react"
import { Navigate, useParams } from "react-router-dom"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/context/UserContext"
import api from "@/lib/api"
import { reverseGeocode } from "@/lib/location"
import Navbar from "@/pages/navbar"

const showcaseTiles = [
  { id: 1, title: "Panel wiring", tone: "from-zinc-700 via-zinc-800 to-black" },
  { id: 2, title: "Fan repair", tone: "from-amber-600 via-orange-600 to-red-700" },
  { id: 3, title: "Site check", tone: "from-sky-700 via-blue-700 to-indigo-800" },
  { id: 4, title: "Tools ready", tone: "from-emerald-700 via-teal-700 to-cyan-800" },
  { id: 5, title: "Safety first", tone: "from-fuchsia-700 via-pink-700 to-rose-800" },
  { id: 6, title: "After fix", tone: "from-violet-700 via-purple-700 to-indigo-800" },
]

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-base font-semibold text-zinc-100">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
    </div>
  )
}

export default function WorkerProfilePage() {
  const { token } = useUser()
  const { workerId } = useParams()
  const [worker, setWorker] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [locationName, setLocationName] = useState("Location not available")

  useEffect(() => {
    let isMounted = true

    const loadWorker = async () => {
      try {
        setIsLoading(true)
        setError("")

        const response = await api.get(`/auth/workers/${workerId}`)

        if (isMounted) {
          setWorker(response.data.worker)
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError?.response?.data?.message || "Unable to load worker profile.")
          setWorker(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadWorker()

    return () => {
      isMounted = false
    }
  }, [workerId])

  const displayName = worker?.username ?? "Worker profile"
  const initial = useMemo(() => displayName.slice(0, 2).toUpperCase(), [displayName])

  useEffect(() => {
    let isMounted = true

    const resolveLocation = async () => {
      const locationCoordinates = worker?.location?.coordinates

      if (locationCoordinates?.length !== 2) {
        if (isMounted) {
          setLocationName("Location not available")
        }
        return
      }

      const resolved = await reverseGeocode({
        latitude: locationCoordinates[1],
        longitude: locationCoordinates[0],
      })

      if (isMounted) {
        setLocationName(resolved)
      }
    }

    resolveLocation()

    return () => {
      isMounted = false
    }
  }, [worker])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <main className="dark min-h-screen bg-zinc-950 p-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] text-zinc-100 md:p-8 md:pb-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <Navbar />

        {isLoading ? (
          <Card className="rounded-2xl border-zinc-800 bg-zinc-900/80 text-zinc-100">
            <CardContent className="p-4 text-sm text-zinc-400">Loading worker profile...</CardContent>
          </Card>
        ) : error ? (
          <Card className="rounded-2xl border-rose-500/30 bg-rose-500/10 text-zinc-100">
            <CardContent className="p-4 text-sm text-rose-200">{error}</CardContent>
          </Card>
        ) : worker ? (
          <div className="space-y-5">
            <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-linear-to-tr from-yellow-500 via-pink-500 to-orange-500 p-1">
                    <div className="rounded-full bg-zinc-950 p-1">
                      <Avatar className="size-20 sm:size-24">
                        <AvatarImage
                          src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"
                          alt={displayName}
                        />
                        <AvatarFallback>{initial}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-semibold sm:text-2xl">{displayName}</h1>
                      <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                        {worker.workerProfile?.isAvailable ? "Available" : "Busy"}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-400">{worker.workerProfile?.category ?? "General electrician"}</p>
                    <p className="text-xs text-zinc-500">{locationName}</p>
                  </div>
                </div>

                <div className="flex gap-2 sm:items-start">
                  <Button className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">Book Now</Button>
                  <Button variant="outline" className="rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800">
                    Message
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-3">
                <Stat label="Posts" value="9" />
                <Stat label="Followers" value="1.2k" />
                <Stat label="Following" value="341" />
              </div>

              <p className="text-sm text-zinc-300">
                {worker.username} is a verified worker profile with {worker.workerProfile?.jobsCompleted ?? 0} completed jobs and an average rating of {Number(worker.workerProfile?.rating ?? 0).toFixed(1)}.
              </p>
            </section>

            <Tabs defaultValue="posts" className="w-full">
              <TabsList variant="line" className="grid w-full grid-cols-1 rounded-none border-t border-zinc-800 px-0 pt-2">
                <TabsTrigger value="posts" className="gap-2 text-zinc-400 data-active:text-zinc-100">
                  <span className="text-xs uppercase tracking-wide">Posts</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="pt-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                  {showcaseTiles.map((tile, index) => (
                    <AspectRatio key={tile.id} ratio={1}>
                      <div
                        className={`flex h-full w-full items-end rounded-2xl bg-linear-to-br ${tile.tone} p-3`}
                        style={{ opacity: index === 0 ? 1 : 0.96 }}
                      >
                        <div className="space-y-1">
                          <p className="text-[11px] uppercase tracking-wide text-white/70">Work shot</p>
                          <p className="text-sm font-medium text-white">{tile.title}</p>
                        </div>
                      </div>
                    </AspectRatio>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Card className="rounded-2xl border-zinc-800 bg-zinc-900/80 text-zinc-100">
            <CardContent className="p-4 text-sm text-zinc-400">Worker not found.</CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
