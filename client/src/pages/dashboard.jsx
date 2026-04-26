import { Navigate } from "react-router-dom"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUser } from "@/context/UserContext"
import Navbar from "@/pages/navbar"

export default function DashboardPage() {
  const { token, role, coordinates } = useUser()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <main className="dark min-h-screen bg-zinc-950 p-4 text-zinc-100 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Navbar />

        <Card className="rounded-2xl border-zinc-800 bg-zinc-900/80 text-zinc-100">
          <CardHeader>
            <CardTitle className="text-2xl">Dashboard</CardTitle>
            <CardDescription className="text-zinc-400">
              You are now on a separate protected page after login.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            <p>Role: {role}</p>
            <p>
              Coordinates: {coordinates
                ? `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`
                : "Not detected"}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
