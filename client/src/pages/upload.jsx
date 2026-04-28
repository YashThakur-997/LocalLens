import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { ImagePlus, UploadCloud } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { useUser } from "@/context/UserContext"
import Navbar from "@/pages/navbar"

export default function UploadPage() {
	const { token, role } = useUser()
	const [title, setTitle] = useState("")
	const [category, setCategory] = useState("repair")
	const [location, setLocation] = useState("")
	const [mediaFile, setMediaFile] = useState(null)
	const [mediaPreviewUrl, setMediaPreviewUrl] = useState("")
	const [mediaType, setMediaType] = useState("")
	const [status, setStatus] = useState("idle")

	useEffect(() => {
		return () => {
			if (mediaPreviewUrl) {
				URL.revokeObjectURL(mediaPreviewUrl)
			}
		}
	}, [mediaPreviewUrl])

	if (!token) {
		return <Navigate to="/login" replace />
	}

	// Only workers can access the upload page
	if (role !== "worker") {
		return <Navigate to="/dashboard" replace />
	}

	const handleSubmit = (event) => {
		event.preventDefault()

		if (!title || !location || !mediaFile) {
			return
		}

		setStatus("success")
		setTitle("")
		setCategory("repair")
		setLocation("")

		if (mediaPreviewUrl) {
			URL.revokeObjectURL(mediaPreviewUrl)
		}

		setMediaFile(null)
		setMediaPreviewUrl("")
		setMediaType("")
	}

	const handleMediaChange = (event) => {
		const file = event.target.files?.[0]

		if (!file) {
			return
		}

		if (mediaPreviewUrl) {
			URL.revokeObjectURL(mediaPreviewUrl)
		}

		setMediaFile(file)
		setMediaType(file.type.startsWith("video/") ? "video" : "image")
		setMediaPreviewUrl(URL.createObjectURL(file))
	}

	return (
		<main className="dark min-h-screen bg-zinc-950 p-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] text-zinc-100 md:p-8 md:pb-8">
			<div className="mx-auto max-w-3xl space-y-6">
				<Navbar />

				<Card className="rounded-2xl border-zinc-800 bg-zinc-900/80 text-zinc-100">
					<CardHeader>
						<CardTitle className="text-2xl">Upload</CardTitle>
						<CardDescription className="text-zinc-400">
							Add a new work update, issue image, or job proof.
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-4">
						<p className="text-sm text-zinc-300">
							Active mode: <span className="capitalize text-zinc-100">{role}</span>
						</p>

						<Drawer>
							<DrawerTrigger asChild>
								<Button className="w-full rounded-2xl bg-indigo-600 text-white hover:bg-indigo-500">
									<ImagePlus className="size-4" />
									Open Upload Drawer
								</Button>
							</DrawerTrigger>

							<DrawerContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
								<DrawerHeader className="text-left">
									<DrawerTitle>New Upload</DrawerTitle>
									<DrawerDescription className="text-zinc-400">
										Fill in the details below and publish your upload.
									</DrawerDescription>
								</DrawerHeader>

								<form onSubmit={handleSubmit} className="space-y-3 px-4 pb-2">
									<Input
										placeholder="Title (e.g., Fan capacitor replaced)"
										value={title}
										onChange={(event) => setTitle(event.target.value)}
										className="rounded-2xl border-zinc-800"
									/>

									<select
										value={category}
										onChange={(event) => setCategory(event.target.value)}
										className="h-10 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700"
									>
										<option value="repair">Repair</option>
										<option value="installation">Installation</option>
										<option value="inspection">Inspection</option>
									</select>

									<Input
										placeholder="Location"
										value={location}
										onChange={(event) => setLocation(event.target.value)}
										className="rounded-2xl border-zinc-800"
									/>

									<div className="space-y-2">
										<Input
											type="file"
											accept="image/*,video/*"
											onChange={handleMediaChange}
											className="rounded-2xl border-zinc-800 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-1 file:text-xs file:text-zinc-100"
										/>
										<p className="text-xs text-zinc-400">Upload an image or video for this post.</p>

										{mediaPreviewUrl && mediaType === "image" && (
											<div className="overflow-hidden rounded-xl border border-zinc-800">
												<img src={mediaPreviewUrl} alt="Selected upload preview" className="max-h-48 w-full object-cover" />
											</div>
										)}

										{mediaPreviewUrl && mediaType === "video" && (
											<div className="overflow-hidden rounded-xl border border-zinc-800">
												<video src={mediaPreviewUrl} controls className="max-h-48 w-full bg-black" />
											</div>
										)}
									</div>

									<Button type="submit" className="w-full rounded-2xl bg-emerald-600 text-white hover:bg-emerald-500">
										<UploadCloud className="size-4" />
										Submit Upload
									</Button>
								</form>

								<DrawerFooter>
									<DrawerClose asChild>
										<Button variant="outline" className="rounded-2xl border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800">
											Cancel
										</Button>
									</DrawerClose>
								</DrawerFooter>
							</DrawerContent>
						</Drawer>

						{status === "success" && (
							<div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
								Upload submitted successfully.
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</main>
	)
}
