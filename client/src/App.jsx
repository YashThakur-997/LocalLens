import { Navigate, Route, Routes } from "react-router-dom"

import { useUser } from "@/context/UserContext"
import LoginPage from "@/pages/auth/login"
import LogoutPage from "@/pages/auth/logout"
import SignupPage from "@/pages/auth/signup"
import DashboardPage from "@/pages/dashboard"
import ProfilePage from "@/pages/profile"
import UploadPage from "@/pages/upload"
import BookingsPage from "@/pages/bookings"
import RequestsPage from "@/pages/requests"
import WorkerProfilePage from "@/pages/worker-profile"

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
      <Route path="/logout" element={<LogoutPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workers/:workerId"
        element={
          <ProtectedRoute>
            <WorkerProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <UploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <BookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <RequestsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App