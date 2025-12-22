import { SignUpForm } from "@/components/authentication/SignUpForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Sign Up",
	description:
		"Create your Cliniq Care account to start analyzing medication safety with AI-powered insights.",
	robots: {
		index: false,
		follow: false,
	},
};

export default function SignupPage() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
			<div className="w-full max-w-sm">
				<SignUpForm />
			</div>
		</div>
	);
}
