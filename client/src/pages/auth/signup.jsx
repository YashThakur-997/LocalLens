import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/context/UserContext"
import api from "@/lib/api"
import { reverseGeocode } from "@/lib/location"
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"

function LocationClickPicker({ selectedPoint, onPick }) {
	useMapEvents({
		click(event) {
			onPick({
				latitude: event.latlng.lat,
				longitude: event.latlng.lng,
			})
		},
	})

	if (!selectedPoint) {
		return null
	}

	return (
		<CircleMarker
			center={[selectedPoint.latitude, selectedPoint.longitude]}
			radius={9}
			pathOptions={{
				color: "#f59e0b",
				fillColor: "#f59e0b",
				fillOpacity: 0.85,
				weight: 2,
			}}
		/>
	)
}

function SignupForm({ role }) {
	const navigate = useNavigate()
	const { setRole, setCoordinates, setToken, coordinates } = useUser()
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [phone, setPhone] = useState("")
	const [password, setPassword] = useState("")
	const [category, setCategory] = useState("electrician")
	const [locationStatus, setLocationStatus] = useState("Location not detected")
	const [showMapPicker, setShowMapPicker] = useState(false)
	const [pickedLocation, setPickedLocation] = useState(null)
	const [error, setError] = useState("")
	const [isSubmitting, setIsSubmitting] = useState(false)

	const detectLocation = () => {
		if (!navigator.geolocation) {
			setLocationStatus("Geolocation not supported")
			return
		}

		setLocationStatus("Detecting location...")
		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const nextCoordinates = {
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				}

				setCoordinates(nextCoordinates)
				const locationName = await reverseGeocode(nextCoordinates)
				setLocationStatus(`Saved ${locationName}`)
			},
			() => {
				setShowMapPicker(true)
				setLocationStatus("Auto-detect failed. Pick your location on the map.")
			}
		)
	}

	const applyPickedLocation = async () => {
		if (!pickedLocation) {
			setError("Pick a location on the map first.")
			return false
		}

		setCoordinates(pickedLocation)
		setError("")
		setLocationStatus("Location saved from map selection")

		const locationName = await reverseGeocode(pickedLocation)
		setLocationStatus(`Saved ${locationName}`)

		return true
	}

	// Promise-based geolocation helper so we can await it on submit
	const getCurrentPositionAsync = () =>
		new Promise((resolve, reject) => {
			if (!navigator.geolocation) {
				reject(new Error("Geolocation not supported"))
				return
			}

			navigator.geolocation.getCurrentPosition(
				(position) => resolve(position),
				(err) => reject(err),
				{ enableHighAccuracy: true, timeout: 10000 }
			)
		})

	const handleSubmit = async (event) => {
		event.preventDefault()

		if (!name || !email || !phone || !password) {
			return
		}

		if (role === "worker" && !category) {
			setError("Please select a category for the worker profile.")
			return
		}

		let resolvedCoordinates = coordinates

		if (!resolvedCoordinates && showMapPicker && pickedLocation) {
			const manualApplied = await applyPickedLocation()

			if (!manualApplied) {
				return
			}

			resolvedCoordinates = pickedLocation
		}

		// If coordinates aren't already set, attempt to auto-detect here
		if (!resolvedCoordinates) {
			setLocationStatus("Detecting location...")
			try {
				const pos = await getCurrentPositionAsync()
				const nextCoordinates = {
					latitude: pos.coords.latitude,
					longitude: pos.coords.longitude,
				}
				setCoordinates(nextCoordinates)
				resolvedCoordinates = nextCoordinates
				const locationName = await reverseGeocode(nextCoordinates)
				setLocationStatus(`Saved ${locationName}`)
			} catch (err) {
				setShowMapPicker(true)
				setError("Unable to detect location. Pick your point on the map instead.")
				setLocationStatus("Auto-detect failed. Pick your location on the map.")
				return
			}
		}

		setError("")
		setIsSubmitting(true)

		const payload = {
			username: name,
			email,
			password,
			phone,
			role,
			...(role === "worker"
				? { workerProfile: { category } }
				: {}),
			location: {
				type: "Point",
				coordinates: [resolvedCoordinates.longitude, resolvedCoordinates.latitude],
			},
		}

		try {
			await api.post("/auth/signup", payload)

			const loginResponse = await api.post("/auth/login", { email, password })
			setRole(loginResponse.data.role ?? role)
			setToken(loginResponse.data.token)
			navigate("/dashboard", { replace: true })
		} catch (requestError) {
			setError(
				requestError?.response?.data?.message ||
				requestError?.response?.data ||
				"Signup failed. Please check your details and try again."
			)
		} finally {
			setIsSubmitting(false)
		}
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
				type="tel"
				placeholder="Phone number"
				value={phone}
				onChange={(event) => setPhone(event.target.value)}
				className="rounded-2xl border-zinc-800"
			/>
			<Input
				type="password"
				placeholder="Password"
				value={password}
				onChange={(event) => setPassword(event.target.value)}
				className="rounded-2xl border-zinc-800"
			/>

			{role === "worker" && (
				<select
					value={category}
					onChange={(event) => setCategory(event.target.value)}
					className="h-10 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700"
				>
					<option value="electrician">Electrician</option>
					<option value="plumber">Plumber</option>
					<option value="carpenter">Carpenter</option>
					<option value="painter">Painter</option>
					<option value="mechanic">Mechanic</option>
					<option value="handyman">Handyman</option>
				</select>
			)}

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

			{showMapPicker && (
				<div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
					<div className="space-y-1">
						<p className="text-sm font-medium text-zinc-100">Pick your location on the map</p>
						<p className="text-xs text-zinc-400">
							Tap anywhere on the map to place your point, then continue signup.
						</p>
					</div>
					<div className="overflow-hidden rounded-2xl border border-zinc-800">
						<MapContainer
							center={pickedLocation ? [pickedLocation.latitude, pickedLocation.longitude] : [20.5937, 78.9629]}
							zoom={pickedLocation ? 14 : 5}
							className="h-72 w-full"
							scrollWheelZoom
						>
							<TileLayer
								url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
								attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
							/>
							<LocationClickPicker
								selectedPoint={pickedLocation}
								onPick={(nextPoint) => {
									setPickedLocation(nextPoint)
									setCoordinates(nextPoint)
									setError("")
									setLocationStatus("Map point selected. Save to continue.")
								}}
							/>
						</MapContainer>
					</div>
					{pickedLocation && (
						<p className="text-xs text-zinc-400">
							Selected point: {pickedLocation.latitude.toFixed(5)}, {pickedLocation.longitude.toFixed(5)}
						</p>
					)}
					<Button
						type="button"
						variant="outline"
						className="w-full rounded-2xl border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
						onClick={applyPickedLocation}
						disabled={!pickedLocation}
					>
						Use selected map point
					</Button>
				</div>
			)}

			{error && <p className="text-sm text-red-300">{error}</p>}

			<Button
				type="submit"
				disabled={isSubmitting}
				className="w-full rounded-2xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
			>
				{isSubmitting ? "Creating account..." : `Continue as ${role}`}
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
