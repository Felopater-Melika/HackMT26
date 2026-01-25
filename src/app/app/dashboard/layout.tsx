import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Dashboard",
	description:
		"View your medication analysis history and track your health insights. Access past scans, safety reports, and interaction warnings.",
	robots: {
		index: false,
		follow: false,
	},
};

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
