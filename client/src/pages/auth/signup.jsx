import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/context/UserContext"

function SignupForm({ role }) {
	const navigate = useNavigate()
	const { setRole, setCoordinates, setToken } = useUser()
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [locationStatus, setLocationStatus] = useState("Location not detected")

	const detectLocation = () => {
		if (!navigator.geolocation) {
			setLocationStatus("Geolocation not supported")
			return
		}

		setLocationStatus("Detecting location...")
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const nextCoordinates = {
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				}

				setCoordinates(nextCoordinates)
				setLocationStatus(
					`Saved ${nextCoordinates.latitude.toFixed(4)}, ${nextCoordinates.longitude.toFixed(4)}`
				)
			},
			() => {
				setLocationStatus("Unable to detect location")
			}
		)
	}

	const handleSubmit = (event) => {
		event.preventDefault()

		if (!name || !email || !password) {
			return
		}

		setRole(role)
		setToken(`demo-token-${role}-${Date.now()}`)
		navigate("/dashboard", { replace: true })
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-3">
			<Input
				placeholder={role === "worker" ? "Worker name" : "Client name"}
				value={name}
				onChange={(event) => setName(event.target.value)}
				className="rounded-2xl border-zinc-800"
			/>
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

			<div className="space-y-2">
				<Button
					type="button"
					variant="outline"
					className="w-full rounded-2xl border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
					onClick={detectLocation}
				>
					Detect Location
				</Button>
				<p className="text-xs text-zinc-400">{locationStatus}</p>
			</div>

			<Button type="submit" className="w-full rounded-2xl bg-indigo-600 text-white hover:bg-indigo-500">
				Continue as {role}
			</Button>
		</form>
	)
}

export default function SignupPage() {
	const { token } = useUser()

	if (token) {
		return <Navigate to="/dashboard" replace />
	}

	return (
		<main className="dark flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-zinc-100 md:p-8">
			<div className="mx-auto max-w-md">
				<Card className="rounded-2xl border-zinc-800 bg-zinc-900/80 text-zinc-100">
					<CardHeader>
						<CardTitle className="text-2xl">Sign Up</CardTitle>
						<CardDescription className="text-zinc-400">
							Create your account as Client or Worker.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<Tabs defaultValue="client" className="w-full gap-4">
							<TabsList className="w-full rounded-2xl bg-zinc-950/80">
								<TabsTrigger value="client" className="rounded-xl data-active:bg-zinc-800">
									Client
								</TabsTrigger>
								<TabsTrigger value="worker" className="rounded-xl data-active:bg-zinc-800">
									Worker
								</TabsTrigger>
							</TabsList>

							<TabsContent value="client">
								<SignupForm role="client" />
							</TabsContent>
							<TabsContent value="worker">
								<SignupForm role="worker" />
							</TabsContent>
						</Tabs>

						<p className="text-sm text-zinc-400">
							Already have an account?{" "}
							<Link to="/login" className="text-indigo-400 hover:text-indigo-300">
								Login
							</Link>
						</p>
					</CardContent>
				</Card>
			</div>
		</main>
	)
}
