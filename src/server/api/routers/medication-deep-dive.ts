import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { createDeepDiveGenerator } from "@/lib/medication-deep-dive-generator";
import {
	medicationDeepDives,
	medications,
	scans,
} from "@/server/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Medication Deep-Dive tRPC Router
 *
 * Provides endpoints for generating, retrieving, and managing
 * comprehensive medication deep-dive analyses.
 */
export const medicationDeepDiveRouter = createTRPCRouter({
	/**
	 * Get or create a medication deep-dive
	 *
	 * Generates a new deep-dive or returns existing version if one already exists.
	 * Only one deep-dive per medication per user is allowed.
	 * Supports multiple ways to specify the medication (by ID, name, or scan).
	 */
	getOrCreate: protectedProcedure
		.input(
			z.object({
				scanId: z.string().uuid().optional(),
				medicationId: z.string().uuid().optional(),
				medicationName: z.string().optional(),
				openFdaLabelText: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			console.log("🔍 [API] getOrCreate called with:", {
				scanId: input.scanId,
				medicationId: input.medicationId,
				medicationName: input.medicationName,
			});

			// Resolve medication
			let medicationId: string;
			let medicationName: string;

			if (input.medicationId) {
				// Fetch medication by ID
				const med = await ctx.db
					.select()
					.from(medications)
					.where(eq(medications.id, input.medicationId))
					.limit(1);

				if (!med || med.length === 0) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Medication not found",
					});
				}

				medicationId = med[0]!.id;
				medicationName = med[0]!.name || med[0]!.brandName || "Unknown";
			} else if (input.medicationName) {
				// Find or create medication by name
				const existing = await ctx.db
					.select()
					.from(medications)
					.where(eq(medications.name, input.medicationName.toLowerCase()))
					.limit(1);

				if (existing && existing.length > 0) {
					medicationId = existing[0]!.id;
					medicationName =
						existing[0]!.name || existing[0]!.brandName || input.medicationName;
				} else {
					// Create new medication
					console.log("📝 [API] Creating new medication:", input.medicationName);
					const [newMed] = await ctx.db
						.insert(medications)
						.values({
							name: input.medicationName.toLowerCase(),
							brandName: input.medicationName,
							lastUpdated: new Date(),
						})
						.returning();
					medicationId = newMed!.id;
					medicationName = input.medicationName;
				}
			} else {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Either medicationId or medicationName must be provided",
				});
			}

			console.log(
				`💊 [API] Resolved medication: ${medicationName} (${medicationId})`,
			);

			// Check if a deep-dive already exists for this medication (only 1 per med per user)
			const existingDeepDive = await ctx.db
				.select()
				.from(medicationDeepDives)
				.where(
					and(
						eq(medicationDeepDives.medicationId, medicationId),
						eq(medicationDeepDives.userId, userId),
					),
				)
				.limit(1);

			if (existingDeepDive && existingDeepDive.length > 0) {
				console.log("✅ [EXISTING] Returning existing deep-dive for this medication");
				return {
					id: existingDeepDive[0]!.id,
					cached: true,
					alreadyExists: true,
					...existingDeepDive[0],
				};
			}

			// Validate scanId if provided (ensure it exists in scans table)
			let validatedScanId: string | null = null;
			if (input.scanId) {
				const scanExists = await ctx.db
					.select({ id: scans.id })
					.from(scans)
					.where(eq(scans.id, input.scanId))
					.limit(1);

				if (scanExists && scanExists.length > 0) {
					validatedScanId = input.scanId;
				} else {
					console.log(`⚠️ [API] scanId ${input.scanId} not found in scans table, ignoring`);
				}
			}

			// Generate deep-dive
			const generator = createDeepDiveGenerator(ctx.db, userId);
			const result = await generator.generate({
				userId,
				medicationName,
				openFdaLabelText: input.openFdaLabelText,
			});

			if (!result.success || !result.data) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: result.error || "Failed to generate deep-dive",
				});
			}

			// Save to database
			console.log("💾 [API] Saving new deep-dive to database...");
			const [saved] = await ctx.db
				.insert(medicationDeepDives)
				.values({
					userId,
					medicationId,
					scanId: validatedScanId,
					inputsHash: result.inputsHash,
					openfdaDataHash: result.openfdaDataHash,
					summary: result.data.summary,
					whatItTreats: result.data.whatItTreats,
					howItWorks: result.data.howItWorks,
					howToTake: result.data.howToTake,
					expectedTimeline: result.data.expectedTimeline,
					benefits: result.data.benefits,
					sideEffects: result.data.sideEffects,
					personalizedWarnings: result.data.personalizedWarnings,
					interactions: result.data.interactions,
					lifestyle: result.data.lifestyle,
					monitoring: result.data.monitoring,
					questionsToAskDoctor: result.data.questionsToAskDoctor,
					confidence: result.data.confidence,
					sourcesUsed: result.data.sourcesUsed,
					disclaimer: result.data.disclaimer,
					rawLlmResponse: result.rawResponse,
					aiModel: "gpt-4",
					temperature: "0.2",
					latencyMs: result.latencyMs,
				})
				.returning();

			console.log("✅ [API] Deep-dive saved successfully:", saved?.id);

			return {
				id: saved?.id,
				cached: false,
				alreadyExists: false,
				...saved,
			};
		}),

	/**
	 * Get a deep-dive by ID
	 *
	 * Fetches a specific deep-dive and verifies user ownership.
	 */
	getById: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const deepDive = await ctx.db
				.select()
				.from(medicationDeepDives)
				.where(eq(medicationDeepDives.id, input.id))
				.limit(1);

			if (!deepDive || deepDive.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Deep-dive not found",
				});
			}

			// Verify ownership
			if (deepDive[0]?.userId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Unauthorized: You don't have access to this deep-dive",
				});
			}

			return deepDive[0];
		}),

	/**
	 * Get all deep-dives for a specific medication
	 *
	 * Returns all deep-dives for a medication that belong to the current user,
	 * ordered by creation date (most recent first).
	 */
	getByMedicationId: protectedProcedure
		.input(z.object({ medicationId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const deepDives = await ctx.db
				.select()
				.from(medicationDeepDives)
				.where(
					and(
						eq(medicationDeepDives.medicationId, input.medicationId),
						eq(medicationDeepDives.userId, ctx.session.user.id),
					),
				)
				.orderBy(desc(medicationDeepDives.createdAt));

			return deepDives;
		}),

	/**
	 * Get all deep-dives associated with a scan
	 *
	 * Returns all deep-dives generated from a specific scan that belong
	 * to the current user.
	 */
	getByScanId: protectedProcedure
		.input(z.object({ scanId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const deepDives = await ctx.db
				.select()
				.from(medicationDeepDives)
				.where(
					and(
						eq(medicationDeepDives.scanId, input.scanId),
						eq(medicationDeepDives.userId, ctx.session.user.id),
					),
				)
				.orderBy(desc(medicationDeepDives.createdAt));

			return deepDives;
		}),

	/**
	 * Delete a deep-dive
	 *
	 * Removes a deep-dive after verifying ownership.
	 */
	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			// Verify ownership before deleting
			const deepDive = await ctx.db
				.select()
				.from(medicationDeepDives)
				.where(eq(medicationDeepDives.id, input.id))
				.limit(1);

			if (!deepDive || deepDive.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Deep-dive not found",
				});
			}

			if (deepDive[0]?.userId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Unauthorized: You cannot delete this deep-dive",
				});
			}

			// Delete the deep-dive
			await ctx.db
				.delete(medicationDeepDives)
				.where(eq(medicationDeepDives.id, input.id));

			console.log(`🗑️  [API] Deep-dive deleted: ${input.id}`);

			return { success: true };
		}),

	/**
	 * Get all deep-dives for the current user
	 *
	 * Returns all deep-dives owned by the current user with medication info,
	 * ordered by creation date (most recent first).
	 */
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const deepDives = await ctx.db
			.select({
				id: medicationDeepDives.id,
				userId: medicationDeepDives.userId,
				medicationId: medicationDeepDives.medicationId,
				scanId: medicationDeepDives.scanId,
				inputsHash: medicationDeepDives.inputsHash,
				summary: medicationDeepDives.summary,
				whatItTreats: medicationDeepDives.whatItTreats,
				howItWorks: medicationDeepDives.howItWorks,
				howToTake: medicationDeepDives.howToTake,
				expectedTimeline: medicationDeepDives.expectedTimeline,
				benefits: medicationDeepDives.benefits,
				sideEffects: medicationDeepDives.sideEffects,
				personalizedWarnings: medicationDeepDives.personalizedWarnings,
				interactions: medicationDeepDives.interactions,
				lifestyle: medicationDeepDives.lifestyle,
				monitoring: medicationDeepDives.monitoring,
				questionsToAskDoctor: medicationDeepDives.questionsToAskDoctor,
				confidence: medicationDeepDives.confidence,
				sourcesUsed: medicationDeepDives.sourcesUsed,
				disclaimer: medicationDeepDives.disclaimer,
				createdAt: medicationDeepDives.createdAt,
				updatedAt: medicationDeepDives.updatedAt,
				// Include medication info
				medication: {
					id: medications.id,
					name: medications.name,
					brandName: medications.brandName,
				},
			})
			.from(medicationDeepDives)
			.leftJoin(medications, eq(medicationDeepDives.medicationId, medications.id))
			.where(eq(medicationDeepDives.userId, ctx.session.user.id))
			.orderBy(desc(medicationDeepDives.createdAt));

		return deepDives;
	}),

	/**
	 * Check if a deep-dive exists for a medication
	 *
	 * Returns whether a deep-dive already exists for the given medication.
	 */
	exists: protectedProcedure
		.input(
			z.object({
				medicationId: z.string().uuid().optional(),
				medicationName: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;

			// If medicationId is provided, check directly
			if (input.medicationId) {
				const existing = await ctx.db
					.select({ id: medicationDeepDives.id })
					.from(medicationDeepDives)
					.where(
						and(
							eq(medicationDeepDives.medicationId, input.medicationId),
							eq(medicationDeepDives.userId, userId),
						),
					)
					.limit(1);

				return {
					exists: existing.length > 0,
					deepDiveId: existing[0]?.id || null,
				};
			}

			// If medicationName is provided, find the medication first
			if (input.medicationName) {
				const med = await ctx.db
					.select()
					.from(medications)
					.where(eq(medications.name, input.medicationName.toLowerCase()))
					.limit(1);

				if (!med || med.length === 0) {
					return { exists: false, deepDiveId: null };
				}

				const existing = await ctx.db
					.select({ id: medicationDeepDives.id })
					.from(medicationDeepDives)
					.where(
						and(
							eq(medicationDeepDives.medicationId, med[0]!.id),
							eq(medicationDeepDives.userId, userId),
						),
					)
					.limit(1);

				return {
					exists: existing.length > 0,
					deepDiveId: existing[0]?.id || null,
				};
			}

			return { exists: false, deepDiveId: null };
		}),
});
