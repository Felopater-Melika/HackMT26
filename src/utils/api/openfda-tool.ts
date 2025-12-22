/**
 * LangChain Tool for OpenFDA API
 * 
 * Provides a LangChain-compatible tool for querying medication information
 * from the OpenFDA API. Can be used with LangChain agents and chains.
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { searchByMedicationName, searchByNDC, type OpenFDADrugInfo } from "./openfda";

/**
 * Schema for the OpenFDA tool input
 */
const openFDAToolSchema = z.object({
	medicationName: z.string().describe("The name of the medication to search for. Can be brand name, generic name, or active ingredient."),
});

/**
 * OpenFDA LangChain Tool
 * 
 * Searches the OpenFDA database for medication information including:
 * - Brand and generic names
 * - Manufacturer information
 * - Indications and usage
 * - Warnings
 * - Dosage and administration
 * - NDC codes
 * 
 * @example
 * ```typescript
 * const tool = createOpenFDATool();
 * const result = await tool.invoke({ medicationName: "aspirin" });
 * ```
 */
export function createOpenFDATool() {
	return new DynamicStructuredTool({
		name: "openfda_drug_lookup",
		description: `Searches the OpenFDA database for medication information. 
Returns comprehensive drug data including brand names, generic names, manufacturer, 
indications, warnings, dosage information, and NDC codes. 
Use this tool when you need detailed, authoritative medication information from the FDA.`,
		schema: openFDAToolSchema,
		func: async ({ medicationName }) => {
			try {
				const result = await searchByMedicationName(medicationName);

				if (!result) {
					return JSON.stringify({
						found: false,
						message: `No medication information found for "${medicationName}" in OpenFDA database.`,
					});
				}

				// Format the response for AI consumption
				const formattedResult = {
					found: true,
					medication: medicationName,
					brandNames: result.brand_name || [],
					genericNames: result.generic_name || [],
					manufacturer: result.manufacturer_name?.[0] || null,
					productType: result.product_type?.[0] || null,
					route: result.route || [],
					activeIngredients: result.active_ingredient || [],
					substances: result.substance_name || [],
					indications: result.indications_and_usage?.[0] || null,
					warnings: result.warnings?.[0] || null,
					dosageAndAdministration: result.dosage_and_administration?.[0] || null,
					ndcCodes: {
						product: result.product_ndc || [],
						package: result.package_ndc || [],
					},
					splIds: {
						splId: result.spl_id?.[0] || null,
						splSetId: result.spl_set_id?.[0] || null,
					},
				};

				return JSON.stringify(formattedResult, null, 2);
			} catch (error) {
				return JSON.stringify({
					found: false,
					error: error instanceof Error ? error.message : "Unknown error occurred",
					message: `Failed to retrieve medication information for "${medicationName}" from OpenFDA.`,
				});
			}
		},
	});
}

/**
 * Alternative tool that searches by NDC code
 */
export function createOpenFDANDCTool() {
	return new DynamicStructuredTool({
		name: "openfda_ndc_lookup",
		description: `Searches the OpenFDA database for medication information by NDC (National Drug Code). 
Use this when you have an NDC code and need to find the corresponding medication information.`,
		schema: z.object({
			ndc: z.string().describe("The NDC (National Drug Code) to search for. Can include or exclude dashes."),
		}),
		func: async ({ ndc }) => {
			try {
				const result = await searchByNDC(ndc);

				if (!result) {
					return JSON.stringify({
						found: false,
						message: `No medication information found for NDC "${ndc}" in OpenFDA database.`,
					});
				}

				const formattedResult = {
					found: true,
					ndc: ndc,
					brandNames: result.brand_name || [],
					genericNames: result.generic_name || [],
					manufacturer: result.manufacturer_name?.[0] || null,
					productType: result.product_type?.[0] || null,
					route: result.route || [],
					activeIngredients: result.active_ingredient || [],
					substances: result.substance_name || [],
					indications: result.indications_and_usage?.[0] || null,
					warnings: result.warnings?.[0] || null,
					dosageAndAdministration: result.dosage_and_administration?.[0] || null,
					ndcCodes: {
						product: result.product_ndc || [],
						package: result.package_ndc || [],
					},
					splIds: {
						splId: result.spl_id?.[0] || null,
						splSetId: result.spl_set_id?.[0] || null,
					},
				};

				return JSON.stringify(formattedResult, null, 2);
			} catch (error) {
				return JSON.stringify({
					found: false,
					error: error instanceof Error ? error.message : "Unknown error occurred",
					message: `Failed to retrieve medication information for NDC "${ndc}" from OpenFDA.`,
				});
			}
		},
	});
}

