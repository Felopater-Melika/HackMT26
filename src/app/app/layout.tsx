import type { Metadata } from "next";
import { ChatWidget } from "@/components/chat/ChatWidget";

export const metadata: Metadata = {
	title: "Dashboard",
	description:
		"View your medication analysis history and manage your health profile.",
	robots: {
		index: false,
		follow: false,
	},
};

export default function AppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			{children}
			<ChatWidget />
		</>
	);
}
