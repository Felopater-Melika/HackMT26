import { MedicationSearch } from "@/components/MedicationSearch";
import { Nav } from "@/components/Nav";
import { OnboardingWrapper } from "@/components/profile/OnboardingWrapper";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Search Medications",
	description:
		"Search for medications and get AI-powered analysis. Find quick information about any medication.",
	robots: {
		index: false,
		follow: false,
	},
};

export default async function SearchPage() {
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
				<div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
					<div className="mb-8">
						<h1 className="font-bold text-3xl text-foreground">
							Search Medications
						</h1>
						<p className="mt-2 text-muted-foreground">
							Search the name of your medication for quick info
						</p>
					</div>
					<MedicationSearch />
				</div>
			</div>
		);
	} catch (error) {
		console.error("authentication error:", error);
		redirect("/app/signin");
	}
}
