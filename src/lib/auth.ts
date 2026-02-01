import { env } from "@/env";
import { db } from "@/server/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import {
	checkout,
	polar,
	portal,
	usage,
	webhooks,
} from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { nextCookies } from "better-auth/next-js";
import { Resend } from "resend";

const polarClient = new Polar({
	accessToken: process.env.POLAR_ACCESS_TOKEN,
});

const resend = new Resend(env.RESEND_TOKEN);

const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	trustedOrigins: [
		"http://localhost:3000",
		"https://cliniq.care",
		"https://www.cliniq.care",
		"http://10.82.139.100:3000",
		"https://cliniq-ijnhdiovn-felopatermelikas-projects.vercel.app",
		...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
	],
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
	},
	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		defaultCallbackURL: "/app",
		async sendVerificationEmail(
			{ user, url, token }: { user: unknown; url: string; token: string },
			request?: Request,
		) {
			// !!todo: type user to include email field
			console.log(
				"Sending verification email to:",
				(user as { email?: string })?.email,
			);
			console.log("Verification URL:", url);

			// Better Auth already includes the correct callbackURL
			const verificationUrl = url;
			
			// !TODO: Clean up the emails
			try {
				const userEmail = (user as { email?: string })?.email;
				if (!userEmail) {
					throw new Error("User email is required");
				}
				
				const result = await resend.emails.send({
					from: "Cliniq Care <noreply@cliniq.care>",
					to: userEmail,
					subject: "Verify your email address",
					html: `
            <h1>Verify your email</h1>
            <p>Click the link below to verify your email address:</p>
            <a href="${verificationUrl}" style="background: ##64748b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
            <p>If the button doesn't work, copy and paste this link:</p>
            <p>${verificationUrl}</p>
          `,
				});
				console.log("Email sent successfully:", result);
			} catch (error) {
				console.error("Failed to send verification email:", error);
				throw error;
			}
		},
	},
	passwordReset: {
		async sendPasswordResetEmail(
			{ user, url, token }: { user: unknown; url: string; token: string },
			request?: Request,
		) {
			// !!todo: type user to include email field
			console.log(
				"Sending password reset email to:",
				(user as { email?: string })?.email,
			);
			console.log("Reset URL:", url);

			try {
				const userEmail = (user as { email?: string })?.email;
				if (!userEmail) {
					throw new Error("User email is required");
				}
				
				const result = await resend.emails.send({
					from: "Cliniq Care <noreply@cliniq.care>",
					to: userEmail,
					subject: "Reset your password",
					html: `
            <h1>Reset your password</h1>
            <p>Click the link below to reset your password:</p>
            <a href="${url}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>If the button doesn't work, copy and paste this link:</p>
            <p>${url}</p>
            <p>This link will expire in 1 hour.</p>
          `,
				});
				console.log("Password reset email sent successfully:", result);
			} catch (error) {
				console.error("Failed to send password reset email:", error);
				throw error;
			}
		},
	},
	socialProviders: {
		google: {
			enabled: true,
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
			prompt: "select_account",
		},
	},
	plugins: [
		polar({
			client: polarClient,
			createCustomerOnSignUp: false,
			use: [
				checkout({
					products: [
						{
							productId: "d25da972-4853-4717-a37c-b81abce8c048",
							slug: "Scan",
						},
					],
					successUrl: env.POLAR_SUCCESS_URL,
					authenticatedUsersOnly: true,
				}),
			],
		}),
		nextCookies(),
	],
});

export default auth;
