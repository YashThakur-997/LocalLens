import { useEffect } from "react"
import { Navigate } from "react-router-dom"

import { useUser } from "@/context/UserContext"

export default function LogoutPage() {
  const { token, setToken } = useUser()

  useEffect(() => {
    if (token) {
      setToken("")
    }
  }, [setToken, token])

  return <Navigate to="/login" replace />
}
