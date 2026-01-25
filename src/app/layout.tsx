import "@/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { PostHogProvider } from "@/components/PostHogProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "sonner";

export const metadata: Metadata = {
	title: {
		default: "Cliniq Care - AI-Powered Medication Safety Analysis",
		template: "%s | Cliniq Care",
	},
	description:
		"Get personalized medication safety analysis powered by AI. Scan your medications, check for interactions, and receive tailored health recommendations based on your medical conditions.",
	keywords: [
		"medication safety",
		"drug interactions",
		"medication analysis",
		"healthcare AI",
		"medication scanner",
		"pharmacy",
		"medication management",
		"health app",
	],
	authors: [{ name: "Cliniq Care" }],
	creator: "Cliniq Care",
	publisher: "Cliniq Care",
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_APP_URL || "https://cliniq.care",
	),
	alternates: {
		canonical: "/",
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "/",
		title: "Cliniq Care - AI-Powered Medication Safety Analysis",
		description:
			"Get personalized medication safety analysis powered by AI. Scan your medications, check for interactions, and receive tailored health recommendations.",
		siteName: "Cliniq Care",
		images: [
			{
				url: "/og-image.png",
				width: 1200,
				height: 630,
				alt: "Cliniq Care - AI-Powered Medication Safety Analysis Platform",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Cliniq Care - AI-Powered Medication Safety Analysis",
		description:
			"Get personalized medication safety analysis powered by AI. Scan your medications, check for interactions, and receive tailored health recommendations.",
		images: ["/og-image.png"],
		creator: "@cliniqcare",
	},
	verification: {
		google: process.env.GOOGLE_SITE_VERIFICATION,
	},
	other: {
		"apple-mobile-web-app-capable": "yes",
		"apple-mobile-web-app-status-bar-style": "default",
		"apple-mobile-web-app-title": "Cliniq Care",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	icons: [
		{ rel: "icon", url: "/favicon.ico" },
		{ rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
	],
	manifest: "/site.webmanifest",
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const isProduction = process.env.NODE_ENV === "production";
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cliniq.care";

	// Structured data for SEO
	const structuredData = {
		"@context": "https://schema.org",
		"@type": "WebApplication",
		name: "Cliniq Care",
		description:
			"AI-powered medication safety analysis platform that helps users check for drug interactions and receive personalized health recommendations.",
		url: baseUrl,
		applicationCategory: "HealthApplication",
		operatingSystem: "Web",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
		},
		aggregateRating: {
			"@type": "AggregateRating",
			ratingValue: "4.8",
			ratingCount: "150",
		},
		featureList: [
			"AI-Powered Medication Analysis",
			"Drug Interaction Checking",
			"OCR Medication Scanning",
			"Personalized Health Recommendations",
			"Medical Condition Tracking",
		],
	};

	return (
		<html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
			<body>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(structuredData),
					}}
				/>
				<ThemeProvider defaultTheme="system" storageKey="cliniq-theme">
					{isProduction ? (
						<PostHogProvider>
							<TRPCReactProvider>{children}</TRPCReactProvider>
						</PostHogProvider>
					) : (
						<TRPCReactProvider>{children}</TRPCReactProvider>
					)}
					<Toaster richColors position="top-center" />
				</ThemeProvider>
			</body>
		</html>
	);
}
