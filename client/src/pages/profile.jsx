import { Grid3X3, MapPin, Settings, Camera } from "lucide-react"
import { useState, useEffect } from "react"
import { Navigate, useNavigate } from "react-router-dom"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/context/UserContext"
import api from "@/lib/api"
import { reverseGeocode } from "@/lib/location"
import WorkerPostGrid from "@/components/work/WorkerPostGrid"
import PostModal from "@/components/work/PostModal"
import Navbar from "@/pages/navbar"

function ProfileStat({ label, value }) {
	return (
		<div className="text-center">
			<p className="text-base font-semibold text-zinc-100 sm:text-lg">{value}</p>
			<p className="text-xs text-zinc-400 sm:text-sm">{label}</p>
		</div>
	)
}

export default function ProfilePage() {
	const { token, role, coordinates } = useUser()
	const navigate = useNavigate()
	const [profile, setProfile] = useState(null)
	const [isLoadingProfile, setIsLoadingProfile] = useState(true)
	const [profileError, setProfileError] = useState("")
	const [workerPosts, setWorkerPosts] = useState([])
	const [viewerIndex, setViewerIndex] = useState(-1)
	const [postsLoading, setPostsLoading] = useState(false)
	const [postsError, setPostsError] = useState("")
	const [openSettings, setOpenSettings] = useState(false)
	const [settingsEmail, setSettingsEmail] = useState("")
	const [currentPassword, setCurrentPassword] = useState("")
	const [newPassword, setNewPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [saveStatus, setSaveStatus] = useState("")
	const [locationName, setLocationName] = useState("Location not available")
	const [profilePictureUrl, setProfilePictureUrl] = useState("")
	const [profilePictureLoading, setProfilePictureLoading] = useState(false)
	const [profilePictureError, setProfilePictureError] = useState("")

	if (!token) {
		return <Navigate to="/login" replace />
	}

	useEffect(() => {
		let isMounted = true

		const loadProfile = async () => {
			try {
				setIsLoadingProfile(true)
				setProfileError("")

				const response = await api.get("/auth/me")

				if (!isMounted) {
					return
				}

				setProfile(response.data.user)
				setSettingsEmail(response.data.user?.email ?? "")
				setProfilePictureUrl(response.data.user?.profilePictureUrl ?? "")
			} catch (requestError) {
				if (isMounted) {
					setProfileError(
						requestError?.response?.data?.message ||
						"Unable to load profile details from the backend."
					)
				}
			} finally {
				if (isMounted) {
					setIsLoadingProfile(false)
				}
			}
		}

		loadProfile()

		return () => {
			isMounted = false
		}
	}, [])

	const profileRole = profile?.role ?? role
	const displayName = profile?.username ?? (profileRole === "worker" ? "Raj Verma" : "Priya Sharma")
	const showPostsSection = profileRole === "worker"
	const showStatsSection = profileRole === "worker"
	const workerRating = Number(profile?.workerProfile?.rating ?? 0).toFixed(1)
	const workerJobsCompleted = profile?.workerProfile?.jobsCompleted ?? 0
	const workerPostsCount = workerPosts.length
	const locationCoordinates = profile?.location?.coordinates

	useEffect(() => {
		let isMounted = true

		const loadWorkerPosts = async () => {
			if (profileRole !== "worker") {
				setWorkerPosts([])
				setPostsError("")
				setPostsLoading(false)
				return
			}

			try {
				setPostsLoading(true)
				setPostsError("")

				const response = await api.get("/posts/me")

				if (isMounted) {
					setWorkerPosts(response.data.posts ?? [])
				}
			} catch (requestError) {
				if (isMounted) {
					setPostsError(requestError?.response?.data?.message || "Unable to load posts right now.")
					setWorkerPosts([])
				}
			} finally {
				if (isMounted) {
					setPostsLoading(false)
				}
			}
		}

		loadWorkerPosts()

		return () => {
			isMounted = false
		}
	}, [profileRole])

	useEffect(() => {
		let isMounted = true

		const resolveLocation = async () => {
			if (locationCoordinates?.length === 2) {
				const resolved = await reverseGeocode({
					latitude: locationCoordinates[1],
					longitude: locationCoordinates[0],
				})

				if (isMounted) {
					setLocationName(resolved)
				}
				return
			}

			if (coordinates?.latitude && coordinates?.longitude) {
				const resolved = await reverseGeocode({
					latitude: coordinates.latitude,
					longitude: coordinates.longitude,
				})

				if (isMounted) {
					setLocationName(resolved)
				}
				return
			}

			if (isMounted) {
				setLocationName("Location not available")
			}
		}

		resolveLocation()

		return () => {
			isMounted = false
		}
	}, [locationCoordinates, coordinates])

	const handleProfilePictureUpload = async (event) => {
		const file = event.target.files?.[0]
		if (!file) return

		try {
			setProfilePictureLoading(true)
			setProfilePictureError("")

			const formData = new FormData()
			formData.append("profilePicture", file)

			const response = await api.post("/auth/me/profile-picture", formData, {
				headers: { "Content-Type": "multipart/form-data" }
			})

			setProfilePictureUrl(response.data.profilePictureUrl)
		} catch (requestError) {
			setProfilePictureError(
				requestError?.response?.data?.message || "Failed to upload profile picture"
			)
		} finally {
			setProfilePictureLoading(false)
		}
	}

	return (
		<main className="dark min-h-screen bg-zinc-950 p-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] text-zinc-100 md:p-8 md:pb-8">
			<div className="mx-auto max-w-4xl space-y-5">
				<Navbar />

				<section className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-6">
					<div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
						<div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
							<div className="rounded-full bg-linear-to-tr from-yellow-500 via-pink-500 to-orange-500 p-1 relative">
								<div className="rounded-full bg-zinc-950 p-1">
									<Avatar className="size-20 sm:size-24">
										<AvatarImage src={profilePictureUrl || "https://ui-avatars.com/api/?name=User&background=3f3f46&color=ffffff&bold=true"} alt={displayName} />
										<AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
									</Avatar>
								</div>
								<label className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2 cursor-pointer hover:bg-indigo-500">
									<Camera className="size-4 text-white" />
									<input type="file" accept="image/*" onChange={handleProfilePictureUpload} disabled={profilePictureLoading} className="hidden" />
								</label>
							</div>

							<div className="space-y-2">
								<h1 className="text-xl font-semibold sm:text-2xl">{displayName}</h1>
								<p className="text-sm text-zinc-400">
									{profileRole === "worker" ? "Verified Electrician" : "Home Services Client"}
								</p>
								<p className="inline-flex items-center gap-1 text-xs text-zinc-500 sm:text-sm">
									<MapPin className="size-3.5" />
									{locationName}
								</p>
								{profilePictureError && (
									<p className="text-xs text-rose-400">{profilePictureError}</p>
								)}
								{profilePictureLoading && (
									<p className="text-xs text-zinc-400">Uploading...</p>
								)}
							</div>
						</div>

						<div className="space-y-3 sm:text-right">
							{profileError && (
								<div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
									{profileError}
								</div>
							)}

							{isLoadingProfile ? (
								<div className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-3 text-sm text-zinc-400">
									Loading profile details...
								</div>
							) : (
								<div className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 sm:grid-cols-2">
									<div>
										<p className="text-xs uppercase tracking-wide text-zinc-500">Email</p>
										<p className="text-sm text-zinc-100">{profile?.email ?? "Not available"}</p>
									</div>
									<div>
										<p className="text-xs uppercase tracking-wide text-zinc-500">Phone</p>
										<p className="text-sm text-zinc-100">{profile?.phone ?? "Not available"}</p>
									</div>
									<div>
										<p className="text-xs uppercase tracking-wide text-zinc-500">Role</p>
										<p className="text-sm text-zinc-100 capitalize">{profileRole}</p>
									</div>
									<div>
										<p className="text-xs uppercase tracking-wide text-zinc-500">Joined</p>
										<p className="text-sm text-zinc-100">
											{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Not available"}
										</p>
									</div>
								</div>
							)}

							<div className="flex w-full gap-2 sm:w-auto sm:justify-end">
								<Button variant="outline" className="flex-1 rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800 sm:flex-none">
									Edit Profile
								</Button>
								<Button variant="outline" className="flex-1 rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800 sm:flex-none">
									View Archive
								</Button>

								<Dialog open={openSettings} onOpenChange={setOpenSettings}>
									<DialogTrigger asChild>
										<Button variant="outline" className="rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800" size="icon">
											<Settings />
											<span className="sr-only">Settings</span>
										</Button>
									</DialogTrigger>

									<DialogContent>
										<DialogHeader>
											<DialogTitle>Account Settings</DialogTitle>
											<DialogDescription>Change email, update password, or log out.</DialogDescription>
										</DialogHeader>

										<div className="grid gap-2">
											<label className="text-xs text-zinc-400">Email</label>
											<Input value={settingsEmail} onChange={(e) => setSettingsEmail(e.target.value)} placeholder="you@example.com" />

											<label className="text-xs text-zinc-400">Current password</label>
											<Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" />

											<label className="text-xs text-zinc-400">New password</label>
											<Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />

											<label className="text-xs text-zinc-400">Confirm new password</label>
											<Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />

											{saveStatus && <p className="text-sm text-emerald-200">{saveStatus}</p>}
										</div>

										<DialogFooter>
											<Button
												onClick={() => {
												// basic client-side validation
												if (newPassword && newPassword !== confirmPassword) {
													setSaveStatus("New passwords do not match")
													return
												}
												// TODO: call real API to update credentials
												setSaveStatus("Changes saved (UI only)")
											}}
											className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
											>
												Save changes
											</Button>
											<Button
												variant="outline"
												className="rounded-xl border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800"
												onClick={() => {
												setOpenSettings(false)
											}}
											>
												Close
											</Button>
											<Button
												variant="destructive"
												className="rounded-xl bg-red-600 text-white hover:bg-red-500"
												onClick={() => {
													setOpenSettings(false)
													navigate("/logout", { replace: true })
												}}
											>
												Log out
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							</div>
						</div>
					</div>

					{showStatsSection && (
						<div className="grid grid-cols-3 rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-3 sm:max-w-md">
							<ProfileStat label="Posts" value={workerPostsCount} />
							<ProfileStat label="Rating" value={workerRating} />
							<ProfileStat label="Jobs Completed" value={workerJobsCompleted} />
						</div>
					)}
				</section>

				{showPostsSection && (
					<Tabs defaultValue="posts" className="w-full">
						<TabsList
							variant="line"
							className="grid w-full grid-cols-3 rounded-none border-t border-zinc-800 px-0 pt-2"
						>
							<TabsTrigger value="posts" className="gap-2 text-zinc-400 data-active:text-zinc-100">
								<Grid3X3 className="size-4" />
								<span className="text-xs uppercase tracking-wide">Posts</span>
							</TabsTrigger>
							{/* <TabsTrigger value="saved" className="gap-2 text-zinc-400 data-active:text-zinc-100">
								<Bookmark className="size-4" />
								<span className="text-xs uppercase tracking-wide">Saved</span>
							</TabsTrigger>
							<TabsTrigger value="tagged" className="gap-2 text-zinc-400 data-active:text-zinc-100">
								<Tag className="size-4" />
								<span className="text-xs uppercase tracking-wide">Tagged</span>
							</TabsTrigger> */}
						</TabsList>

						<TabsContent value="posts" className="pt-4">
							{postsLoading ? (
								<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-400">
									Loading posts...
								</div>
							) : postsError ? (
								<div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
									{postsError}
								</div>
							) : (
								<>
									<WorkerPostGrid
										posts={workerPosts}
										emptyMessage="Your uploads will appear here once you publish them."
										onOpenPost={(idx) => setViewerIndex(idx)}
									/>
									{viewerIndex >= 0 && (
										<PostModal posts={workerPosts} index={viewerIndex} onClose={() => setViewerIndex(-1)} />
									)}
								</>
							)}
						</TabsContent>
					</Tabs>
				)}
			</div>
		</main>
	)
}
