import { z } from 'zod';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '@/server/api/trpc';
import { conditions, userConditions } from '@/server/db/schema';
import { eq, ilike, and } from 'drizzle-orm';

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

  // For pickers: prioritize conditions created by the current user, then verified, then alphabetical
  getAllForPicker: protectedProcedure.query(async ({ ctx }) => {
    // Order: created by current user first (rank 0), others (rank 1), then verified desc, then name asc
    // Using SQL fragment via drizzle is more complex; leverage a simple ordering by mapping after fetch
    const all = await ctx.db.select().from(conditions);
    const userId = ctx.session.user.id;
    const ordered = all.sort((a, b) => {
      const aRank = a.createdBy === userId ? 0 : 1;
      const bRank = b.createdBy === userId ? 0 : 1;
      if (aRank !== bRank) return aRank - bRank;
      const aVerified = a.isVerified ? 1 : 0;
      const bVerified = b.isVerified ? 1 : 0;
      if (aVerified !== bVerified) return bVerified - aVerified;
      return (a.name || '').localeCompare(b.name || '');
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
            eq(userConditions.conditionId, input.conditionId)
          )
        );

      return { success: true };
    }),

  createCustomCondition: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Condition name is required'),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if condition already exists
      const existingCondition = await ctx.db
        .select()
        .from(conditions)
        .where(eq(conditions.name, input.name))
        .limit(1);

      if (existingCondition.length > 0) {
        return existingCondition[0];
      }

      // Create new condition
      const newCondition = await ctx.db
        .insert(conditions)
        .values({
          name: input.name,
          description: input.description,
          source: 'user',
          createdBy: ctx.session.user.id,
          isVerified: false,
        })
        .returning();

      return newCondition[0];
    }),
});
