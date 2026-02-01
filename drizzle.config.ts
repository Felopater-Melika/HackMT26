import type { Config } from "drizzle-kit";

// For migrations, we only need DATABASE_URL
// Use process.env directly to avoid full env validation
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is required for database migrations");
}

export default {
	schema: "./src/server/db/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: databaseUrl,
	},
	// Removed tablesFilter to allow all tables including social media tables
} satisfies Config;
