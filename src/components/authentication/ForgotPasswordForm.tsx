"use client";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function ForgotPasswordForm() {
	const [email, setEmail] = useState("");
	const [isLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: Implement password reset with Better Auth
		// The method name needs to be verified in better-auth documentation
		alert(
			"Password reset is temporarily disabled. Please contact support or sign in with Google.",
		);
	};

	return (
		<form onSubmit={handleSubmit}>
			<Field>
				<FieldLabel htmlFor="email">Email</FieldLabel>
				<Input
					id="email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="m@example.com"
					required
				/>
			</Field>
			<Button type="submit" className="w-full" disabled={isLoading}>
				Send Reset Link
			</Button>
		</form>
	);
}
