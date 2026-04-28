import { useEffect, useMemo, useState } from "react"
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

  useEffect(() => {
    let isMounted = true

    const loadWorkers = async () => {
      try {
        setIsLoading(true)
        setError("")

        const response = await api.get("/auth/workers", {
          params: {
            q: searchQuery,
            category,
            availability,
            minRating,
          },
        })

        if (isMounted) {
          setWorkers(response.data.workers ?? [])
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError?.response?.data?.message ||
              "Unable to load workers right now."
          )
          setWorkers([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    const debounceTimer = window.setTimeout(() => {
      loadWorkers()
    }, 250)

    return () => {
      isMounted = false
      window.clearTimeout(debounceTimer)
    }
  }, [searchQuery, category, availability, minRating])

  const resultCountLabel = useMemo(() => {
    return isLoading ? "Searching workers..." : `${workers.length} workers found`
  }, [isLoading, workers.length])

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
          <CardTitle className="text-2xl">Find a Worker</CardTitle>
          <CardDescription className="text-zinc-400">
            Search electricians, filter by category and availability, then open a profile card.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Search by name or category"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="rounded-2xl border-zinc-800"
            />

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700"
            >
              <option value="all">All categories</option>
              <option value="repair">Repair</option>
              <option value="installation">Installation</option>
              <option value="inspection">Inspection</option>
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

          <div className="flex items-center justify-between gap-3 text-sm text-zinc-400">
            <p>{resultCountLabel}</p>
            <p>Area is resolved from worker location</p>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              {error}
            </div>
          )}
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

        {!isLoading && workers.length === 0 && !error && (
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

  return (
    <div className="space-y-4">
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

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAvailable((current) => !current)}
            className="rounded-2xl border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800"
          >
            {isAvailable ? "Set Unavailable" : "Set Available"}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-zinc-800 bg-zinc-900/80 text-zinc-100">
        <CardHeader>
          <CardTitle>Incoming Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-300">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            <p className="text-zinc-100">Switch board sparking</p>
            <p className="text-zinc-400">Green Park, 1.2 km away</p>
            <p className="text-zinc-400">Client: +91 90000 12345</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            <p className="text-zinc-100">Fan not rotating</p>
            <p className="text-zinc-400">Sector 18, 2.1 km away</p>
            <p className="text-zinc-400">Client: +91 91111 54321</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-zinc-800 bg-zinc-900/80 text-zinc-100">
        <CardHeader>
          <CardTitle>Active Jobs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-300">
          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            <div>
              <p className="text-zinc-100">Wiring issue - Block C</p>
              <p className="text-zinc-400">Started 20 minutes ago</p>
            </div>
            <Badge className="border-blue-500/40 bg-blue-500/15 text-blue-300">In Progress</Badge>
          </div>
        </CardContent>
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
