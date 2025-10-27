"use client";

import { ProfileForm } from "@/components/profile/profile-form";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { useState } from "react";

interface DashboardProps {
	profile: {
		id: string;
		age: number | null;
		gender: string | null;
		createdAt: Date | null;
	};
}

export function Dashboard({ profile }: DashboardProps) {
	const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
	const { data: userConditions = [] } =
		api.conditions.getUserConditions.useQuery();

	const utils = api.useUtils();

	const handleProfileUpdateSuccess = () => {
		setIsProfileModalOpen(false);
		utils.profile.getProfile.invalidate();
		utils.conditions.getUserConditions.invalidate();
	};

	return (
		<div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-7xl">
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="font-bold text-3xl text-gray-900">
							Welcome back to Cliniq Care
						</h1>
					</div>
					<Button variant="outline" onClick={() => setIsProfileModalOpen(true)}>
						Edit Profile
					</Button>
				</div>

				<Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
					<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Edit Profile</DialogTitle>
							<DialogDescription>
								Update your personal information and medical conditions
							</DialogDescription>
						</DialogHeader>
						<ProfileForm
							variant="modal"
							onSuccess={handleProfileUpdateSuccess}
						/>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
