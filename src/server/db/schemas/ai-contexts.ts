import { text, timestamp, uuid, vector } from "drizzle-orm/pg-core";
import { createTable } from "../table";
import { user } from "./auth";

export const aiContexts = createTable("ai_contexts", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id")
		.references(() => user.id, { onDelete: "cascade" })
		.notNull(),
	contentType: text("content_type").notNull(),
	contentId: uuid("content_id").notNull(),
	text: text("text"),
	embedding: vector("embedding", { dimensions: 1536 }),
	createdAt: timestamp("created_at").defaultNow(),
});
