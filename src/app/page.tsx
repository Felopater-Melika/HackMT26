import auth from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Scan, Shield, Brain, Heart } from "lucide-react";
export const metadata: Metadata = {
	title: "Cliniq Care - AI-Powered Medication Safety Analysis",
	description:
		"Get personalized medication safety analysis powered by AI. Scan your medications, check for interactions, and receive tailored health recommendations based on your medical conditions.",
	openGraph: {
		title: "Cliniq Care - AI-Powered Medication Safety Analysis",
		description:
			"Get personalized medication safety analysis powered by AI. Scan your medications, check for interactions, and receive tailored health recommendations.",
		images: ["/og-image.png"],
	},
};

const ENABLE_AUTO_REDIRECT = true;

export default async function Home() {
	if (ENABLE_AUTO_REDIRECT) {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (session) {
			redirect("/app");
		}
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Gradient mesh background */}
			<div className="pointer-events-none fixed inset-0 overflow-hidden">
				<div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10" />
				<div className="absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-500/10" />
				<div className="absolute -bottom-40 right-1/3 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/10" />
			</div>

			{/* Header */}
			<header className="relative border-b border-border/50 bg-background/80 backdrop-blur-md">
				<div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between">
						<div className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text font-bold text-xl text-transparent dark:from-emerald-400 dark:to-cyan-400">
							Cliniq Care
						</div>
						<div className="flex items-center gap-4">
							<Link href="/app/signin">
								<Button variant="ghost">Sign In</Button>
							</Link>
							<Link href="/app/signup">
								<Button className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700">
									Get Started
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</header>

			<main className="relative">
				{/* Hero */}
				<section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
					<div className="mx-auto max-w-3xl text-center">
						<h1 className="font-bold text-4xl tracking-tight text-foreground sm:text-5xl lg:text-6xl">
							<span className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-violet-600 bg-clip-text text-transparent dark:from-emerald-400 dark:via-cyan-400 dark:to-violet-400">
								AI-Powered
							</span>{" "}
							Medication Safety Analysis
						</h1>
						<p className="mt-6 text-lg leading-8 text-muted-foreground">
							Scan your medications, check for dangerous interactions, and
							receive personalized health recommendations powered by advanced
							AI and real-time medical data.
						</p>
						<div className="mt-10 flex items-center justify-center gap-6">
							<Link href="/app/signup">
								<Button
									size="lg"
									className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-lg hover:from-emerald-700 hover:to-cyan-700"
								>
									Start Analyzing
								</Button>
							</Link>
							<Link href="/app/signin">
								<Button size="lg" variant="outline" className="text-lg">
									Sign In
								</Button>
							</Link>
						</div>
					</div>
				</section>

				{/* Features */}
				<section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
					<div className="mx-auto max-w-2xl text-center">
						<h2 className="font-bold text-3xl tracking-tight text-foreground sm:text-4xl">
							Everything you need for medication safety
						</h2>
						<p className="mt-2 text-lg text-muted-foreground">
							Comprehensive analysis powered by AI and medical databases
						</p>
					</div>
					<div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
						<div className="group flex flex-col gap-4 rounded-xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50/80 to-cyan-50/50 p-6 dark:border-emerald-900/30 dark:from-emerald-950/30 dark:to-cyan-950/20">
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400">
								<Scan className="h-6 w-6" />
							</div>
							<h3 className="font-semibold text-xl text-foreground">
								Smart Scanning
							</h3>
							<p className="text-muted-foreground">
								Use OCR technology to scan medication labels or add medications
								manually. Our AI identifies medications from images instantly.
							</p>
						</div>
						<div className="group flex flex-col gap-4 rounded-xl border border-violet-200/50 bg-gradient-to-br from-violet-50/80 to-fuchsia-50/50 p-6 dark:border-violet-900/30 dark:from-violet-950/30 dark:to-fuchsia-950/20">
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20 text-violet-600 dark:bg-violet-400/20 dark:text-violet-400">
								<Shield className="h-6 w-6" />
							</div>
							<h3 className="font-semibold text-xl text-foreground">
								Interaction Checking
							</h3>
							<p className="text-muted-foreground">
								Get real-time warnings about drug interactions, contraindications,
								and safety concerns based on your medical conditions.
							</p>
						</div>
						<div className="group flex flex-col gap-4 rounded-xl border border-cyan-200/50 bg-gradient-to-br from-cyan-50/80 to-blue-50/50 p-6 dark:border-cyan-900/30 dark:from-cyan-950/30 dark:to-blue-950/20">
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-400">
								<Brain className="h-6 w-6" />
							</div>
							<h3 className="font-semibold text-xl text-foreground">
								AI Analysis
							</h3>
							<p className="text-muted-foreground">
								Receive personalized medication analysis powered by Azure OpenAI,
								OpenFDA data, and your medical history.
							</p>
						</div>
						<div className="group flex flex-col gap-4 rounded-xl border border-rose-200/50 bg-gradient-to-br from-rose-50/80 to-pink-50/50 p-6 dark:border-rose-900/30 dark:from-rose-950/30 dark:to-pink-950/20">
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20 text-rose-600 dark:bg-rose-400/20 dark:text-rose-400">
								<Heart className="h-6 w-6" />
							</div>
							<h3 className="font-semibold text-xl text-foreground">
								Personalized Care
							</h3>
							<p className="text-muted-foreground">
								Track your medical conditions and get recommendations tailored to
								your specific health profile.
							</p>
						</div>
						<div className="group flex flex-col gap-4 rounded-xl border border-amber-200/50 bg-gradient-to-br from-amber-50/80 to-orange-50/50 p-6 dark:border-amber-900/30 dark:from-amber-950/30 dark:to-orange-950/20">
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400">
								<span className="text-xl font-bold">📊</span>
							</div>
							<h3 className="font-semibold text-xl text-foreground">
								Safety Reports
							</h3>
							<p className="text-muted-foreground">
								Access detailed safety reports with interaction analysis,
								contraindications, and personalized recommendations.
							</p>
						</div>
						<div className="group flex flex-col gap-4 rounded-xl border border-sky-200/50 bg-gradient-to-br from-sky-50/80 to-indigo-50/50 p-6 dark:border-sky-900/30 dark:from-sky-950/30 dark:to-indigo-950/20">
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/20 text-sky-600 dark:bg-sky-400/20 dark:text-sky-400">
								<span className="text-xl font-bold">🔒</span>
							</div>
							<h3 className="font-semibold text-xl text-foreground">
								Secure & Private
							</h3>
							<p className="text-muted-foreground">
								Your health data is encrypted and stored securely. We never share
								your information with third parties.
							</p>
						</div>
					</div>
				</section>

				{/* CTA */}
				<section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
					<div className="relative overflow-hidden rounded-3xl border border-emerald-200/50 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-violet-500/10 p-12 dark:border-emerald-900/30">
						<div className="mx-auto max-w-2xl text-center">
							<h2 className="font-bold text-3xl tracking-tight text-foreground sm:text-4xl">
								Ready to get started?
							</h2>
							<p className="mt-4 text-lg text-muted-foreground">
								Join thousands of users who trust Cliniq Care for medication
								safety analysis.
							</p>
							<div className="mt-8">
								<Link href="/app/signup">
									<Button
										size="lg"
										className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-lg hover:from-emerald-700 hover:to-cyan-700"
									>
										Create Free Account
									</Button>
								</Link>
							</div>
						</div>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="relative border-t border-border/50">
				<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
					<div className="text-center">
						<div className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text font-bold text-lg text-transparent dark:from-emerald-400 dark:to-cyan-400">
							Cliniq Care
						</div>
						<p className="mt-4 text-sm text-muted-foreground">
							AI-Powered Medication Safety Analysis
						</p>
						<p className="mt-2 text-xs text-muted-foreground">
							© {new Date().getFullYear()} Cliniq Care. All rights reserved.
						</p>
						<p className="mt-4 text-xs text-muted-foreground">
							This tool is for informational purposes only and should not replace
							professional medical advice.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
