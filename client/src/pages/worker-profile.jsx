import { useEffect, useMemo, useState } from "react"
import { Navigate, useParams } from "react-router-dom"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/context/UserContext"
import api from "@/lib/api"
import { reverseGeocode } from "@/lib/location"
import WorkerPostGrid from "@/components/work/WorkerPostGrid"
import PostModal from "@/components/work/PostModal"
import Navbar from "@/pages/navbar"

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
  const [isBooking, setIsBooking] = useState(false)
  const [bookingError, setBookingError] = useState("")
  const [workerPosts, setWorkerPosts] = useState([])
  const [viewerIndex, setViewerIndex] = useState(-1)
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsError, setPostsError] = useState("")

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

  useEffect(() => {
    let isMounted = true

    const loadWorkerPosts = async () => {
      try {
        setPostsLoading(true)
        setPostsError("")

        const response = await api.get(`/posts/worker/${workerId}`)

        if (isMounted) {
          setWorkerPosts(response.data.posts ?? [])
        }
      } catch (requestError) {
        if (isMounted) {
          setPostsError(requestError?.response?.data?.message || "Unable to load worker uploads.")
          setWorkerPosts([])
        }
      } finally {
        if (isMounted) {
          setPostsLoading(false)
        }
      }
    }

    if (workerId) {
      loadWorkerPosts()
    }

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

  const handleBookNow = async () => {
    try {
      setIsBooking(true)
      setBookingError("")

      await api.post("/job/create", { workerId })
      window.location.href = "/bookings"
    } catch (requestError) {
      setBookingError(
        requestError?.response?.data?.message || "Unable to create booking right now."
      )
    } finally {
      setIsBooking(false)
    }
  }

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
                          src={worker.profilePictureUrl || "https://ui-avatars.com/api/?name=User&background=3f3f46&color=ffffff&bold=true"}
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
                  <Button
                    className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
                    onClick={handleBookNow}
                    disabled={isBooking}
                  >
                    {isBooking ? "Booking..." : "Book Now"}
                  </Button>
                  <Button variant="outline" className="rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800">
                    Message
                  </Button>
                </div>
              </div>

              {bookingError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {bookingError}
                </div>
              )}

              <div className="grid grid-cols-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-3">
                <Stat label="Posts" value={workerPosts.length} />
                <Stat label="Jobs Completed" value={worker.workerProfile?.jobsCompleted ?? 0} />
                <Stat label="Rating" value={Number(worker.workerProfile?.rating ?? 0).toFixed(1)} />
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
                {postsLoading ? (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-400">
                    Loading posts...
                  </div>
                ) : postsError ? (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                    {postsError}
                  </div>
                ) : (
                  <>
                    <WorkerPostGrid posts={workerPosts} emptyMessage="This worker has not posted any uploads yet." onOpenPost={(idx) => setViewerIndex(idx)} />
                    {viewerIndex >= 0 && (
                      <PostModal posts={workerPosts} index={viewerIndex} onClose={() => setViewerIndex(-1)} />
                    )}
                  </>
                )}
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
