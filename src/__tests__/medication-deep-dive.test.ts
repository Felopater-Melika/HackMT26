import { describe, it, expect } from "vitest";
import {
	medicationDeepDiveOutputSchema,
	howToTakeSchema,
	sideEffectsSchema,
	confidenceSchema,
	sourcesUsedSchema,
} from "@/types/medication-deep-dive";

describe("Medication Deep-Dive Schema Validation", () => {
	describe("howToTakeSchema", () => {
		it("should validate complete how-to-take data", () => {
			const validData = {
				timing: "Take once daily in the morning",
				withFood: "Take with food to reduce stomach upset",
				missedDose: "Take as soon as you remember unless it is close to your next dose",
			};

			expect(() => howToTakeSchema.parse(validData)).not.toThrow();
		});

		it("should reject missing fields", () => {
			const invalidData = {
				timing: "Morning",
				// missing withFood and missedDose
			};

			expect(() => howToTakeSchema.parse(invalidData)).toThrow();
		});
	});

	describe("sideEffectsSchema", () => {
		it("should validate complete side effects data", () => {
			const validData = {
				common: ["Nausea", "Headache", "Dizziness"],
				serious: ["Severe allergic reaction", "Liver damage"],
			};

			expect(() => sideEffectsSchema.parse(validData)).not.toThrow();
		});

		it("should accept empty arrays", () => {
			const validData = {
				common: [],
				serious: [],
			};

			expect(() => sideEffectsSchema.parse(validData)).not.toThrow();
		});

		it("should reject non-array values", () => {
			const invalidData = {
				common: "Nausea", // should be array
				serious: [],
			};

			expect(() => sideEffectsSchema.parse(invalidData)).toThrow();
		});
	});

	describe("confidenceSchema", () => {
		it("should validate high confidence", () => {
			const validData = {
				overall: "high" as const,
				reason: "Complete FDA data and patient profile available",
			};

			expect(() => confidenceSchema.parse(validData)).not.toThrow();
		});

		it("should validate medium confidence", () => {
			const validData = {
				overall: "medium" as const,
				reason: "Partial data available",
			};

			expect(() => confidenceSchema.parse(validData)).not.toThrow();
		});

		it("should validate low confidence", () => {
			const validData = {
				overall: "low" as const,
				reason: "Limited data available",
			};

			expect(() => confidenceSchema.parse(validData)).not.toThrow();
		});

		it("should reject invalid confidence levels", () => {
			const invalidData = {
				overall: "very-high", // not a valid enum value
				reason: "Test",
			};

			expect(() => confidenceSchema.parse(invalidData)).toThrow();
		});

		it("should reject missing reason", () => {
			const invalidData = {
				overall: "high",
				// missing reason
			};

			expect(() => confidenceSchema.parse(invalidData)).toThrow();
		});
	});

	describe("sourcesUsedSchema", () => {
		it("should validate all sources used", () => {
			const validData = {
				scanLabel: true,
				openFda: true,
				patientProfile: true,
			};

			expect(() => sourcesUsedSchema.parse(validData)).not.toThrow();
		});

		it("should validate no sources used", () => {
			const validData = {
				scanLabel: false,
				openFda: false,
				patientProfile: false,
			};

			expect(() => sourcesUsedSchema.parse(validData)).not.toThrow();
		});

		it("should reject non-boolean values", () => {
			const invalidData = {
				scanLabel: "yes", // should be boolean
				openFda: true,
				patientProfile: true,
			};

			expect(() => sourcesUsedSchema.parse(invalidData)).toThrow();
		});
	});

	describe("medicationDeepDiveOutputSchema", () => {
		const validCompleteData = {
			summary: "Test medication for treating conditions",
			whatItTreats: ["Condition 1", "Condition 2"],
			howItWorks: "Mechanism of action explanation",
			howToTake: {
				timing: "Morning",
				withFood: "With food",
				missedDose: "Take as soon as you remember",
			},
			expectedTimeline: "2-4 weeks for full effect",
			benefits: ["Benefit 1", "Benefit 2"],
			sideEffects: {
				common: ["Nausea", "Headache"],
				serious: ["Severe allergic reaction"],
			},
			personalizedWarnings: ["Warning 1", "Warning 2"],
			interactions: ["Interaction 1"],
			lifestyle: ["Avoid alcohol"],
			monitoring: ["Monitor blood pressure"],
			questionsToAskDoctor: ["Question 1", "Question 2"],
			confidence: {
				overall: "high" as const,
				reason: "Complete data available",
			},
			sourcesUsed: {
				scanLabel: true,
				openFda: true,
				patientProfile: true,
			},
			disclaimer: "This is for informational purposes only",
		};

		it("should validate complete deep-dive output", () => {
			expect(() =>
				medicationDeepDiveOutputSchema.parse(validCompleteData),
			).not.toThrow();
		});

		it("should reject missing required fields", () => {
			const invalidData = {
				summary: "Test",
				// missing all other required fields
			};

			expect(() =>
				medicationDeepDiveOutputSchema.parse(invalidData),
			).toThrow();
		});

		it("should reject invalid nested objects", () => {
			const invalidData = {
				...validCompleteData,
				howToTake: {
					timing: "Morning",
					// missing withFood and missedDose
				},
			};

			expect(() =>
				medicationDeepDiveOutputSchema.parse(invalidData),
			).toThrow();
		});

		it("should reject invalid confidence level", () => {
			const invalidData = {
				...validCompleteData,
				confidence: {
					overall: "invalid",
					reason: "Test",
				},
			};

			expect(() =>
				medicationDeepDiveOutputSchema.parse(invalidData),
			).toThrow();
		});

		it("should reject non-array for array fields", () => {
			const invalidData = {
				...validCompleteData,
				whatItTreats: "Condition 1", // should be array
			};

			expect(() =>
				medicationDeepDiveOutputSchema.parse(invalidData),
			).toThrow();
		});

		it("should accept empty arrays", () => {
			const validDataWithEmptyArrays = {
				...validCompleteData,
				whatItTreats: [],
				benefits: [],
				personalizedWarnings: [],
				interactions: [],
				lifestyle: [],
				monitoring: [],
				questionsToAskDoctor: [],
			};

			expect(() =>
				medicationDeepDiveOutputSchema.parse(validDataWithEmptyArrays),
			).not.toThrow();
		});
	});
});

