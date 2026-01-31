import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import {
	posts,
	postComments,
	postLikes,
	postImages,
	medicationRatings,
	userFollows,
	user,
	userProfiles,
	medications,
} from "@/server/db/schema";
import { eq, desc, and, or, sql, count, inArray } from "drizzle-orm";
import { z } from "zod";

export const socialRouter = createTRPCRouter({
	// Get all posts (feed)
	getFeed: publicProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(50).default(20),
				cursor: z.string().optional(),
				medicationId: z.string().uuid().optional(),
				userId: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const conditions = [eq(posts.isPublic, true)];

			if (input.medicationId) {
				conditions.push(eq(posts.medicationId, input.medicationId));
			}

			if (input.userId) {
				conditions.push(eq(posts.userId, input.userId));
			}

			if (input.cursor) {
				conditions.push(sql`${posts.createdAt} < (SELECT created_at FROM posts WHERE id = ${input.cursor})`);
			}

			const feedPosts = await ctx.db
				.select({
					post: posts,
					author: {
						id: user.id,
						name: user.name,
						email: user.email,
						image: user.image,
					},
					medication: {
						id: medications.id,
						name: medications.name,
						brandName: medications.brandName,
					},
				})
				.from(posts)
				.leftJoin(user, eq(posts.userId, user.id))
				.leftJoin(medications, eq(posts.medicationId, medications.id))
				.where(and(...conditions))
				.orderBy(desc(posts.createdAt))
				.limit(input.limit + 1);

			let nextCursor: string | undefined = undefined;
			if (feedPosts.length > input.limit) {
				const nextItem = feedPosts.pop();
				nextCursor = nextItem?.post.id;
			}

			// Get likes count for each post
			const postIds = feedPosts.map((p) => p.post.id);
			const likesData = postIds.length > 0
				? await ctx.db
						.select({
							postId: postLikes.postId,
							count: count(),
						})
						.from(postLikes)
						.where(inArray(postLikes.postId, postIds))
						.groupBy(postLikes.postId)
				: [];

			// Get comments count for each post
			const commentsData = postIds.length > 0
				? await ctx.db
						.select({
							postId: postComments.postId,
							count: count(),
						})
						.from(postComments)
						.where(inArray(postComments.postId, postIds))
						.groupBy(postComments.postId)
				: [];

			// Get images for each post
			const imagesData = postIds.length > 0
				? await ctx.db
						.select()
						.from(postImages)
						.where(inArray(postImages.postId, postIds))
						.orderBy(postImages.order)
				: [];

			// Get user likes if session exists
			const userId = "session" in ctx && ctx.session?.user?.id
				? ctx.session.user.id
				: null;
			const userLikes = userId && postIds.length > 0
				? await ctx.db
						.select({ postId: postLikes.postId })
						.from(postLikes)
						.where(
							and(
								inArray(postLikes.postId, postIds),
								eq(postLikes.userId, userId),
							),
						)
				: [];

			const userLikedSet = new Set(userLikes.map((l) => l.postId));

			return {
				posts: feedPosts.map((p) => ({
					...p.post,
					author: p.author,
					medication: p.medication,
					likesCount:
						likesData.find((l) => l.postId === p.post.id)?.count || 0,
					commentsCount:
						commentsData.find((c) => c.postId === p.post.id)?.count || 0,
					images: imagesData.filter((img) => img.postId === p.post.id),
					userLiked: userLikedSet.has(p.post.id),
				})),
				nextCursor,
			};
		}),

	// Get single post with details
	getPost: publicProcedure
		.input(z.object({ postId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const [postData] = await ctx.db
				.select({
					post: posts,
					author: {
						id: user.id,
						name: user.name,
						email: user.email,
						image: user.image,
					},
					medication: {
						id: medications.id,
						name: medications.name,
						brandName: medications.brandName,
					},
				})
				.from(posts)
				.leftJoin(user, eq(posts.userId, user.id))
				.leftJoin(medications, eq(posts.medicationId, medications.id))
				.where(eq(posts.id, input.postId))
				.limit(1);

			if (!postData) {
				throw new Error("Post not found");
			}

			// Get likes
			const likesCount = await ctx.db
				.select({ count: count() })
				.from(postLikes)
				.where(eq(postLikes.postId, input.postId));

			const userId = "session" in ctx && ctx.session?.user?.id
				? ctx.session.user.id
				: null;
			const userLiked = userId
				? await ctx.db
						.select()
						.from(postLikes)
						.where(
							and(
								eq(postLikes.postId, input.postId),
								eq(postLikes.userId, userId),
							),
						)
						.limit(1)
						.then((r) => r.length > 0)
				: false;

			// Get comments
			const comments = await ctx.db
				.select({
					comment: postComments,
					author: {
						id: user.id,
						name: user.name,
						image: user.image,
					},
				})
				.from(postComments)
				.leftJoin(user, eq(postComments.userId, user.id))
				.where(eq(postComments.postId, input.postId))
				.orderBy(desc(postComments.createdAt));

			// Get images
			const images = await ctx.db
				.select()
				.from(postImages)
				.where(eq(postImages.postId, input.postId))
				.orderBy(postImages.order);

			return {
				...postData.post,
				author: postData.author,
				medication: postData.medication,
				likesCount: likesCount[0]?.count || 0,
				userLiked,
				comments: comments.map((c) => ({
					...c.comment,
					author: c.author,
				})),
				images,
			};
		}),

	// Create a new post
	createPost: protectedProcedure
		.input(
			z.object({
				medicationId: z.string().uuid().optional(),
				medicationName: z.string().optional(),
				title: z.string().min(1).max(200),
				content: z.string().min(1).max(5000),
				rating: z.number().min(1).max(5).optional(),
				experienceType: z
					.enum(["positive", "negative", "neutral", "side_effects"])
					.optional(),
				isPublic: z.boolean().default(true),
				imageUrls: z.array(z.string().url()).max(5).optional().default([]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [newPost] = await ctx.db
				.insert(posts)
				.values({
					userId: ctx.session.user.id,
					medicationId: input.medicationId,
					medicationName: input.medicationName,
					title: input.title,
					content: input.content,
					rating: input.rating,
					experienceType: input.experienceType,
					isPublic: input.isPublic,
				})
				.returning();

			// Insert images if provided
			if (input.imageUrls && input.imageUrls.length > 0) {
				await ctx.db.insert(postImages).values(
					input.imageUrls.map((url, index) => ({
						postId: newPost.id,
						imageUrl: url,
						order: index,
					})),
				);
			}

			// If rating provided, create/update medication rating
			if (input.rating && input.medicationId) {
				await ctx.db
					.insert(medicationRatings)
					.values({
						medicationId: input.medicationId,
						userId: ctx.session.user.id,
						rating: input.rating,
						postId: newPost.id,
					})
					.onConflictDoUpdate({
						target: [medicationRatings.medicationId, medicationRatings.userId],
						set: {
							rating: input.rating,
							postId: newPost.id,
							updatedAt: new Date(),
						},
					});
			}

			return newPost;
		}),

	// Update post
	updatePost: protectedProcedure
		.input(
			z.object({
				postId: z.string().uuid(),
				title: z.string().min(1).max(200).optional(),
				content: z.string().min(1).max(5000).optional(),
				rating: z.number().min(1).max(5).optional(),
				experienceType: z
					.enum(["positive", "negative", "neutral", "side_effects"])
					.optional(),
				isPublic: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { postId, ...updates } = input;

			// Verify ownership
			const [existingPost] = await ctx.db
				.select()
				.from(posts)
				.where(
					and(eq(posts.id, postId), eq(posts.userId, ctx.session.user.id)),
				)
				.limit(1);

			if (!existingPost) {
				throw new Error("Post not found or unauthorized");
			}

			const [updatedPost] = await ctx.db
				.update(posts)
				.set(updates)
				.where(eq(posts.id, postId))
				.returning();

			return updatedPost;
		}),

	// Delete post
	deletePost: protectedProcedure
		.input(z.object({ postId: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			// Verify ownership
			const [existingPost] = await ctx.db
				.select()
				.from(posts)
				.where(
					and(eq(posts.id, input.postId), eq(posts.userId, ctx.session.user.id)),
				)
				.limit(1);

			if (!existingPost) {
				throw new Error("Post not found or unauthorized");
			}

			await ctx.db.delete(posts).where(eq(posts.id, input.postId));

			return { success: true };
		}),

	// Like/Unlike post
	toggleLike: protectedProcedure
		.input(z.object({ postId: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const existingLike = await ctx.db
				.select()
				.from(postLikes)
				.where(
					and(
						eq(postLikes.postId, input.postId),
						eq(postLikes.userId, ctx.session.user.id),
					),
				)
				.limit(1);

			if (existingLike.length > 0) {
				// Unlike
				await ctx.db
					.delete(postLikes)
					.where(
						and(
							eq(postLikes.postId, input.postId),
							eq(postLikes.userId, ctx.session.user.id),
						),
					);
				return { liked: false };
			} else {
				// Like
				await ctx.db.insert(postLikes).values({
					postId: input.postId,
					userId: ctx.session.user.id,
				});
				return { liked: true };
			}
		}),

	// Add comment
	addComment: protectedProcedure
		.input(
			z.object({
				postId: z.string().uuid(),
				content: z.string().min(1).max(1000),
				parentCommentId: z.string().uuid().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [newComment] = await ctx.db
				.insert(postComments)
				.values({
					postId: input.postId,
					userId: ctx.session.user.id,
					content: input.content,
					parentCommentId: input.parentCommentId,
				})
				.returning();

			// Get comment with author info
			const [commentWithAuthor] = await ctx.db
				.select({
					comment: postComments,
					author: {
						id: user.id,
						name: user.name,
						image: user.image,
					},
				})
				.from(postComments)
				.leftJoin(user, eq(postComments.userId, user.id))
				.where(eq(postComments.id, newComment.id))
				.limit(1);

			return commentWithAuthor;
		}),

	// Delete comment
	deleteComment: protectedProcedure
		.input(z.object({ commentId: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			// Verify ownership
			const [existingComment] = await ctx.db
				.select()
				.from(postComments)
				.where(
					and(
						eq(postComments.id, input.commentId),
						eq(postComments.userId, ctx.session.user.id),
					),
				)
				.limit(1);

			if (!existingComment) {
				throw new Error("Comment not found or unauthorized");
			}

			await ctx.db
				.delete(postComments)
				.where(eq(postComments.id, input.commentId));

			return { success: true };
		}),

	// Get medication ratings summary
	getMedicationRatings: publicProcedure
		.input(z.object({ medicationId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const ratings = await ctx.db
				.select({
					rating: medicationRatings.rating,
					count: count(),
				})
				.from(medicationRatings)
				.where(eq(medicationRatings.medicationId, input.medicationId))
				.groupBy(medicationRatings.rating);

			const totalRatings = await ctx.db
				.select({ count: count() })
				.from(medicationRatings)
				.where(eq(medicationRatings.medicationId, input.medicationId));

			const averageRating = await ctx.db
				.select({
					avg: sql<number>`AVG(${medicationRatings.rating})`,
				})
				.from(medicationRatings)
				.where(eq(medicationRatings.medicationId, input.medicationId));

			return {
				totalRatings: totalRatings[0]?.count || 0,
				averageRating: averageRating[0]?.avg
					? Number(averageRating[0].avg.toFixed(2))
					: 0,
				ratingDistribution: ratings.map((r) => ({
					rating: r.rating,
					count: r.count,
				})),
			};
		}),

	// Follow/Unfollow user
	toggleFollow: protectedProcedure
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			if (input.userId === ctx.session.user.id) {
				throw new Error("Cannot follow yourself");
			}

			const existingFollow = await ctx.db
				.select()
				.from(userFollows)
				.where(
					and(
						eq(userFollows.followerId, ctx.session.user.id),
						eq(userFollows.followingId, input.userId),
					),
				)
				.limit(1);

			if (existingFollow.length > 0) {
				// Unfollow
				await ctx.db
					.delete(userFollows)
					.where(
						and(
							eq(userFollows.followerId, ctx.session.user.id),
							eq(userFollows.followingId, input.userId),
						),
					);
				return { following: false };
			} else {
				// Follow
				await ctx.db.insert(userFollows).values({
					followerId: ctx.session.user.id,
					followingId: input.userId,
				});
				return { following: true };
			}
		}),

	// Get user's posts
	getUserPosts: publicProcedure
		.input(
			z.object({
				userId: z.string(),
				limit: z.number().min(1).max(50).default(20),
				cursor: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const conditions = [eq(posts.userId, input.userId)];

			// If not viewing own posts, only show public
			const userId = "session" in ctx && ctx.session?.user?.id
				? ctx.session.user.id
				: null;
			if (input.userId !== userId) {
				conditions.push(eq(posts.isPublic, true));
			}

			if (input.cursor) {
				conditions.push(
					sql`${posts.createdAt} < (SELECT created_at FROM posts WHERE id = ${input.cursor})`,
				);
			}

			const userPosts = await ctx.db
				.select({
					post: posts,
					medication: {
						id: medications.id,
						name: medications.name,
						brandName: medications.brandName,
					},
				})
				.from(posts)
				.leftJoin(medications, eq(posts.medicationId, medications.id))
				.where(and(...conditions))
				.orderBy(desc(posts.createdAt))
				.limit(input.limit + 1);

			let nextCursor: string | undefined = undefined;
			if (userPosts.length > input.limit) {
				const nextItem = userPosts.pop();
				nextCursor = nextItem?.post.id;
			}

			return {
				posts: userPosts.map((p) => ({
					...p.post,
					medication: p.medication,
				})),
				nextCursor,
			};
		}),
});
