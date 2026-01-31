import {
	boolean,
	integer,
	text,
	timestamp,
	uuid,
	index,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { createTable } from "../table";
import { user } from "./auth";
import { medications } from "./medications";

// Posts about medication experiences
export const posts = createTable(
	"posts",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		medicationId: uuid("medication_id").references(() => medications.id, {
			onDelete: "set null",
		}),
		medicationName: text("medication_name"), // Store name even if medication is deleted
		title: text("title").notNull(),
		content: text("content").notNull(),
		rating: integer("rating"), // 1-5 star rating
		experienceType: text("experience_type"), // "positive", "negative", "neutral", "side_effects"
		isPublic: boolean("is_public").default(true).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(t) => ({
		userIdIdx: index("posts_user_id_idx").on(t.userId),
		medicationIdIdx: index("posts_medication_id_idx").on(t.medicationId),
		createdAtIdx: index("posts_created_at_idx").on(t.createdAt),
	}),
);

// Images attached to posts
export const postImages = createTable(
	"post_images",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		postId: uuid("post_id")
			.references(() => posts.id, { onDelete: "cascade" })
			.notNull(),
		imageUrl: text("image_url").notNull(),
		imageKey: text("image_key"), // For storage service (e.g., UploadThing key)
		order: integer("order").default(0).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => ({
		postIdIdx: index("post_images_post_id_idx").on(t.postId),
	}),
);

// Comments on posts
export const postComments = createTable(
	"post_comments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		postId: uuid("post_id")
			.references(() => posts.id, { onDelete: "cascade" })
			.notNull(),
		userId: text("user_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		content: text("content").notNull(),
		parentCommentId: uuid("parent_comment_id").references(
			() => postComments.id,
			{ onDelete: "cascade" },
		), // For nested comments/replies
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(t) => ({
		postIdIdx: index("post_comments_post_id_idx").on(t.postId),
		userIdIdx: index("post_comments_user_id_idx").on(t.userId),
		parentCommentIdIdx: index("post_comments_parent_comment_id_idx").on(
			t.parentCommentId,
		),
	}),
);

// Likes on posts
export const postLikes = createTable(
	"post_likes",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		postId: uuid("post_id")
			.references(() => posts.id, { onDelete: "cascade" })
			.notNull(),
		userId: text("user_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => ({
		postIdIdx: index("post_likes_post_id_idx").on(t.postId),
		userIdIdx: index("post_likes_user_id_idx").on(t.userId),
	}),
);

// Medication ratings (aggregated from posts)
export const medicationRatings = createTable(
	"medication_ratings",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		medicationId: uuid("medication_id")
			.references(() => medications.id, { onDelete: "cascade" })
			.notNull(),
		userId: text("user_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		rating: integer("rating").notNull(), // 1-5 stars
		postId: uuid("post_id").references(() => posts.id, {
			onDelete: "set null",
		}), // Link to post if rating came from a post
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(t) => ({
		medicationIdIdx: index("medication_ratings_medication_id_idx").on(
			t.medicationId,
		),
		userIdIdx: index("medication_ratings_user_id_idx").on(t.userId),
		uniqueRating: uniqueIndex("medication_ratings_unique").on(
			t.medicationId,
			t.userId,
		),
	}),
);

// User follows (optional social feature)
export const userFollows = createTable(
	"user_follows",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		followerId: text("follower_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		followingId: text("following_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => ({
		followerIdIdx: index("user_follows_follower_id_idx").on(t.followerId),
		followingIdIdx: index("user_follows_following_id_idx").on(t.followingId),
		uniqueFollow: uniqueIndex("user_follows_unique").on(
			t.followerId,
			t.followingId,
		),
	}),
);

// Post reports (for moderation)
export const postReports = createTable(
	"post_reports",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		postId: uuid("post_id")
			.references(() => posts.id, { onDelete: "cascade" })
			.notNull(),
		userId: text("user_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		reason: text("reason").notNull(), // "spam", "inappropriate", "misinformation", etc.
		description: text("description"),
		status: text("status").default("pending"), // "pending", "reviewed", "resolved"
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => ({
		postIdIdx: index("post_reports_post_id_idx").on(t.postId),
		userIdIdx: index("post_reports_user_id_idx").on(t.userId),
	}),
);
