import { createContext, useContext, useMemo, useState } from "react"

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [role, setRole] = useState("client")
  const [coordinates, setCoordinates] = useState(null)
  const [tokenState, setTokenState] = useState(
    () => localStorage.getItem("token") ?? ""
  )

  const setToken = (nextToken) => {
    setTokenState(nextToken)

    if (nextToken) {
      localStorage.setItem("token", nextToken)
      return
    }

    localStorage.removeItem("token")
  }

  const value = useMemo(
    () => ({
      role,
      setRole,
      coordinates,
      setCoordinates,
      token: tokenState,
      setToken,
    }),
    [role, coordinates, tokenState]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)

  if (!context) {
    throw new Error("useUser must be used inside UserProvider")
  }

  return context
}
