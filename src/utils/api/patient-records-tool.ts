/**
 * LangChain Tool for Querying Patient Records
 * 
 * Provides a LangChain-compatible tool for querying patient medical records
 * relevant to medication scans. Returns user profile, conditions, medications,
 * scan history, and relevant reports.
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { eq, desc, ilike, or, and } from "drizzle-orm";
import { db } from "@/server/db";
import {
	userProfiles,
	userConditions,
	conditions,
	userMedications,
	medications,
	scans,
	scanMedications,
	reports,
} from "@/server/db/schema";

/**
 * Patient record data structure
 */
export interface PatientRecordData {
	profile: {
		age: number | null;
		gender: string | null;
	} | null;
	conditions: Array<{
		id: string;
		name: string;
		description: string | null;
		isVerified: boolean | null;
	}>;
	currentMedications: Array<{
		id: string;
		name: string | null;
		brandName: string | null;
		purpose: string | null;
		manufacturer: string | null;
		dosage: string | null;
		frequency: string | null;
		addedFromScan: boolean | null;
	}>;
	recentScans: Array<{
		id: string;
		status: string;
		createdAt: Date | null;
		medications: Array<{
			name: string | null;
			brandName: string | null;
			confidence: string | null;
		}>;
	}>;
	relevantReports: Array<{
		id: string;
		scope: string;
		summary: string | null;
		warnings: string | null;
		medicationName: string | null;
		createdAt: Date | null;
	}>;
}

/**
 * Queries patient records relevant to a medication scan
 * 
 * @param db - Database connection
 * @param userId - User ID to query records for
 * @param medicationName - Optional medication name to filter relevant records
 * @returns Patient record data
 */
export async function queryPatientRecords(
	database: typeof db,
	userId: string,
	medicationName?: string,
): Promise<PatientRecordData> {
	// Get user profile
	const profile = await database
		.select()
		.from(userProfiles)
		.where(eq(userProfiles.id, userId))
		.limit(1);

	// Get user conditions
	const userConditionsList = await database
		.select({
			condition: conditions,
		})
		.from(userConditions)
		.innerJoin(conditions, eq(userConditions.conditionId, conditions.id))
		.where(eq(userConditions.userId, userId));

	// Get user medications
	const userMeds = await database
		.select({
			medication: medications,
			userMedication: userMedications,
		})
		.from(userMedications)
		.innerJoin(
			medications,
			eq(userMedications.medicationId, medications.id),
		)
		.where(eq(userMedications.userId, userId))
		.orderBy(desc(userMedications.createdAt))
		.limit(50); // Limit to most recent 50

	// Get recent scans (last 10)
	const recentScansList = await database
		.select()
		.from(scans)
		.where(eq(scans.userId, userId))
		.orderBy(desc(scans.createdAt))
		.limit(10);

	// Get medications for each scan
	const scansWithMeds = await Promise.all(
		recentScansList.map(async (scan) => {
			const scanMeds = await database
				.select({
					medication: medications,
					scanMedication: scanMedications,
				})
				.from(scanMedications)
				.innerJoin(
					medications,
					eq(scanMedications.medicationId, medications.id),
				)
				.where(eq(scanMedications.scanId, scan.id));

			return {
				...scan,
				medications: scanMeds.map((sm) => ({
					name: sm.medication.name,
					brandName: sm.medication.brandName,
					confidence: sm.scanMedication.confidence,
				})),
			};
		}),
	);

	// Get relevant reports
	// If medicationName is provided, filter reports for that medication
	let relevantReportsList;

	if (medicationName) {
		// Filter reports by medication name match
		relevantReportsList = await database
			.select({
				report: reports,
				medication: medications,
			})
			.from(reports)
			.leftJoin(medications, eq(reports.medicationId, medications.id))
			.where(
				and(
					eq(reports.userId, userId),
					or(
						ilike(medications.name, `%${medicationName}%`),
						ilike(medications.brandName, `%${medicationName}%`),
					),
				),
			)
			.orderBy(desc(reports.createdAt))
			.limit(20);
	} else {
		relevantReportsList = await database
			.select({
				report: reports,
				medication: medications,
			})
			.from(reports)
			.leftJoin(medications, eq(reports.medicationId, medications.id))
			.where(eq(reports.userId, userId))
			.orderBy(desc(reports.createdAt))
			.limit(20);
	}

	return {
		profile: profile[0]
			? {
					age: profile[0].age,
					gender: profile[0].gender,
				}
			: null,
		conditions: userConditionsList.map((uc) => ({
			id: uc.condition.id,
			name: uc.condition.name,
			description: uc.condition.description,
			isVerified: uc.condition.isVerified,
		})),
		currentMedications: userMeds.map((um) => ({
			id: um.medication.id,
			name: um.medication.name,
			brandName: um.medication.brandName,
			purpose: um.medication.purpose,
			manufacturer: um.medication.manufacturer,
			dosage: um.userMedication.dosage,
			frequency: um.userMedication.frequency,
			addedFromScan: um.userMedication.addedFromScan,
		})),
		recentScans: scansWithMeds.map((scan) => ({
			id: scan.id,
			status: scan.status,
			createdAt: scan.createdAt,
			medications: scan.medications,
		})),
		relevantReports: relevantReportsList.map((rr) => ({
			id: rr.report.id,
			scope: rr.report.scope,
			summary: rr.report.summary,
			warnings: rr.report.warnings,
			medicationName: rr.medication?.name || null,
			createdAt: rr.report.createdAt,
		})),
	};
}

