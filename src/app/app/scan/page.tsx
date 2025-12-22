import { MedicationScanner } from "@/components/MedicationScanner";
import { Nav } from "@/components/Nav";
import { OnboardingWrapper } from "@/components/profile/OnboardingWrapper";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

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

