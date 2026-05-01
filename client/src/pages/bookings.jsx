import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUser } from "@/context/UserContext"
import api from "@/lib/api"
import Navbar from "@/pages/navbar"

const statusStyles = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  accepted: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  completed: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  cancelled: "border-rose-500/30 bg-rose-500/10 text-rose-300",
}

export default function BookingsPage() {
  const { token, role } = useUser()
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let isMounted = true

    const loadBookings = async () => {
      try {
        setIsLoading(true)
        setError("")

        const response = await api.get("/job/client-bookings")

        if (isMounted) {
          setBookings(response.data.bookings ?? [])
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError?.response?.data?.message || "Unable to load bookings right now.")
          setBookings([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadBookings()

    const refreshTimer = window.setInterval(() => {
      loadBookings()
    }, 15000)

    return () => {
      isMounted = false
      window.clearInterval(refreshTimer)
    }
  }, [])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (role !== "client") {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="dark min-h-screen bg-zinc-950 p-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] text-zinc-100 md:p-8 md:pb-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <Navbar />

        <Card className="rounded-2xl border-zinc-800 bg-zinc-900/80 text-zinc-100">
          <CardHeader>
            <CardTitle className="text-2xl">Bookings</CardTitle>
            <CardDescription className="text-zinc-400">
              Track your scheduled work and pending service confirmations.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-zinc-400">Loading bookings...</p>
            ) : error ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                {error}
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-sm text-zinc-400">No bookings yet.</p>
            ) : (
              bookings.map((booking) => (
                <div key={booking._id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-zinc-100">
                        {booking.worker?.username ?? "Worker"}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {booking.worker?.workerProfile?.category ?? "Service request"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Booked {new Date(booking.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge className={statusStyles[booking.status] ?? statusStyles.pending}>
                      {(booking.status ?? "pending").toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}