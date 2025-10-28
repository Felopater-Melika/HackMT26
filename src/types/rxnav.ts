export type RxNavResult = {
	rxcui?: string;
	name?: string;
	synonym?: string;
	tty?: string;
	language?: string;
};

export type RxNavConcept = {
	conceptProperties: {
		rxcui: string;
		name: string;
		synonym: string;
		tty: string;
		language: string;
	}[];
};
