"use client";

import { Nav } from "@/components/Nav";
import { ProfileForm } from "@/components/profile/ProfileForm";

// Note: Metadata can't be exported from client components
// This page is client-side only for interactivity

export default function ProfilePage() {
	return (
		<div className="min-h-screen bg-background">
			<Nav />
			<ProfileForm variant="page" />
		</div>
	);
}
