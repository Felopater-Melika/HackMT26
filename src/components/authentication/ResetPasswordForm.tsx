"use client";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function ResetPasswordForm() {
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!token) return;

		setIsLoading(true);

		try {
			await authClient.resetPassword({ token, newPassword: password });
			window.location.href = "/app/signin";
		} catch (error) {
			console.error("Failed to reset password:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<Field>
				<FieldLabel htmlFor="password">New Password</FieldLabel>
				<Input
					id="password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="••••••••"
					required
				/>
			</Field>
			<Button type="submit" className="w-full" disabled={isLoading}>
				Reset Password
			</Button>
		</form>
	);
}
