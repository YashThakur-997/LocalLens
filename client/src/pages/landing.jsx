import { Link } from "react-router-dom"
import { CheckCircle2, Camera, Star, Sparkles, ArrowRight, Users, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import GridBackgroundDemo from "@/components/aceternity/grid-background-demo"

export default function LandingPage() {
	const [scrollY, setScrollY] = useState(0)

	useEffect(() => {
		const handleScroll = () => setScrollY(window.scrollY)
		window.addEventListener("scroll", handleScroll)
		return () => window.removeEventListener("scroll", handleScroll)
	}, [])

	return (
		<div className="min-h-screen bg-linear-to-b from-zinc-950 via-zinc-900 to-zinc-950 overflow-hidden">
			<GridBackgroundDemo className="fixed inset-0 pointer-events-none z-0" />
			{/* Animated background elements */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-20 -left-40 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute bottom-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
			</div>
			{/* Navigation */}
			<nav className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950 backdrop-blur">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
					<Link to="/" className="text-2xl font-bold text-white">
						LocalLens
					</Link>
					<div className="flex gap-3">
						<Link
							to="/signup"
							className="hidden sm:block px-4 py-2 text-zinc-300 hover:text-white font-medium transition"
						>
							Sign Up
						</Link>
						<Link
							to="/login"
							className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
						>
							Login
						</Link>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-40">
				<div className="text-center space-y-8 mb-16">

					<h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight" style={{
						opacity: 1 - scrollY / 500,
						transform: `translateY(${scrollY * 0.3}px)`
					}}>
						Find Trusted Services <br />
						<span className="text-indigo-400">
							Near You
						</span>
					</h1>
					
					<p className="text-lg md:text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed">
						Stop guessing, start trusting. Every professional is verified through real completed work. See photos, videos, and authentic ratings before you commit.
					</p>

					<div className="hidden md:flex flex-col sm:flex-row gap-4 justify-center pt-8">
						<Link
							to="/login"
							className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold rounded-lg transition flex items-center justify-center gap-2"
						>
							Find Service <ArrowRight className="w-5 h-5" />
						</Link>
						<Link
							to="/login"
							className="px-8 py-4 border border-zinc-700 hover:border-zinc-500 text-white text-lg font-semibold rounded-lg transition bg-zinc-800 hover:bg-zinc-700"
						>
							Browse Services
						</Link>
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section className="py-20 md:py-28">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-20">
						<h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
							How It Works
						</h2>
						<p className="text-lg text-zinc-400 max-w-2xl mx-auto">
							Get connected with verified professionals in three simple steps
						</p>
					</div>

					<div className="relative">
						<div className="grid md:grid-cols-3 gap-8 md:gap-6">
                            {[
                                {
                                    number: "1",
                                    title: "Request Service",
                                    description: "Tell us what service you need, when, and where. Be specific about your requirements."
                                },
                                {
                                    number: "2",
                                    title: "Get Verified Worker",
                                    description: "Browse verified professionals with proof of past work. See photos, videos, and real ratings."
                                },
                                {
                                    number: "3",
                                    title: "Rate & Review",
                                    description: "After completion, share your experience and help the community find quality services."
                                }
                            ].map((step, i) => (
                                <div key={i} className="relative group">
                                    <div className="relative bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-lg p-8 h-full flex flex-col items-center text-center transition duration-300">
                                        <div className="w-16 h-16 bg-indigo-600 rounded-lg flex items-center justify-center mb-6 text-2xl font-bold text-white">
                                            {step.number}
                                        </div>
                                        <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                                        <p className="text-zinc-300 leading-relaxed">{step.description}</p>
                                        {/* connector handled by SVG above */}
                                    </div>
                                </div>
                            ))}
					    </div>
				    </div>
                </div>
			</section>

			{/* Why Trust Us Section */}
			<section className="py-20 md:py-28 relative">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-20">
						<h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
							Why Trust LocalLens
						</h2>
						<p className="text-lg text-zinc-400 max-w-2xl mx-auto">
							Built on transparency and real work proof
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						{[
							{
								icon: CheckCircle2,
								title: "Verified Jobs Only",
								description: "Every job and worker goes through our verification process. We ensure quality and authenticity before they're listed on our platform."
							},
							{
								icon: Camera,
								title: "Work Proof",
								description: "Workers share photos and videos of completed projects. See real results before booking and hold them accountable."
							},
							{
								icon: Star,
								title: "Real Ratings",
								description: "Ratings are based on actual completed work, not just promises. Every review is verified and authentic."
							}
						].map((feature, i) => {
							const Icon = feature.icon
							return (
								<div key={i} className="group">
									<div className="bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-lg p-8 h-full transition duration-300">
										<div className="flex items-start gap-4">
											<div className="shrink-0">
												<div className="flex items-center justify-center h-12 w-12 rounded-lg bg-zinc-700">
													<Icon className="w-6 h-6 text-indigo-400" />
												</div>
											</div>
											<div>
												<h3 className="text-xl font-semibold text-white mb-2">
													{feature.title}
												</h3>
												<p className="text-zinc-300 leading-relaxed">
													{feature.description}
												</p>
											</div>
										</div>
									</div>
								</div>
							)
						})}
					</div>
				</div>
			</section>

			{/* CTA Section */}
		<section className="hidden md:block py-20 md:py-28 border-t border-zinc-800">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
						Ready to find your perfect service?
					</h2>
					<p className="text-lg md:text-xl text-zinc-300 mb-10 leading-relaxed">
						Join thousands of users who've found trusted professionals. Experience the difference of verified work.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link
							to="/login"
							className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold rounded-lg transition flex items-center justify-center gap-2"
						>
							Get Started Now <ArrowRight className="w-5 h-5" />
						</Link>
						<Link
							to="/login"
							className="px-10 py-4 border border-zinc-700 hover:border-zinc-500 text-white text-lg font-semibold rounded-lg transition bg-zinc-800 hover:bg-zinc-700"
						>
							Browse Services
						</Link>
					</div>
				</div>
			</section>

			{/* Footer */}
		<footer className="hidden md:block border-t border-zinc-800 bg-zinc-900 py-12">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
						<div>
							<h3 className="text-white font-semibold mb-4">LocalLens</h3>
							<p className="text-zinc-400 text-sm">Find trusted services verified by real work.</p>
						</div>
						<div>
							<h4 className="text-white font-semibold mb-4">Product</h4>
							<ul className="space-y-2 text-sm text-zinc-400">
								<li><a href="#" className="hover:text-white transition">Features</a></li>
								<li><a href="#" className="hover:text-white transition">FAQ</a></li>
							</ul>
						</div>
						<div>
							<h4 className="text-white font-semibold mb-4">Legal</h4>
							<ul className="space-y-2 text-sm text-zinc-400">
								<li><a href="#" className="hover:text-white transition">Privacy</a></li>
								<li><a href="#" className="hover:text-white transition">Terms</a></li>
								<li><a href="#" className="hover:text-white transition">Security</a></li>
							</ul>
						</div>
					</div>
					<div className="border-t border-zinc-800 pt-8 flex flex-col sm:flex-row items-center justify-between">
						<p className="text-zinc-400 text-sm">&copy; 2026 LocalLens. All rights reserved.</p>
						<div className="flex gap-6 mt-4 sm:mt-0">
							<a href="#" className="text-zinc-400 hover:text-white transition">
								Twitter
							</a>
							<a href="#" className="text-zinc-400 hover:text-white transition">
								LinkedIn
							</a>
							<a href="#" className="text-zinc-400 hover:text-white transition">
								Facebook
							</a>
						</div>
					</div>
				</div>
			</footer>

			{/* Mobile sticky CTA */}
			<div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950 border-t border-zinc-800 backdrop-blur md:hidden">
				<Link
					to="/login"
					className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
				>
					Find Service Now <ArrowRight className="w-4 h-4" />
				</Link>
			</div>
		</div>
	)
}
