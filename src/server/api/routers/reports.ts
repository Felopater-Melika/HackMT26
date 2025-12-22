import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { reports } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

export const reportsRouter = createTRPCRouter({
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const userReports = await ctx.db
			.select()
			.from(reports)
			.where(eq(reports.userId, ctx.session.user.id))
			.orderBy(desc(reports.createdAt));

		return userReports;
	}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const report = await ctx.db
				.select()
				.from(reports)
				.where(eq(reports.id, input.id))
				.limit(1);

			if (!report || report.length === 0) {
				throw new Error("Report not found");
			}

			// Verify ownership
			if (report[0]?.userId !== ctx.session.user.id) {
				throw new Error("Unauthorized");
			}

			return report[0];
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// Verify ownership before deleting
			const report = await ctx.db
				.select()
				.from(reports)
				.where(eq(reports.id, input.id))
				.limit(1);

			if (!report || report.length === 0) {
				throw new Error("Report not found");
			}

			if (report[0]?.userId !== ctx.session.user.id) {
				throw new Error("Unauthorized");
			}

			// Delete the report (cascade will handle related records)
			await ctx.db.delete(reports).where(eq(reports.id, input.id));

			return { success: true };
		}),
});

