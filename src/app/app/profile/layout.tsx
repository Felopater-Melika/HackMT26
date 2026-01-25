import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Profile",
	description:
		"Manage your Cliniq Care profile, update personal information, and track your medical conditions for personalized medication analysis.",
	robots: {
		index: false,
		follow: false,
	},
};

export default function ProfileLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
