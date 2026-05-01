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

export default function RequestsPage() {
  const { token, role } = useUser()
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatingJobId, setUpdatingJobId] = useState("")

  const loadRequests = async () => {
    try {
      setIsLoading(true)
      setError("")

      const response = await api.get("/job/worker-requests")
      setRequests(response.data.requests ?? [])
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to load requests right now.")
      setRequests([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const handleStatusUpdate = async (jobId, action) => {
    const nextStatus = action === "accept" ? "accepted" : "cancelled"

    try {
      setUpdatingJobId(jobId)
      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request._id === jobId ? { ...request, status: nextStatus } : request
        )
      )
      await api.patch(`/job/worker-requests/${jobId}`, { action })
      await loadRequests()
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to update booking request.")
      await loadRequests()
    } finally {
      setUpdatingJobId("")
    }
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (role !== "worker") {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="dark min-h-screen bg-zinc-950 p-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] text-zinc-100 md:p-8 md:pb-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <Navbar />

        <Card className="rounded-2xl border-zinc-800 bg-zinc-900/80 text-zinc-100">
          <CardHeader>
            <CardTitle className="text-2xl">Requests</CardTitle>
            <CardDescription className="text-zinc-400">
              View the latest client requests and respond to new work.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-zinc-400">Loading requests...</p>
            ) : error ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                {error}
              </div>
            ) : requests.length === 0 ? (
              <p className="text-sm text-zinc-400">No pending requests.</p>
            ) : (
              requests.map((request) => (
                <div key={request._id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-zinc-100">
                        {request.client?.username ?? "Client request"}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {request.client?.phone ?? "Phone not available"}
                      </p>
                      <p className="text-sm text-zinc-400">Requested on {new Date(request.createdAt).toLocaleString()}</p>
                      <p className="text-xs text-zinc-500">Status: {request.status}</p>
                    </div>

                    <div className="flex flex-col gap-2 sm:items-end">
                      <Badge className={statusStyles[request.status] ?? statusStyles.pending}>
                        {request.status}
                      </Badge>
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
                            onClick={() => handleStatusUpdate(request._id, "accept")}
                            disabled={updatingJobId === request._id}
                          >
                            Accept
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800"
                            onClick={() => handleStatusUpdate(request._id, "reject")}
                            disabled={updatingJobId === request._id}
                          >
                            Reject
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
    </main>
  )
}