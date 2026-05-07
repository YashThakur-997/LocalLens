import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useUser } from "@/context/UserContext"
import api from "@/lib/api"
import Navbar from "@/pages/navbar"

const statusStyles = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  accepted: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  completion_pending: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  completed: "border-green-500/30 bg-green-500/10 text-green-300",
  cancelled: "border-rose-500/30 bg-rose-500/10 text-rose-300",
}

export default function BookingsPage() {
  const { token, role } = useUser()
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleMarkNotComplete = async (bookingId) => {
    try {
      await api.post(`/job/mark-not-complete/${bookingId}`)
      setError("")
      // Reload bookings after marking as not complete
      const response = await api.get("/job/client-bookings")
      setBookings(response.data.bookings ?? [])
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to mark as not complete.")
    }
  }

  const handleReviewClick = (booking) => {
    setSelectedBooking(booking)
    setRating(5)
    setComment("")
    setShowReviewModal(true)
  }

  const handleSubmitReview = async () => {
    if (!selectedBooking) return

    try {
      setIsSubmitting(true)
      await api.post("/job/verify-and-rate", {
        jobId: selectedBooking._id,
        rating: parseInt(rating),
        comment: comment.trim(),
      })
      setError("")
      setShowReviewModal(false)
      // Reload bookings after submitting review
      const response = await api.get("/job/client-bookings")
      setBookings(response.data.bookings ?? [])
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to submit review.")
    } finally {
      setIsSubmitting(false)
    }
  }

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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                    <div className="flex flex-col gap-2 sm:items-end">
                      <Badge className={statusStyles[booking.status] ?? statusStyles.pending}>
                        {booking.status.toUpperCase().replace(/_/g, " ")}
                      </Badge>
                      {booking.status === "completion_pending" && (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
                            onClick={() => handleReviewClick(booking)}
                          >
                            Review & Confirm
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800"
                            onClick={() => handleMarkNotComplete(booking._id)}
                          >
                            Not Complete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="rounded-2xl border-zinc-800 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Review & Confirm Completion</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Rate your experience with {selectedBooking?.worker?.username ?? "the worker"} and confirm job completion.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-colors ${
                      star <= rating ? "text-yellow-400" : "text-zinc-600"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500">{rating} out of 5 stars</p>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">Comment (optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                className="min-h-[80px] rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                className="flex-1 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
                onClick={handleSubmitReview}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Confirm & Submit Review"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800"
                onClick={() => setShowReviewModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}