"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

interface CommentSectionProps {
	postId: string;
	currentUserId?: string;
}

export function CommentSection({
	postId,
	currentUserId,
}: CommentSectionProps) {
	const [commentText, setCommentText] = useState("");
	const utils = api.useUtils();

	const { data: postData } = api.social.getPost.useQuery({ postId });

	const { mutate: addComment, isPending: isAdding } =
		api.social.addComment.useMutation({
			onSuccess: () => {
				setCommentText("");
				utils.social.getPost.invalidate({ postId });
				utils.social.getFeed.invalidate();
			},
		});

	const { mutate: deleteComment } = api.social.deleteComment.useMutation({
		onSuccess: () => {
			utils.social.getPost.invalidate({ postId });
			utils.social.getFeed.invalidate();
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (commentText.trim() && currentUserId) {
			addComment({
				postId,
				content: commentText.trim(),
			});
		}
	};

	const comments = postData?.comments || [];

	return (
		<div className="space-y-4">
			{/* Comment Form */}
			{currentUserId && (
				<form onSubmit={handleSubmit} className="flex gap-2">
					<Input
						placeholder="Write a comment..."
						value={commentText}
						onChange={(e) => setCommentText(e.target.value)}
						disabled={isAdding}
						className="flex-1"
					/>
					<Button type="submit" disabled={isAdding || !commentText.trim()}>
						<Send className="h-4 w-4" />
					</Button>
				</form>
			)}

			{/* Comments List */}
			<div className="space-y-3">
				{comments.length === 0 ? (
					<p className="text-sm text-muted-foreground text-center py-4">
						No comments yet. Be the first to comment!
					</p>
				) : (
					comments.map((comment) => {
						const isOwner = currentUserId === comment.userId;
						return (
							<div
								key={comment.id}
								className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
							>
								<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
									{comment.author?.image ? (
										<Image
											src={comment.author.image}
											alt={comment.author.name || "User"}
											width={32}
											height={32}
											className="rounded-full"
										/>
									) : (
										<span className="text-primary text-xs font-semibold">
											{comment.author?.name?.charAt(0).toUpperCase() || "U"}
										</span>
									)}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between gap-2 mb-1">
										<div>
											<span className="font-semibold text-sm text-foreground">
												{comment.author?.name || "Anonymous"}
											</span>
											<span className="text-xs text-muted-foreground ml-2">
												{formatDistanceToNow(new Date(comment.createdAt), {
													addSuffix: true,
												})}
											</span>
										</div>
										{isOwner && (
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6"
												onClick={() => {
													if (
														confirm(
															"Are you sure you want to delete this comment?",
														)
													) {
														deleteComment({ commentId: comment.id });
													}
												}}
											>
												<Trash2 className="h-3 w-3 text-destructive" />
											</Button>
										)}
									</div>
									<p className="text-sm text-foreground whitespace-pre-wrap">
										{comment.content}
									</p>
								</div>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}
