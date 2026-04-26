import { Navigate, Route, Routes } from "react-router-dom"

import { useUser } from "@/context/UserContext"
import LoginPage from "@/pages/auth/login"
import SignupPage from "@/pages/auth/signup"
import DashboardPage from "@/pages/dashboard"

function ProtectedRoute({ children }) {
  const { token } = useUser()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App