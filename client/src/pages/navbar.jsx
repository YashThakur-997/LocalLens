import { Link, NavLink } from "react-router-dom"
import { Home, MessageCircle, Plus, User } from "lucide-react"
import { useUser } from "@/context/UserContext"

const navItemClass = ({ isActive }) =>
	[
		"rounded-xl border px-3 py-2 text-sm transition",
		isActive
			? "border-indigo-500 bg-indigo-600 text-white"
			: "border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800",
	].join(" ")

export default function Navbar() {
	const { role } = useUser()
	return (
		<>
			<header className="sticky top-0 z-30 hidden rounded-2xl border border-zinc-800 bg-zinc-950/90 px-3 py-3 backdrop-blur md:block md:px-5">
				<div className="flex items-center justify-between gap-3">
					<Link to="/dashboard" className="text-lg font-semibold tracking-tight text-zinc-100">
						LocalLens
					</Link>

					<nav className="flex items-center gap-2">
						<NavLink to="/dashboard" className={navItemClass}>
							Dashboard
						</NavLink>
						{role === "worker" && (
							<NavLink to="/upload" className={navItemClass}>
								Upload
							</NavLink>
						)}
						<NavLink to="/profile" className={navItemClass}>
							Profile
						</NavLink>
					</nav>
				</div>
			</header>
			<header className="sticky flex justify-between  top-2 z-30 md:hidden rounded-2xl border border-zinc-800 bg-zinc-950/90 px-3 py-3 backdrop-blur">
				<Link to="/dashboard" className="text-lg font-semibold tracking-tight text-zinc-100 my-auto">
					LocalLens
				</Link>
				<NavLink
					to="/messages"
					className={({ isActive }) =>
						[
							"flex min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition",
							isActive ? "text-indigo-400" : "text-zinc-400 hover:text-zinc-200",
						].join(" ")
					}
				>
					<MessageCircle className="size-5" />
					<span>Message</span>
				</NavLink>
			</header>

			<nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950 md:hidden my-0">
				<div className="mx-auto flex max-w-md items-center justify-around px-4 pt-2 pb-[env(safe-area-inset-bottom)]">
					<NavLink
						to="/dashboard"
						className={({ isActive }) =>
							[
								"flex min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition",
								isActive ? "text-indigo-400" : "text-zinc-400 hover:text-zinc-200",
							].join(" ")
						}
					>
						<Home className="size-5" />
						<span>Home</span>
					</NavLink>
					{role === "worker" && (
						<NavLink
							to="/upload"
							className={({ isActive }) =>
								[
									"flex min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition",
									isActive ? "text-indigo-400" : "text-zinc-400 hover:text-zinc-200",
								].join(" ")
							}
						>
							<Plus className="size-5" />
							<span>Upload</span>
						</NavLink>
					)}
					<NavLink
						to="/profile"
						className={({ isActive }) =>
							[
								"flex min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition",
								isActive ? "text-indigo-400" : "text-zinc-400 hover:text-zinc-200",
							].join(" ")
						}
					>
						<User className="size-5" />
						<span>Profile</span>
					</NavLink>
				</div>
			</nav>
		</>
	)
}
