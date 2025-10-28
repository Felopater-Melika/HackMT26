import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { user, userConditions, userProfiles } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const profileRouter = createTRPCRouter({
	getOnboardingStatus: protectedProcedure.query(async ({ ctx }) => {
		const profile = await ctx.db
			.select()
			.from(userProfiles)
			.where(eq(userProfiles.id, ctx.session.user.id))
			.limit(1);

		return {
			isOnboarded: profile.length > 0,
			profile: profile[0] || null,
		};
	}),

	getProfile: protectedProcedure.query(async ({ ctx }) => {
		const profile = await ctx.db
			.select()
			.from(userProfiles)
			.where(eq(userProfiles.id, ctx.session.user.id))
			.limit(1);

		const userData = await ctx.db
			.select()
			.from(user)
			.where(eq(user.id, ctx.session.user.id))
			.limit(1);

		return {
			...profile[0],
			name: userData[0]?.name || null,
		};
	}),

	createProfile: protectedProcedure
		.input(
			z.object({
				age: z.number().min(1).max(120),
				gender: z.string().min(1),
				conditionIds: z.array(z.string()).optional().default([]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const newProfile = await ctx.db
				.insert(userProfiles)
				.values({
					id: ctx.session.user.id,
					age: input.age,
					gender: input.gender,
				})
				.returning();

			// Add user conditions if any
			if (input.conditionIds.length > 0) {
				await ctx.db.insert(userConditions).values(
					input.conditionIds.map((conditionId) => ({
						userId: ctx.session.user.id,
						conditionId,
					})),
				);
			}

			return newProfile[0];
		}),

	updateProfile: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1).optional(),
				age: z.number().min(1).max(120).optional(),
				gender: z.string().min(1).optional(),
				conditionIds: z.array(z.string()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Update user name if provided
			if (input.name !== undefined) {
				await ctx.db
					.update(user)
					.set({ name: input.name })
					.where(eq(user.id, ctx.session.user.id));
			}

			// Update profile data
			const updateData: Partial<{ age: number; gender: string }> = {};
			// !!todo: extend updateData type if more profile fields are added
			if (input.age !== undefined) updateData.age = input.age;
			if (input.gender !== undefined) updateData.gender = input.gender;

			const updatedProfile = await ctx.db
				.update(userProfiles)
				.set(updateData)
				.where(eq(userProfiles.id, ctx.session.user.id))
				.returning();

			// Update conditions if provided
			if (input.conditionIds !== undefined) {
				// Remove all existing conditions
				await ctx.db
					.delete(userConditions)
					.where(eq(userConditions.userId, ctx.session.user.id));

				// Add new conditions
				if (input.conditionIds.length > 0) {
					await ctx.db.insert(userConditions).values(
						input.conditionIds.map((conditionId) => ({
							userId: ctx.session.user.id,
							conditionId,
						})),
					);
				}
			}

			return updatedProfile[0];
		}),
});
