import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";
import { allergies, userAllergies } from "@/server/db/schema";
import { and, eq, ilike } from "drizzle-orm";
import { z } from "zod";

export const allergiesRouter = createTRPCRouter({
	search: publicProcedure
		.input(z.object({ query: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const results = await ctx.db
				.select()
				.from(allergies)
				.where(ilike(allergies.name, `%${input.query}%`))
				.limit(10);

			return results;
		}),

	getAll: publicProcedure.query(async ({ ctx }) => {
		const allAllergies = await ctx.db
			.select()
			.from(allergies)
			.orderBy(allergies.name);

		return allAllergies;
	}),

	getAllForPicker: protectedProcedure.query(async ({ ctx }) => {
		const all = await ctx.db.select().from(allergies);
		const userId = ctx.session.user.id;
		const ordered = all.sort((a, b) => {
			const aRank = a.createdBy === userId ? 0 : 1;
			const bRank = b.createdBy === userId ? 0 : 1;
			if (aRank !== bRank) return aRank - bRank;
			const aVerified = a.isVerified ? 1 : 0;
			const bVerified = b.isVerified ? 1 : 0;
			if (aVerified !== bVerified) return bVerified - aVerified;
			return (a.name || "").localeCompare(b.name || "");
		});
		return ordered;
	}),

	getUserAllergies: protectedProcedure.query(async ({ ctx }) => {
		const userAllergiesList = await ctx.db
			.select({
				allergy: allergies,
				userAllergy: userAllergies,
			})
			.from(userAllergies)
			.innerJoin(allergies, eq(userAllergies.allergyId, allergies.id))
			.where(eq(userAllergies.userId, ctx.session.user.id));

		return userAllergiesList.map((item) => item.allergy);
	}),

	addUserAllergy: protectedProcedure
		.input(z.object({ allergyId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const newUserAllergy = await ctx.db
				.insert(userAllergies)
				.values({
					userId: ctx.session.user.id,
					allergyId: input.allergyId,
				})
				.returning();

			return newUserAllergy[0];
		}),

	removeUserAllergy: protectedProcedure
		.input(z.object({ allergyId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.delete(userAllergies)
				.where(
					and(
						eq(userAllergies.userId, ctx.session.user.id),
						eq(userAllergies.allergyId, input.allergyId),
					),
				);

			return { success: true };
		}),

	createCustomAllergy: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1, "Allergy name is required"),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existingAllergy = await ctx.db
				.select()
				.from(allergies)
				.where(eq(allergies.name, input.name))
				.limit(1);

			if (existingAllergy.length > 0) {
				return existingAllergy[0];
			}

			const newAllergy = await ctx.db
				.insert(allergies)
				.values({
					name: input.name,
					description: input.description,
					source: "user",
					createdBy: ctx.session.user.id,
					isVerified: false,
				})
				.returning();

			return newAllergy[0];
		}),
});
