import {
	boolean,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { createTable } from "../table";
import { user } from "./auth";

export const conditions = createTable(
	"conditions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		description: text("description"),
		source: text("source"),
		createdBy: text("created_by").references(() => user.id, {
			onDelete: "set null",
		}),
		isVerified: boolean("is_verified"),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(t) => ({
		nameUnique: uniqueIndex("conditions_name_unique").on(t.name),
	}),
);

export const userConditions = createTable(
	"user_conditions",
	{
		userId: text("user_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		conditionId: uuid("condition_id")
			.references(() => conditions.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(t) => ({
		pk: {
			columns: [t.userId, t.conditionId],
			name: "user_conditions_pk",
		},
	}),
);
