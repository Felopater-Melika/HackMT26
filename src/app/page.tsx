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
			{/* Hero Section */}
			<header className="border-b">
				<div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between">
						<div className="font-bold text-xl text-foreground">Cliniq Care</div>
						<div className="flex items-center gap-4">
							<Link href="/app/signin">
								<Button variant="ghost">Sign In</Button>
							</Link>
							<Link href="/app/signup">
								<Button>Get Started</Button>
							</Link>
						</div>
					</div>
				</div>
			</header>

			<main>
				{/* Hero */}
				<section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
					<div className="mx-auto max-w-3xl text-center">
						<h1 className="font-bold text-5xl tracking-tight text-foreground sm:text-6xl">
							AI-Powered Medication Safety Analysis
						</h1>
						<p className="mt-6 text-lg leading-8 text-muted-foreground">
							Scan your medications, check for dangerous interactions, and
							receive personalized health recommendations powered by advanced AI
							and real-time medical data.
						</p>
						<div className="mt-10 flex items-center justify-center gap-x-6">
							<Link href="/app/signup">
								<Button size="lg" className="text-lg">
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
						<div className="flex flex-col gap-4 rounded-lg border bg-card p-6">
							<Scan className="h-8 w-8 text-primary" />
							<h3 className="font-semibold text-xl text-foreground">
								Smart Scanning
							</h3>
							<p className="text-muted-foreground">
								Use OCR technology to scan medication labels or add medications
								manually. Our AI identifies medications from images instantly.
							</p>
						</div>
						<div className="flex flex-col gap-4 rounded-lg border bg-card p-6">
							<Shield className="h-8 w-8 text-primary" />
							<h3 className="font-semibold text-xl text-foreground">
								Interaction Checking
							</h3>
							<p className="text-muted-foreground">
								Get real-time warnings about drug interactions, contraindications,
								and safety concerns based on your medical conditions.
							</p>
						</div>
						<div className="flex flex-col gap-4 rounded-lg border bg-card p-6">
							<Brain className="h-8 w-8 text-primary" />
							<h3 className="font-semibold text-xl text-foreground">
								AI Analysis
							</h3>
							<p className="text-muted-foreground">
								Receive personalized medication analysis powered by Azure OpenAI,
								OpenFDA data, and your medical history.
							</p>
						</div>
						<div className="flex flex-col gap-4 rounded-lg border bg-card p-6">
							<Heart className="h-8 w-8 text-primary" />
							<h3 className="font-semibold text-xl text-foreground">
								Personalized Care
							</h3>
							<p className="text-muted-foreground">
								Track your medical conditions and get recommendations tailored to
								your specific health profile.
							</p>
						</div>
						<div className="flex flex-col gap-4 rounded-lg border bg-card p-6">
							<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
								<span className="text-primary font-bold">📊</span>
							</div>
							<h3 className="font-semibold text-xl text-foreground">
								Safety Reports
							</h3>
							<p className="text-muted-foreground">
								Access detailed safety reports with interaction analysis,
								contraindications, and personalized recommendations.
							</p>
						</div>
						<div className="flex flex-col gap-4 rounded-lg border bg-card p-6">
							<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
								<span className="text-primary font-bold">🔒</span>
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
					<div className="mx-auto max-w-2xl text-center">
						<h2 className="font-bold text-3xl tracking-tight text-foreground sm:text-4xl">
							Ready to get started?
						</h2>
						<p className="mt-4 text-lg text-muted-foreground">
							Join thousands of users who trust Cliniq Care for medication safety
							analysis.
						</p>
						<div className="mt-8">
							<Link href="/app/signup">
								<Button size="lg" className="text-lg">
									Create Free Account
								</Button>
							</Link>
						</div>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="border-t">
				<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
					<div className="text-center">
						<div className="font-bold text-lg text-foreground">Cliniq Care</div>
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