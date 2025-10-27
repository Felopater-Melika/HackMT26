import { Dashboard } from "@/components/dashboard";
import { OnboardingWrapper } from "@/components/profile/onboarding-wrapper";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function AppPage() {
	try {
		const onboardingStatus = await api.profile.getOnboardingStatus();

		if (!onboardingStatus.isOnboarded) {
			return <OnboardingWrapper />;
		}

		if (!onboardingStatus.profile) {
			console.error("missing profile for onboarded user");
			redirect("/signin");
		}

		return <Dashboard profile={onboardingStatus.profile} />;
	} catch (error) {
		console.error("authentication error:", error);
		redirect("/signin");
	}
}
