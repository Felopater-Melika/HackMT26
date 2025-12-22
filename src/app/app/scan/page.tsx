import { MedicationScanner } from "@/components/MedicationScanner";
import { Nav } from "@/components/Nav";
import { OnboardingWrapper } from "@/components/profile/OnboardingWrapper";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Scan Medications",
	description:
		"Scan your medications using OCR or add them manually. Get AI-powered safety analysis and interaction warnings.",
	robots: {
		index: false,
		follow: false,
	},
};

export default async function ScanPage() {
	try {
		const onboardingStatus = await api.profile.getOnboardingStatus();

		if (!onboardingStatus.isOnboarded) {
			return <OnboardingWrapper />;
		}

		if (!onboardingStatus.profile) {
			console.error("missing profile for onboarded user");
			redirect("/app/signin");
		}

		return (
			<div className="min-h-screen bg-background">
				<Nav />
				<MedicationScanner profile={onboardingStatus.profile} />
			</div>
		);
	} catch (error) {
		console.error("authentication error:", error);
		redirect("/app/signin");
	}
}

