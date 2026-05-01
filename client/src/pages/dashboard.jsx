import { useEffect, useMemo, useRef, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useUser } from "@/context/UserContext"
import api from "@/lib/api"
import { estimateEtaMinutes } from "@/lib/eta"
import { reverseGeocode } from "@/lib/location"
import Navbar from "@/pages/navbar"

function WorkerResultCard({ worker, onViewProfile }) {
  return (
    <Card className="rounded-2xl border-zinc-800 bg-zinc-950/70 text-zinc-100 transition hover:border-zinc-700 hover:bg-zinc-950">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">{worker.name}</h3>
            <p className="text-xs text-zinc-500">{worker.area}</p>
          </div>
          <p className="text-sm font-semibold text-zinc-100">{Number(worker.rating).toFixed(1)}★</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
          <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1">{worker.jobsCompleted} jobs</span>
          <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1">{worker.category}</span>
          {typeof worker.etaMinutes === "number" && (
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-blue-300">{worker.etaMinutes} min away</span>
          )}
          <span className={[
            "rounded-full border px-2.5 py-1",
            worker.isAvailable
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-zinc-700 bg-zinc-800/60 text-zinc-300",
          ].join(" ")}>{worker.isAvailable ? "Available" : "Busy"}</span>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full rounded-2xl border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800"
          onClick={() => onViewProfile(worker)}
        >
          View Profile
        </Button>
      </CardContent>
    </Card>
  )
}

