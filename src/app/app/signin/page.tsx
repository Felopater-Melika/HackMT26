import { SignInForm } from "@/components/authentication/SignInForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Sign In",
	description: "Sign in to your Cliniq Care account to access medication safety analysis.",
	robots: {
		index: false,
		follow: false,
	},
};

export default function SigninPage() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="w-full max-w-sm">
				<SignInForm />
			</div>
		</div>
	);
}
