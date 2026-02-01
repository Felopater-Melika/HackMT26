import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { reports } from "@/server/db/schema";
import { eq, count } from "drizzle-orm";

// No scan limit - unlimited scans allowed
export const usageRouter = createTRPCRouter({
	getUsage: protectedProcedure.query(async ({ ctx }) => {
		// Count total reports (scans) for this user
		const [result] = await ctx.db
			.select({ count: count() })
			.from(reports)
			.where(eq(reports.userId, ctx.session.user.id));

		const scanCount = result?.count ?? 0;

		return {
			scanCount,
			limit: Infinity,
			remaining: Infinity,
			hasReachedLimit: false,
		};
	}),

	checkLimit: protectedProcedure.query(async () => {
		// No limit - always allow scanning
		return {
			canScan: true,
			remaining: Infinity,
		};
	}),
});

