import type { RxNavConcept, RxNavResult } from "@/types/rxnav";

const BASE_URL = "https://rxnav.nlm.nih.gov/REST";

export const fetchWithTimeout = async (
	url: string,
	timeout = 10000,
): Promise<Response> => {
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
};

const parseSearchResponse = async (res: Response): Promise<RxNavResult[]> => {
	const data: { drugGroup?: { conceptGroup?: RxNavConcept[] } } =
		await res.json();
	if (!data.drugGroup?.conceptGroup) return [];
	return data.drugGroup.conceptGroup.flatMap(
		(g: RxNavConcept) =>
			g.conceptProperties?.map((c) => ({
				rxcui: c.rxcui,
				name: c.name,
				synonym: c.synonym,
				tty: c.tty,
				language: c.language,
			})) || [],
	);
};

const parseDrugInfoResponse = async (
	res: Response,
): Promise<RxNavResult | null> => {
	const data = await res.json();
	if (!data.properties) return null;
	return {
		rxcui: data.properties.rxcui,
		name: data.properties.name,
		synonym: data.properties.synonym,
		tty: data.properties.tty,
		language: data.properties.language,
	};
};

export const searchByDrugName = async (
	drugName: string,
	timeout = 10000,
): Promise<RxNavResult[]> => {
	const url = `${BASE_URL}/drugs.json?name=${encodeURIComponent(drugName)}`;
	try {
		console.log(`Searching RxNav for: ${drugName}`);
		const res = await fetchWithTimeout(url, timeout);
		if (!res.ok) return [];
		return await parseSearchResponse(res);
	} catch (e) {
		console.error(`RxNav search error for "${drugName}":`, e);
		return [];
	}
};

export const getDrugInfo = async (
	rxcui: string,
	timeout = 10000,
): Promise<RxNavResult | null> => {
	const url = `${BASE_URL}/rxcui/${rxcui}/properties.json`;
	try {
		console.log(`Fetching drug info for RxCUI: ${rxcui}`);
		const res = await fetchWithTimeout(url, timeout);
		if (!res.ok) return null;
		return await parseDrugInfoResponse(res);
	} catch (e) {
		console.error(`RxNav drug info error for "${rxcui}":`, e);
		return null;
	}
};
