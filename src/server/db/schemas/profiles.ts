import { smallint, text, timestamp } from "drizzle-orm/pg-core";
import { createTable } from "../table";
import { user } from "./auth";

export const userProfiles = createTable("user_profiles", {
	id: text("id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	age: smallint("age"),
	gender: text("gender"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date()),
});
