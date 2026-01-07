import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { reports } from "@/server/db/schema";
import { eq, count } from "drizzle-orm";

const MAX_SCANS_PER_USER = 3;

export const usageRouter = createTRPCRouter({
	getUsage: protectedProcedure.query(async ({ ctx }) => {
		// Count total reports (scans) for this user
		const [result] = await ctx.db
			.select({ count: count() })
			.from(reports)
			.where(eq(reports.userId, ctx.session.user.id));

		const scanCount = result?.count ?? 0;
		const remaining = Math.max(0, MAX_SCANS_PER_USER - scanCount);
		const hasReachedLimit = scanCount >= MAX_SCANS_PER_USER;

		return {
			scanCount,
			limit: MAX_SCANS_PER_USER,
			remaining,
			hasReachedLimit,
		};
	}),

	checkLimit: protectedProcedure.query(async ({ ctx }) => {
		// Count total reports (scans) for this user
		const [result] = await ctx.db
			.select({ count: count() })
			.from(reports)
			.where(eq(reports.userId, ctx.session.user.id));

		const scanCount = result?.count ?? 0;
		const hasReachedLimit = scanCount >= MAX_SCANS_PER_USER;

		if (hasReachedLimit) {
			throw new Error(
				`You've reached your limit of ${MAX_SCANS_PER_USER} scans. Please upgrade to continue.`,
			);
		}

		return {
			canScan: true,
			remaining: MAX_SCANS_PER_USER - scanCount,
		};
	}),
});

