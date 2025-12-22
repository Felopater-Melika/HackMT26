/**
 * OpenFDA API Client
 * 
 * Provides access to FDA drug labeling data through the OpenFDA API.
 * Documentation: https://open.fda.gov/apis/drug/label/
 */

export interface OpenFDADrugInfo {
	brand_name?: string[];
	generic_name?: string[];
	manufacturer_name?: string[];
	product_type?: string[];
	route?: string[];
	substance_name?: string[];
	indications_and_usage?: string[];
	warnings?: string[];
	dosage_and_administration?: string[];
	active_ingredient?: string[];
	product_ndc?: string[];
	package_ndc?: string[];
	spl_id?: string[];
	spl_set_id?: string[];
}

export interface OpenFDAResponse {
	meta: {
		disclaimer: string;
		terms: string;
		license: string;
		last_updated: string;
		results: {
			skip: number;
			limit: number;
			total: number;
		};
	};
	results: Array<{
		spl_id: string[];
		spl_set_id: string[];
		package_ndc: string[];
		product_ndc: string[];
		product_type: string[];
		proprietary_name: string[];
		non_proprietary_name: string[];
		dosage_form: string[];
		route: string[];
		marketing_start_date: string[];
		marketing_end_date: string[];
		marketing_category: string[];
		application_number: string[];
		labeler_name: string[];
		substance_name: string[];
		active_ingredient: string[];
		indications_and_usage?: string[];
		warnings?: string[];
		dosage_and_administration?: string[];
		description?: string[];
		[key: string]: unknown;
	}>;
}

const BASE_URL = "https://api.fda.gov/drug/label.json";
const DEFAULT_LIMIT = 1;
const DEFAULT_TIMEOUT = 10000;

/**
 * Fetches data from OpenFDA API with timeout
 */
async function fetchWithTimeout(
	url: string,
	timeout = DEFAULT_TIMEOUT,
): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeout);
	try {
		const res = await fetch(url, { signal: controller.signal });
		clearTimeout(timer);
		return res;
	} catch (e) {
		clearTimeout(timer);
		throw e;
	}
}

/**
 * Searches for drug information by medication name
 * 
 * @param medicationName - The name of the medication to search for
 * @param limit - Maximum number of results to return (default: 1)
 * @returns Drug information from OpenFDA or null if not found
 */
export async function searchByMedicationName(
	medicationName: string,
	limit = DEFAULT_LIMIT,
): Promise<OpenFDADrugInfo | null> {
	if (!medicationName || medicationName.trim().length === 0) {
		return null;
	}

	try {
		// Search by proprietary name (brand name) or non-proprietary name (generic name)
		const searchQuery = encodeURIComponent(
			`proprietary_name:"${medicationName}" OR non_proprietary_name:"${medicationName}" OR active_ingredient:"${medicationName}"`,
		);
		const url = `${BASE_URL}?search=${searchQuery}&limit=${limit}`;

		const response = await fetchWithTimeout(url);

		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			throw new Error(`OpenFDA API error: ${response.status} ${response.statusText}`);
		}

		const data: OpenFDAResponse = await response.json();

		if (!data.results || data.results.length === 0) {
			return null;
		}

		const result = data.results[0];
		if (!result) {
			return null;
		}

		// Transform the response to our interface
		const drugInfo: OpenFDADrugInfo = {
			brand_name: result.proprietary_name,
			generic_name: result.non_proprietary_name,
			manufacturer_name: result.labeler_name,
			product_type: result.product_type,
			route: result.route,
			substance_name: result.substance_name,
			active_ingredient: result.active_ingredient,
			indications_and_usage: result.indications_and_usage,
			warnings: result.warnings,
			dosage_and_administration: result.dosage_and_administration,
			product_ndc: result.product_ndc,
			package_ndc: result.package_ndc,
			spl_id: result.spl_id,
			spl_set_id: result.spl_set_id,
		};

		return drugInfo;
	} catch (error) {
		console.error("Error fetching from OpenFDA:", error);
		return null;
	}
}

/**
 * Searches for drug information by NDC code
 * 
 * @param ndc - The NDC (National Drug Code) to search for
 * @param limit - Maximum number of results to return (default: 1)
 * @returns Drug information from OpenFDA or null if not found
 */
export async function searchByNDC(
	ndc: string,
	limit = DEFAULT_LIMIT,
): Promise<OpenFDADrugInfo | null> {
	if (!ndc || ndc.trim().length === 0) {
		return null;
	}

	try {
		// Normalize NDC (remove dashes)
		const normalizedNDC = ndc.replace(/-/g, "");
		const searchQuery = encodeURIComponent(
			`product_ndc:"${normalizedNDC}" OR package_ndc:"${normalizedNDC}"`,
		);
		const url = `${BASE_URL}?search=${searchQuery}&limit=${limit}`;

		const response = await fetchWithTimeout(url);

		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			throw new Error(`OpenFDA API error: ${response.status} ${response.statusText}`);
		}

		const data: OpenFDAResponse = await response.json();

		if (!data.results || data.results.length === 0) {
			return null;
		}

		const result = data.results[0];
		if (!result) {
			return null;
		}

		const drugInfo: OpenFDADrugInfo = {
			brand_name: result.proprietary_name,
			generic_name: result.non_proprietary_name,
			manufacturer_name: result.labeler_name,
			product_type: result.product_type,
			route: result.route,
			substance_name: result.substance_name,
			active_ingredient: result.active_ingredient,
			indications_and_usage: result.indications_and_usage,
			warnings: result.warnings,
			dosage_and_administration: result.dosage_and_administration,
			product_ndc: result.product_ndc,
			package_ndc: result.package_ndc,
			spl_id: result.spl_id,
			spl_set_id: result.spl_set_id,
		};

		return drugInfo;
	} catch (error) {
		console.error("Error fetching from OpenFDA by NDC:", error);
		return null;
	}
}

