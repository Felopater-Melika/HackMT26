"use client";

import { OnboardingForm } from "@/components/profile/OnboardingForm";
import { useRouter } from "next/navigation";

export function OnboardingWrapper() {
	const router = useRouter();

	const handleComplete = () => {
		router.refresh();
	};

	return <OnboardingForm onComplete={handleComplete} />;
}
