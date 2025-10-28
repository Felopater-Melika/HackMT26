import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const medicationsRouter = createTRPCRouter({
	analyze: publicProcedure
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
		.mutation(async ({ input }) => {
			console.log(
				"[medications.analyze] received:",
				JSON.stringify(input, null, 2),
			);
			return { ok: true };
		}),
});