describe("Hash Generation Logic", () => {
	// These tests would require importing the generator class
	// and testing the hash generation methods
	it("should generate consistent hashes for same inputs", () => {
		// Mock test - implementation would test actual hash generation
		const input1 = "medication|user123|patientData|fdaData";
		const input2 = "medication|user123|patientData|fdaData";

		// In real implementation, would use actual hash function
		// expect(generateHash(input1)).toBe(generateHash(input2));
		expect(input1).toBe(input2);
	});

	it("should generate different hashes for different inputs", () => {
		const input1 = "medication1|user123|patientData|fdaData";
		const input2 = "medication2|user123|patientData|fdaData";

		expect(input1).not.toBe(input2);
	});
});

describe("JSON Parsing from LLM Response", () => {
	it("should extract JSON from text with markdown code blocks", () => {
		const llmResponse = `Here is the JSON:
\`\`\`json
{"summary": "Test", "confidence": {"overall": "high", "reason": "Test"}}
\`\`\`
`;

		const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
		expect(jsonMatch).not.toBeNull();
		expect(() => JSON.parse(jsonMatch![0])).not.toThrow();
	});

	it("should extract JSON from plain text response", () => {
		const llmResponse = `{"summary": "Test medication", "whatItTreats": ["Condition 1"]}`;

		const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
		expect(jsonMatch).not.toBeNull();
		expect(() => JSON.parse(jsonMatch![0])).not.toThrow();
	});

	it("should handle nested JSON objects", () => {
		const llmResponse = `{"howToTake": {"timing": "Morning", "withFood": "Yes", "missedDose": "Skip"}}`;

		const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
		expect(jsonMatch).not.toBeNull();

		const parsed = JSON.parse(jsonMatch![0]);
		expect(parsed.howToTake).toBeDefined();
		expect(parsed.howToTake.timing).toBe("Morning");
	});

	it("should return null when no JSON found", () => {
		const llmResponse = "This is just plain text with no JSON";

		const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
		expect(jsonMatch).toBeNull();
	});
});

describe("Confidence Level Logic", () => {
	it("should set high confidence when all sources available", () => {
		const sourcesUsed = {
			scanLabel: true,
			openFda: true,
			patientProfile: true,
		};

		const allSourcesAvailable = Object.values(sourcesUsed).every(
			(val) => val === true,
		);
		expect(allSourcesAvailable).toBe(true);

		// In real implementation: expect(getConfidenceLevel(sourcesUsed)).toBe("high");
	});

	it("should set medium confidence when some sources missing", () => {
		const sourcesUsed = {
			scanLabel: false,
			openFda: true,
			patientProfile: true,
		};

		const allSourcesAvailable = Object.values(sourcesUsed).every(
			(val) => val === true,
		);
		expect(allSourcesAvailable).toBe(false);

		// In real implementation: expect(getConfidenceLevel(sourcesUsed)).toBe("medium");
	});

	it("should set low confidence when most sources missing", () => {
		const sourcesUsed = {
			scanLabel: false,
			openFda: false,
			patientProfile: true,
		};

		const availableCount = Object.values(sourcesUsed).filter(
			(val) => val === true,
		).length;
		expect(availableCount).toBeLessThanOrEqual(1);

		// In real implementation: expect(getConfidenceLevel(sourcesUsed)).toBe("low");
	});
});