function ClientDashboard({ coordinates }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [availability, setAvailability] = useState("all")
  const [minRating, setMinRating] = useState("0")
  const [sortBy, setSortBy] = useState("default")
  const [workers, setWorkers] = useState([])
  const [workerAreaNames, setWorkerAreaNames] = useState({})
  const [hasSearched, setHasSearched] = useState(false)
  const [currentWork, setCurrentWork] = useState([])
  const [currentWorkLoading, setCurrentWorkLoading] = useState(true)
  const [currentWorkError, setCurrentWorkError] = useState("")
  const [reviewTargetId, setReviewTargetId] = useState("")
  const [reviewOtp, setReviewOtp] = useState("")
  const [reviewRating, setReviewRating] = useState("5")
  const [reviewComment, setReviewComment] = useState("")
  const [reviewNotice, setReviewNotice] = useState("")
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [clientCoordinates, setClientCoordinates] = useState(
    coordinates?.latitude && coordinates?.longitude
      ? { latitude: coordinates.latitude, longitude: coordinates.longitude }
      : null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let isMounted = true

    const loadClientCoordinates = async () => {
      if (clientCoordinates) {
        return
      }

      try {
        const response = await api.get("/auth/me")
        const profileCoordinates = response?.data?.user?.location?.coordinates

        if (!isMounted || profileCoordinates?.length !== 2) {
          return
        }

        setClientCoordinates({
          latitude: profileCoordinates[1],
          longitude: profileCoordinates[0],
        })
      } catch {
        // No-op. ETA stays hidden when client location is unavailable.
      }
    }

    loadClientCoordinates()

    return () => {
      isMounted = false
    }
  }, [clientCoordinates])

  const loadWorkers = async () => {
    try {
      setIsLoading(true)
      setError("")
      setHasSearched(true)

      const response = await api.get("/auth/workers", {
        params: {
          q: searchQuery,
          category,
          availability,
          minRating,
        },
      })

      setWorkers(response.data.workers ?? [])
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to load workers right now."
      )
      setWorkers([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadCurrentWork = async () => {
    try {
      setCurrentWorkLoading(true)
      setCurrentWorkError("")

      const response = await api.get("/job/current-work")
      setCurrentWork(response.data.currentWork ?? [])
    } catch (requestError) {
      setCurrentWorkError(
        requestError?.response?.data?.message || "Unable to load current work right now."
      )
      setCurrentWork([])
    } finally {
      setCurrentWorkLoading(false)
    }
  }

  const handleSearch = (event) => {
    event.preventDefault()
    loadWorkers()
  }

  const handleReviewSubmit = async (jobId) => {
    try {
      setReviewSubmitting(true)
      setReviewNotice("")
      await api.post("/job/verify-and-rate", {
        jobId,
        otp: reviewOtp,
        rating: Number(reviewRating),
        comment: reviewComment,
      })
      setReviewNotice("Review submitted successfully.")
      setReviewTargetId("")
      setReviewOtp("")
      setReviewRating("5")
      setReviewComment("")
      await loadCurrentWork()
    } catch (requestError) {
      setReviewNotice(requestError?.response?.data?.message || "Unable to submit review right now.")
    } finally {
      setReviewSubmitting(false)
    }
  }

  useEffect(() => {
    loadCurrentWork()

    const refreshTimer = window.setInterval(() => {
      loadCurrentWork()
    }, 15000)

    return () => {
      window.clearInterval(refreshTimer)
    }
  }, [])

  const resultCountLabel = useMemo(() => {
    if (!hasSearched) {
      return "Choose filters and tap Search to find workers"
    }

    return isLoading ? "Searching workers..." : `${workers.length} workers found`
  }, [hasSearched, isLoading, workers.length])

  const workersWithEta = useMemo(() => {
    const enrichedWorkers = workers.map((worker) => {
      const workerCoordinates = worker?.location?.coordinates?.length === 2
        ? { latitude: worker.location.coordinates[1], longitude: worker.location.coordinates[0] }
        : null

      const etaMinutes = clientCoordinates && workerCoordinates
        ? estimateEtaMinutes(clientCoordinates, workerCoordinates)
        : null

      return {
        ...worker,
        area: workerAreaNames[worker.id] ?? "Resolving location...",
        etaMinutes,
      }
    })

    if (sortBy === "eta-asc") {
      return [...enrichedWorkers].sort((a, b) => {
        if (typeof a.etaMinutes !== "number" && typeof b.etaMinutes !== "number") {
          return 0
        }

        if (typeof a.etaMinutes !== "number") {
          return 1
        }

        if (typeof b.etaMinutes !== "number") {
          return -1
        }

        return a.etaMinutes - b.etaMinutes
      })
    }

    if (sortBy === "eta-desc") {
      return [...enrichedWorkers].sort((a, b) => {
        if (typeof a.etaMinutes !== "number" && typeof b.etaMinutes !== "number") {
          return 0
        }

        if (typeof a.etaMinutes !== "number") {
          return 1
        }

        if (typeof b.etaMinutes !== "number") {
          return -1
        }

        return b.etaMinutes - a.etaMinutes
      })
    }

    return enrichedWorkers
  }, [workers, workerAreaNames, clientCoordinates, sortBy])

  useEffect(() => {
    let isMounted = true

    const resolveWorkerAreas = async () => {
      const areaEntries = await Promise.all(
        workers.map(async (worker) => {
          const locationCoordinates = worker?.location?.coordinates

          if (locationCoordinates?.length !== 2) {
            return [worker.id, "Location not available"]
          }

          const resolved = await reverseGeocode({
            latitude: locationCoordinates[1],
            longitude: locationCoordinates[0],
          })

          return [worker.id, resolved]
        })
      )

      if (!isMounted) {
        return
      }

      setWorkerAreaNames(Object.fromEntries(areaEntries))
    }

    if (workers.length > 0) {
      resolveWorkerAreas()
      return () => {
        isMounted = false
      }
    }

    setWorkerAreaNames({})
    return () => {
      isMounted = false
    }
  }, [workers])

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-zinc-800 bg-zinc-900/80 text-zinc-100">
        <CardHeader>
          <CardTitle className="text-2xl">Current Work</CardTitle>
          <CardDescription className="text-zinc-400">
            Active bookings that are ready for client review.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {currentWorkLoading ? (
            <p className="text-sm text-zinc-400">Loading current work...</p>
          ) : currentWorkError ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              {currentWorkError}
            </div>
          ) : currentWork.length === 0 ? (
            <p className="text-sm text-zinc-400">No active work right now.</p>
          ) : (
            currentWork.map((job) => (
              <div key={job._id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-100">
                      {job.worker?.username ?? "Worker"}
                    </p>
                    <p className="text-sm text-zinc-400">
                      {job.worker?.workerProfile?.category ?? "Service request"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Requested {new Date(job.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {job.otp ? "Worker shared an OTP. Enter it to verify and review." : "Waiting for the worker to finish and share the OTP."}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    <Badge className={job.otp ? "border-blue-500/30 bg-blue-500/10 text-blue-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"}>
                      {job.otp ? "OTP READY" : "CURRENT WORK"}
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800"
                      onClick={() => {
                        setReviewTargetId((current) => (current === job._id ? "" : job._id))
                        setReviewNotice("")
                      }}
                    >
                      Give Review
                    </Button>
                  </div>
                </div>

                {reviewTargetId === job._id && (
                  <div className="mt-4 grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                    <Input
                      placeholder="OTP from worker"
                      value={reviewOtp}
                      onChange={(event) => setReviewOtp(event.target.value)}
                      className="rounded-2xl border-zinc-800"
                    />
                    <select
                      value={reviewRating}
                      onChange={(event) => setReviewRating(event.target.value)}
                      className="h-10 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700"
                    >
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Good</option>
                      <option value="3">3 - Okay</option>
                      <option value="2">2 - Poor</option>
                      <option value="1">1 - Bad</option>
                    </select>
                    <textarea
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      placeholder="Leave a short review"
                      className="min-h-24 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
                    />
                    <Button
                      type="button"
                      className="rounded-2xl bg-indigo-600 text-white hover:bg-indigo-500"
                      onClick={() => handleReviewSubmit(job._id)}
                      disabled={reviewSubmitting}
                    >
                      {reviewSubmitting ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
          {reviewNotice && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 text-sm text-zinc-300">
              {reviewNotice}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-zinc-800 bg-zinc-900/80 text-zinc-100">
        <CardHeader>
          <CardTitle className="text-2xl">Find a Worker</CardTitle>
          <CardDescription className="text-zinc-400">
            Search local professionals by trade, filter by availability and rating, then open a profile card.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSearch}>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Search by name, locality, or trade"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="rounded-2xl border-zinc-800"
            />

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700"
            >
              <option value="all">All professions</option>
              <option value="electrician">Electrician</option>
              <option value="plumber">Plumber</option>
              <option value="carpenter">Carpenter</option>
              <option value="painter">Painter</option>
              <option value="mechanic">Mechanic</option>
              <option value="handyman">Handyman</option>
            </select>

            <select
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              className="h-10 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700"
            >
              <option value="all">Any availability</option>
              <option value="available">Available only</option>
              <option value="unavailable">Busy only</option>
            </select>

            <select
              value={minRating}
              onChange={(event) => setMinRating(event.target.value)}
              className="h-10 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700"
            >
              <option value="0">Any rating</option>
              <option value="4">4.0+</option>
              <option value="4.5">4.5+</option>
              <option value="4.8">4.8+</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-10 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700"
            >
              <option value="default">Sort: Default</option>
              <option value="eta-asc">Sort: Fastest arrival</option>
              <option value="eta-desc">Sort: Slowest arrival</option>
            </select>
          </div>

          <div className="flex flex-col gap-3 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
            <p>{resultCountLabel}</p>
            <div className="flex items-center gap-2">
              <p>Area is resolved from worker location</p>
              <Button
                type="submit"
                className="rounded-2xl bg-indigo-600 text-white hover:bg-indigo-500"
                disabled={isLoading}
              >
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              {error}
            </div>
          )}
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {workersWithEta.map((worker) => (
          <WorkerResultCard
            key={worker.id}
            worker={worker}
            onViewProfile={(nextWorker) => navigate(`/workers/${nextWorker.id}`)}
          />
        ))}

        {hasSearched && !isLoading && workers.length === 0 && !error && (
          <Card className="rounded-2xl border-zinc-800 bg-zinc-900/80 text-zinc-100">
            <CardContent className="p-4 text-sm text-zinc-400">
              No workers matched your search.
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  )
}

function WorkerDashboard() {
  const [isAvailable, setIsAvailable] = useState(true)
  const [isSavingAvailability, setIsSavingAvailability] = useState(false)
  const [availabilityError, setAvailabilityError] = useState("")
  const [availabilityNotice, setAvailabilityNotice] = useState("")
  const availabilityTimer = useRef(null)
  const [currentWork, setCurrentWork] = useState([])
  const [currentWorkLoading, setCurrentWorkLoading] = useState(true)
  const [currentWorkError, setCurrentWorkError] = useState("")
  const [completionNotice, setCompletionNotice] = useState("")
  const [completionJobId, setCompletionJobId] = useState("")

  useEffect(() => {
    let isMounted = true

    const loadAvailability = async () => {
      try {
        const response = await api.get("/auth/me")
        const nextAvailability = response?.data?.user?.workerProfile?.isAvailable

        if (isMounted && typeof nextAvailability === "boolean") {
          setIsAvailable(nextAvailability)
        }
      } catch {
        // Keep the current local default if the profile cannot be loaded.
      }
    }

    loadAvailability()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadCurrentWork = async () => {
      try {
        setCurrentWorkLoading(true)
        setCurrentWorkError("")

        const response = await api.get("/job/current-work")

        if (isMounted) {
          setCurrentWork(response.data.currentWork ?? [])
        }
      } catch (requestError) {
        if (isMounted) {
          setCurrentWorkError(
            requestError?.response?.data?.message || "Unable to load current work right now."
          )
          setCurrentWork([])
        }
      } finally {
        if (isMounted) {
          setCurrentWorkLoading(false)
        }
      }
    }

    loadCurrentWork()

    const refreshTimer = window.setInterval(() => {
      loadCurrentWork()
    }, 15000)

    return () => {
      isMounted = false
      window.clearInterval(refreshTimer)
    }
  }, [])

  const handleAvailabilityToggle = async () => {
    const nextAvailability = !isAvailable

    try {
      setIsSavingAvailability(true)
      setAvailabilityError("")
      setIsAvailable(nextAvailability)

      const response = await api.patch("/auth/me/availability", {
        isAvailable: nextAvailability,
      })

      const serverAvailable = typeof response?.data?.isAvailable === "boolean"
        ? response.data.isAvailable
        : nextAvailability

      setIsAvailable(serverAvailable)

      // Show a short, clear notice for the worker about the new state
      setAvailabilityNotice(
        serverAvailable
          ? "You're now Available — you'll receive new requests."
          : "You're now Unavailable — you won't receive new requests."
      )

      if (availabilityTimer.current) {
        clearTimeout(availabilityTimer.current)
      }
      availabilityTimer.current = setTimeout(() => setAvailabilityNotice(""), 4000)
    } catch (requestError) {
      setIsAvailable((current) => !current)
      setAvailabilityError(
        requestError?.response?.data?.message || "Unable to update availability right now."
      )
    } finally {
      setIsSavingAvailability(false)
    }
  }

  const handleWorkCompleted = async (jobId) => {
    try {
      setCompletionJobId(jobId)
      setCompletionNotice("")
      const response = await api.post(`/job/request-completion/${jobId}`)
      const otpCode = response?.data?.debugOtp

      setCompletionNotice(
        otpCode
          ? `OTP generated: ${otpCode}. Speak this code to the client so they can verify it.`
          : response?.data?.message || "OTP generated and sent to the client."
      )
      await api.get("/job/current-work").then((result) => {
        setCurrentWork(result.data.currentWork ?? [])
      })
    } catch (requestError) {
      setCompletionNotice(
        requestError?.response?.data?.message || "Unable to mark work as completed right now."
      )
    } finally {
      setCompletionJobId("")
    }
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-zinc-800 bg-zinc-900/80 text-zinc-100">
        <CardHeader>
          <CardTitle className="text-2xl">Current Work</CardTitle>
          <CardDescription className="text-zinc-400">
            Active accepted jobs that are ready for completion.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {currentWorkLoading ? (
            <p className="text-sm text-zinc-400">Loading current work...</p>
          ) : currentWorkError ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              {currentWorkError}
            </div>
          ) : currentWork.length === 0 ? (
            <p className="text-sm text-zinc-400">No active work right now.</p>
          ) : (
            currentWork.map((job) => (
              <div key={job._id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-100">
                      {job.client?.username ?? "Client"}
                    </p>
                    <p className="text-sm text-zinc-400">
                      {job.client?.phone ?? "Phone not available"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Accepted {new Date(job.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {job.otp ? "OTP shared with client. Waiting for verification." : "Click Work Completed to generate the OTP."}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    <Badge className={job.otp ? "border-blue-500/30 bg-blue-500/10 text-blue-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"}>
                      {job.otp ? "OTP READY" : "CURRENT WORK"}
                    </Badge>
                    <Button
                      type="button"
                      className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
                      onClick={() => handleWorkCompleted(job._id)}
                      disabled={completionJobId === job._id}
                    >
                      {completionJobId === job._id ? "Generating OTP..." : "Work Completed"}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
          {completionNotice && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 text-sm text-zinc-300">
              {completionNotice}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-zinc-800 bg-zinc-900/80 text-zinc-100">
        <CardHeader>
          <CardTitle className="text-2xl">Worker Dashboard</CardTitle>
          <CardDescription className="text-zinc-400">
            Manage incoming jobs and your current availability.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3 text-sm text-zinc-300 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-zinc-100">Availability</p>
            <p className="text-zinc-400">Toggle this to receive new requests.</p>
          </div>

          <div className="flex items-center gap-3">
            <Badge className={isAvailable ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300"}>
              {isAvailable ? "Available" : "Unavailable"}
            </Badge>

            <Button
              type="button"
              onClick={handleAvailabilityToggle}
              disabled={isSavingAvailability}
              className={isSavingAvailability ? "rounded-2xl border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800" : (isAvailable ? "rounded-2xl bg-rose-600 text-white hover:bg-rose-500" : "rounded-2xl bg-emerald-600 text-white hover:bg-emerald-500")}
            >
              {isSavingAvailability ? "Saving..." : isAvailable ? "Set Unavailable" : "Set Available"}
            </Button>
          </div>
        </CardContent>
        {availabilityNotice && (
          <CardContent className="pt-0">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 text-sm text-zinc-300">
              {availabilityNotice}
            </div>
          </CardContent>
        )}
        {availabilityError && (
          <CardContent className="pt-0">
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              {availabilityError}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

export default function DashboardPage() {
  const { token, role, coordinates } = useUser()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <main className="dark min-h-screen bg-zinc-950 p-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] text-zinc-100 md:p-8 md:pb-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Navbar />

        {role === "worker" ? <WorkerDashboard /> : <ClientDashboard coordinates={coordinates} />}
      </div>
    </main>
  )
}
