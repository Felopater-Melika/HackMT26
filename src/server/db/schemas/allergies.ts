import {
	boolean,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { createTable } from "../table";
import { user } from "./auth";

export const allergies = createTable(
	"allergies",
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
		nameUnique: uniqueIndex("allergies_name_unique").on(t.name),
	}),
);

export const userAllergies = createTable(
	"user_allergies",
	{
		userId: text("user_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		allergyId: uuid("allergy_id")
			.references(() => allergies.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(t) => ({
		pk: {
			columns: [t.userId, t.allergyId],
			name: "user_allergies_pk",
		},
	}),
);
