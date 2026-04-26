import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useUser } from "@/context/UserContext"

export default function LoginPage() {
	const navigate = useNavigate()
	const { token, setToken } = useUser()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")

	if (token) {
		return <Navigate to="/dashboard" replace />
	}

	const handleSubmit = (event) => {
		event.preventDefault()

		if (!email || !password) {
			return
		}

		setToken(`demo-token-${Date.now()}`)
		navigate("/dashboard", { replace: true })
	}

	return (
		<main className="dark flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-zinc-100 md:p-8">
			<div className="w-full max-w-md">
				<Card className="rounded-2xl border-zinc-800 bg-zinc-900/80 text-zinc-100">
					<CardHeader>
						<CardTitle className="text-2xl">Login</CardTitle>
						<CardDescription className="text-zinc-400">
							Sign in to open your dashboard page.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-3">
							<Input
								type="email"
								placeholder="Email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								className="rounded-2xl border-zinc-800"
							/>
							<Input
								type="password"
								placeholder="Password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								className="rounded-2xl border-zinc-800"
							/>

							<Button type="submit" className="w-full rounded-2xl bg-indigo-600 text-white hover:bg-indigo-500">
								Login
							</Button>
						</form>

						<p className="mt-4 text-sm text-zinc-400">
							New user?{" "}
							<Link to="/signup" className="text-indigo-400 hover:text-indigo-300">
								Create account
							</Link>
						</p>
					</CardContent>
				</Card>
			</div>
		</main>
	)
}
