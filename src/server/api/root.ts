import { ocrRouter } from "@/server/api/routers/ocr";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { allergiesRouter } from "./routers/allergies";
import { conditionsRouter } from "./routers/conditions";
import { chatRouter } from "./routers/chat";
import { medicationAnalysisRouter } from "./routers/medication-analysis";
import { medicationDeepDiveRouter } from "./routers/medication-deep-dive";
import { medicationsRouter } from "./routers/medications";
import { profileRouter } from "./routers/profile";
import { reportsRouter } from "./routers/reports";
import { usageRouter } from "./routers/usage";
import { socialRouter } from "./routers/social";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	allergies: allergiesRouter,
	chat: chatRouter,
	profile: profileRouter,
	conditions: conditionsRouter,
	ocr: ocrRouter,
	medications: medicationsRouter,
	medicationAnalysis: medicationAnalysisRouter,
	medicationDeepDive: medicationDeepDiveRouter,
	reports: reportsRouter,
	usage: usageRouter,
	social: socialRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
