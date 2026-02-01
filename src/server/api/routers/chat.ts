import { z } from "zod";
import { AzureChatOpenAI } from "@langchain/openai";
import {
	AIMessage,
	HumanMessage,
	SystemMessage,
} from "@langchain/core/messages";

import { env } from "@/env";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { createOpenFDATool } from "@/utils/api/openfda-tool";
import { createPatientRecordsTool } from "@/utils/api/patient-records-tool";

const chatMessageSchema = z.object({
	role: z.enum(["user", "assistant", "system"]),
	content: z.string().min(1).max(800),
});

// Simple in-memory throttling to avoid burst abuse per user.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 12;
// Guardrails to keep payload size and model cost predictable.
const MAX_TOTAL_CHARACTERS = 4000;
const MAX_MODEL_TOKENS = 1000;

const rateLimitBuckets = new Map<string, number[]>();

function isRateLimited(userId: string) {
	const now = Date.now();
	const bucket = rateLimitBuckets.get(userId) ?? [];
	// Retain only timestamps within the current window.
	const fresh = bucket.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
	fresh.push(now);
	rateLimitBuckets.set(userId, fresh);
	return fresh.length > RATE_LIMIT_MAX_REQUESTS;
}

export const chatRouter = createTRPCRouter({
	send: protectedProcedure
		.input(
			z.object({
				messages: z.array(chatMessageSchema).min(1).max(24),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Enforce per-user rate limiting and history size caps.
			if (isRateLimited(ctx.session.user.id)) {
				throw new Error("Rate limit exceeded. Please wait and try again.");
			}

			const totalChars = input.messages.reduce(
				(sum, message) => sum + message.content.length,
				0,
			);
			if (totalChars > MAX_TOTAL_CHARACTERS) {
				throw new Error("Message history too long. Please shorten and retry.");
			}

			// Azure OpenAI client configuration.
			const instanceName = env.AZURE_AI_ENDPOINT
				.replace("https://", "")
				.replace("http://", "")
				.split(".")[0];

			const llm = new AzureChatOpenAI({
				azureOpenAIApiKey: env.AZURE_AI_API_KEY,
				azureOpenAIApiVersion: env.AZURE_AI_API_VERSION,
				azureOpenAIApiDeploymentName: env.AZURE_AI_DEPLOYMENT,
				azureOpenAIApiInstanceName: instanceName,
				temperature: 0.3,
				maxTokens: MAX_MODEL_TOKENS,
			});

			// Tooling: FDA drug info + patient records from the DB.
			const openFDATool = createOpenFDATool();
			const patientRecordsTool = createPatientRecordsTool(
				ctx.db,
				ctx.session.user.id,
			);
			const modelWithTools = llm.bindTools([openFDATool, patientRecordsTool]);

			// System prompt to steer tool usage and safety behavior.
			const systemMessage = new SystemMessage(
				`You are a helpful medication assistant. Use patient context and FDA information to answer questions.
When a medication is mentioned, call openfda_drug_lookup to retrieve authoritative information.
Always call patient_records_lookup at least once to ground your answer in the user's profile.
Respond with short bullet points (3-6 bullets), plain language, and minimal fluff.
Format bullets as:
- Point one

- Point two

- Point three
Keep each bullet to one short sentence.
Include a brief safety reminder when appropriate.
If you are uncertain or a question is high risk, advise consulting a healthcare professional.`,
			);

			const chatMessages = input.messages
				.filter((m) => m.role !== "system")
				.slice(-12)
				.map((m) => {
					if (m.role === "user") return new HumanMessage(m.content);
					if (m.role === "assistant") return new AIMessage(m.content);
					return new SystemMessage(m.content);
				});

			const firstResponse = await modelWithTools.invoke([
				systemMessage,
				...chatMessages,
			]);

			let finalText = firstResponse.content as string;

			// Execute any tool calls requested by the model, then ask it to answer.
			if (firstResponse.tool_calls && firstResponse.tool_calls.length > 0) {
				const toolResults: Array<{ tool: string; result: string }> = [];

				for (const toolCall of firstResponse.tool_calls) {
					try {
						if (toolCall.name === "openfda_drug_lookup") {
							const result = await openFDATool.func(
								toolCall.args as { medicationName: string },
							);
							toolResults.push({
								tool: "openfda_drug_lookup",
								result,
							});
						}
						if (toolCall.name === "patient_records_lookup") {
							const result = await patientRecordsTool.func(
								toolCall.args as { medicationName?: string },
							);
							toolResults.push({
								tool: "patient_records_lookup",
								result,
							});
						}
					} catch (error) {
						toolResults.push({
							tool: toolCall.name,
							result: JSON.stringify({
								error:
									error instanceof Error
										? error.message
										: "Tool execution failed",
							}),
						});
					}
				}

				const toolResultsMessage = new HumanMessage(
					`Tool Results:\n\n${toolResults
						.map((tr) => `${tr.tool}:\n${tr.result}`)
						.join("\n\n")}\n\nNow respond to the user.`,
				);

				const finalResponse = await llm.invoke([
					systemMessage,
					...chatMessages,
					toolResultsMessage,
				]);

				finalText = finalResponse.content as string;
			}

			return { reply: finalText };
		}),
});
