import { useState } from "react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"
import { LogOut, Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useUser } from "@/context/UserContext"

const navItemClass = ({ isActive }) =>
	[
		"rounded-xl border px-3 py-2 text-sm transition",
		isActive
			? "border-indigo-500 bg-indigo-600 text-white"
			: "border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800",
	].join(" ")

export default function Navbar() {
	const [mobileOpen, setMobileOpen] = useState(false)
	const navigate = useNavigate()
	const location = useLocation()
	const { setToken } = useUser()

	const handleLogout = () => {
		setToken("")
		setMobileOpen(false)
		navigate("/login", { replace: true })
	}

	const closeMobile = () => {
		setMobileOpen(false)
	}

	return (
		<header className="sticky top-0 z-30 rounded-2xl border border-zinc-800 bg-zinc-950/90 px-3 py-3 backdrop-blur md:px-5">
			<div className="flex items-center justify-between gap-3">
				<Link to="/dashboard" className="text-lg font-semibold tracking-tight text-zinc-100">
					SkillSnap
				</Link>

				<nav className="hidden items-center gap-2 md:flex">
					<NavLink to="/dashboard" className={navItemClass}>
						Dashboard
					</NavLink>
					<Button
						variant="outline"
						onClick={handleLogout}
						className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
					>
						<LogOut className="size-4" />
						Logout
					</Button>
				</nav>

				<Button
					type="button"
					variant="outline"
					onClick={() => setMobileOpen((open) => !open)}
					className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 md:hidden"
					aria-label="Toggle navigation menu"
					aria-expanded={mobileOpen}
					aria-controls="mobile-navigation"
				>
					{mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
				</Button>
			</div>

			{mobileOpen && (
				<nav id="mobile-navigation" className="mt-3 grid gap-2 md:hidden">
					<NavLink to="/dashboard" className={navItemClass} onClick={closeMobile}>
						Dashboard
					</NavLink>

					<Button
						variant="outline"
						onClick={handleLogout}
						className="justify-start rounded-xl border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
					>
						<LogOut className="size-4" />
						Logout
					</Button>
				</nav>
			)}

			{location.pathname !== "/dashboard" ? (
				<p className="mt-3 text-xs text-zinc-500 md:hidden">You are browsing outside dashboard.</p>
			) : null}
		</header>
	)
}
