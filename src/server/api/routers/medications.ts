import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { createMedicationAnalyzer } from "@/lib/medication-analyzer";
import { reports, scans, scanMedications, medications as medicationsTable } from "@/server/db/schema";
import { eq, count } from "drizzle-orm";

const MAX_SCANS_PER_USER = 3;

export const medicationsRouter = createTRPCRouter({
	analyze: protectedProcedure
		.input(
			z.object({
				medications: z.array(
					z.object({
						name: z.string().min(1),
						dosage: z.number().nullable(),
						measurement: z.string().nullable(),
						ocrLines: z.array(z.string()).default([]),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check usage limit before processing
			const [usageResult] = await ctx.db
				.select({ count: count() })
				.from(reports)
				.where(eq(reports.userId, ctx.session.user.id));

			const scanCount = usageResult?.count ?? 0;
			if (scanCount >= MAX_SCANS_PER_USER) {
				throw new Error(
					`You've reached your limit of ${MAX_SCANS_PER_USER} scans. Please upgrade to continue.`,
				);
			}

			console.log(
				"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
			);
			console.log("🔬 [MEDICATION ANALYSIS] Starting analysis...");
			console.log(
				"📋 Medications received:",
				JSON.stringify(input.medications, null, 2),
			);
			console.log(`📊 Usage: ${scanCount}/${MAX_SCANS_PER_USER} scans used`);
			console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

			// Create analyzer
			const analyzer = createMedicationAnalyzer({
				userId: ctx.session.user.id,
				temperature: 0.3,
			});

			const results = [];

			// Analyze each medication
			for (const med of input.medications) {
				console.log(`\n🔍 Analyzing: ${med.name}...`);

				try {
					const analysis = await analyzer.analyzeMedication(med.name);

					console.log("\n✅ Analysis complete for:", med.name);
					console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
					console.log("📊 RESULTS:");
					console.log("  Safety Score:", analysis.safetyScore, "/100");
					console.log("  Requires Attention:", analysis.requiresAttention);
					console.log("\n⚠️  Warnings:", analysis.warnings.length);
					analysis.warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
					console.log("\n🔗 Interactions:", analysis.interactions.length);
					analysis.interactions.forEach((int, i) =>
						console.log(`  ${i + 1}. ${int}`),
					);
					console.log("\n💡 Recommendations:", analysis.recommendations.length);
					analysis.recommendations.forEach((rec, i) =>
						console.log(`  ${i + 1}. ${rec}`),
					);
					console.log("\n📝 Summary:");
					console.log(analysis.analysis);
					console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

					// Return clean data for frontend
					results.push({
						medicationName: med.name,
						dosage: med.dosage,
						measurement: med.measurement,
						safetyScore: analysis.safetyScore,
						requiresAttention: analysis.requiresAttention,
						summary: analysis.analysis,
						warnings: analysis.warnings,
						interactions: analysis.interactions,
						recommendations: analysis.recommendations,
						success: true,
					});
				} catch (error) {
					console.error(`\n❌ Error analyzing ${med.name}:`, error);
					results.push({
						medicationName: med.name,
						dosage: med.dosage,
						measurement: med.measurement,
						success: false,
						error:
							error instanceof Error ? error.message : "Analysis failed",
					});
				}
			}

			// If multiple medications, check for interactions
			let interactionAnalysis = null;
			if (input.medications.length > 1) {
				console.log(
					"\n🔗 [INTERACTION ANALYSIS] Checking interactions between multiple medications...",
				);

				try {
					const medicationNames = input.medications.map((m) => m.name);
					const analysis =
						await analyzer.analyzeMultipleMedications(medicationNames);

					console.log("\n✅ Interaction analysis complete");
					console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
					console.log("🔗 INTERACTIONS FOUND:", analysis.interactions.length);
					analysis.interactions.forEach((int, i) =>
						console.log(`  ${i + 1}. ${int}`),
					);
					console.log("\n💡 RECOMMENDATIONS:", analysis.recommendations.length);
					analysis.recommendations.forEach((rec, i) =>
						console.log(`  ${i + 1}. ${rec}`),
					);
					console.log("\n📝 SUMMARY:");
					console.log(analysis.overallAnalysis);
					console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

					interactionAnalysis = {
						medications: analysis.medications,
						overallSafetyScore: analysis.overallSafetyScore,
						requiresAttention: analysis.requiresAttention,
						summary: analysis.overallAnalysis,
						interactions: analysis.interactions,
						recommendations: analysis.recommendations,
					};
				} catch (error) {
					console.error("\n❌ Error in interaction analysis:", error);
				}
			}

			console.log("\n🎉 [ANALYSIS COMPLETE] All medications analyzed!");
			console.log(
				"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n",
			);

			const responseData = {
				success: true,
				individualResults: results,
				interactionAnalysis,
				summary: {
					totalMedications: input.medications.length,
					analyzedSuccessfully: results.filter((r) => r.success).length,
					requiresAttention: results.some((r) => r.requiresAttention) || 
						(interactionAnalysis?.requiresAttention ?? false),
					averageSafetyScore:
						results.filter((r) => r.success).length > 0
							? Math.round(
									results
										.filter((r) => r.success && r.safetyScore)
										.reduce((sum, r) => sum + (r.safetyScore || 0), 0) /
										results.filter((r) => r.success).length,
								)
							: 0,
				},
			};

			// Save to database
			try {
				// 1. Create a scan record
				const [scan] = await ctx.db
					.insert(scans)
					.values({
						userId: ctx.session.user.id,
						status: "completed",
						processedAt: new Date(),
					})
					.returning();

				console.log("📦 Created scan record:", scan?.id);

				// 2. Create or find medications and link to scan
				for (const med of input.medications) {
					// Check if medication exists
					const existingMed = await ctx.db
						.select()
						.from(medicationsTable)
						.where(eq(medicationsTable.name, med.name.toLowerCase()))
						.limit(1);

					let medicationId: string;

					if (existingMed.length > 0) {
						medicationId = existingMed[0]!.id;
					} else {
						// Create new medication
						const [newMed] = await ctx.db
							.insert(medicationsTable)
							.values({
								name: med.name.toLowerCase(),
								brandName: med.name,
								lastUpdated: new Date(),
							})
							.returning();
						medicationId = newMed!.id;
					}

					// Link medication to scan
					await ctx.db.insert(scanMedications).values({
						scanId: scan!.id,
						medicationId,
					});
				}

				// 3. Create the report
				const [savedReport] = await ctx.db
					.insert(reports)
					.values({
						userId: ctx.session.user.id,
						scanId: scan!.id,
						scope: "scan",
						summary: `Analysis of ${input.medications.length} medication(s): ${input.medications.map(m => m.name).join(", ")}`,
						warnings: results
							.flatMap((r) => r.warnings || [])
							.filter(Boolean)
							.join(" | "),
						aiModel: "gpt-4",
						isPremium: false,
						rawJson: responseData,
					})
					.returning();

				console.log("💾 Saved report to database:", savedReport?.id);

				return {
					...responseData,
					reportId: savedReport?.id,
					scanId: scan?.id,
				};
			} catch (error) {
				console.error("❌ Failed to save to database:", error);
				// Still return the results even if save fails
				return responseData;
			}
		}),
});
