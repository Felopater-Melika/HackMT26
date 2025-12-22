"use client";

import { Nav } from "@/components/Nav";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default function ProfilePage() {
	return (
		<div className="min-h-screen bg-background">
			<Nav />
			<ProfileForm variant="page" />
		</div>
	);
}