/**
 * Schema for the patient records tool input
 */
const patientRecordsToolSchema = z.object({
	medicationName: z
		.string()
		.optional()
		.describe(
			"Optional medication name to filter relevant patient records. If provided, will return reports and scans related to this medication.",
		),
});

/**
 * Creates a LangChain tool for querying patient records
 * 
 * @param db - Database connection
 * @param userId - User ID to query records for
 * @returns LangChain tool instance
 * 
 * @example
 * ```typescript
 * const tool = createPatientRecordsTool(db, userId);
 * const result = await tool.invoke({ medicationName: "aspirin" });
 * ```
 */
export function createPatientRecordsTool(
	database: typeof db,
	userId: string,
) {
	return new DynamicStructuredTool({
		name: "patient_records_lookup",
		description: `Queries patient medical records relevant to medication scans. 
Returns comprehensive patient information including:
- Demographics (age, gender)
- Medical conditions
- Current medications with dosages and frequencies
- Recent scan history with detected medications
- Relevant AI-generated reports and warnings

Use this tool when you need to check for:
- Drug interactions with current medications
- Contraindications based on patient conditions
- Previous scan results for the same medication
- Existing warnings or reports about medications

This helps ensure medication safety by providing full patient context.`,
		schema: patientRecordsToolSchema,
		func: async ({ medicationName }) => {
			try {
				const patientData = await queryPatientRecords(
					database,
					userId,
					medicationName,
				);

				// Format the response for AI consumption
				const formattedResult = {
					patient: {
						demographics: patientData.profile
							? {
									age: patientData.profile.age,
									gender: patientData.profile.gender,
								}
							: null,
						conditions: patientData.conditions.map((c) => ({
							name: c.name,
							description: c.description,
							verified: c.isVerified,
						})),
						currentMedications: patientData.currentMedications.map(
							(m) => ({
								name: m.name,
								brandName: m.brandName,
								purpose: m.purpose,
								manufacturer: m.manufacturer,
								dosage: m.dosage,
								frequency: m.frequency,
								addedFromScan: m.addedFromScan,
							}),
						),
					},
					scanHistory: patientData.recentScans.map((scan) => ({
						scanId: scan.id,
						status: scan.status,
						date: scan.createdAt,
						medicationsDetected: scan.medications.map((m) => ({
							name: m.name,
							brandName: m.brandName,
							confidence: m.confidence,
						})),
					})),
					relevantReports: patientData.relevantReports.map((r) => ({
						reportId: r.id,
						scope: r.scope,
						summary: r.summary,
						warnings: r.warnings,
						medicationName: r.medicationName,
						createdAt: r.createdAt,
					})),
					summary: {
						totalConditions: patientData.conditions.length,
						totalCurrentMedications:
							patientData.currentMedications.length,
						totalRecentScans: patientData.recentScans.length,
						totalReports: patientData.relevantReports.length,
						hasProfile: patientData.profile !== null,
					},
				};

				return JSON.stringify(formattedResult, null, 2);
			} catch (error) {
				return JSON.stringify({
					error: error instanceof Error ? error.message : "Unknown error occurred",
					message: `Failed to retrieve patient records for user ${userId}.`,
				});
			}
		},
	});
}

