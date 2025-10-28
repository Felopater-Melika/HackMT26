import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";
import { conditions, userConditions } from "@/server/db/schema";
import { and, eq, ilike } from "drizzle-orm";
import { z } from "zod";

export const conditionsRouter = createTRPCRouter({
	search: publicProcedure
		.input(z.object({ query: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const results = await ctx.db
				.select()
				.from(conditions)
				.where(ilike(conditions.name, `%${input.query}%`))
				.limit(10);

			return results;
		}),

	getAll: publicProcedure.query(async ({ ctx }) => {
		const allConditions = await ctx.db
			.select()
			.from(conditions)
			.orderBy(conditions.name);

		return allConditions;
	}),

	getAllForPicker: protectedProcedure.query(async ({ ctx }) => {
		const all = await ctx.db.select().from(conditions);
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

	getUserConditions: protectedProcedure.query(async ({ ctx }) => {
		const userConditionsList = await ctx.db
			.select({
				condition: conditions,
				userCondition: userConditions,
			})
			.from(userConditions)
			.innerJoin(conditions, eq(userConditions.conditionId, conditions.id))
			.where(eq(userConditions.userId, ctx.session.user.id));

		return userConditionsList.map((item) => item.condition);
	}),

	addUserCondition: protectedProcedure
		.input(z.object({ conditionId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const newUserCondition = await ctx.db
				.insert(userConditions)
				.values({
					userId: ctx.session.user.id,
					conditionId: input.conditionId,
				})
				.returning();

			return newUserCondition[0];
		}),

	removeUserCondition: protectedProcedure
		.input(z.object({ conditionId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.delete(userConditions)
				.where(
					and(
						eq(userConditions.userId, ctx.session.user.id),
						eq(userConditions.conditionId, input.conditionId),
					),
				);

			return { success: true };
		}),

	createCustomCondition: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1, "Condition name is required"),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existingCondition = await ctx.db
				.select()
				.from(conditions)
				.where(eq(conditions.name, input.name))
				.limit(1);

			if (existingCondition.length > 0) {
				return existingCondition[0];
			}

			const newCondition = await ctx.db
				.insert(conditions)
				.values({
					name: input.name,
					description: input.description,
					source: "user",
					createdBy: ctx.session.user.id,
					isVerified: false,
				})
				.returning();

			return newCondition[0];
		}),
});
