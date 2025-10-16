import { pgTable, text, timestamp, smallint } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const userProfiles = pgTable("user_profiles", {
	id: text("id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
	age: smallint("age"),
	gender: text("gender"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
});


