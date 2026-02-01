"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/trpc/react";
import {
	Heart,
	MessageCircle,
	Star,
	MoreVertical,
	Trash2,
	Edit,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { CommentSection } from "./CommentSection";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";

interface PostCardProps {
	post: {
		id: string;
		title: string;
		content: string;
		rating?: number | null;
		experienceType?: string | null;
		medication?: {
			id: string;
			name: string | null;
			brandName: string | null;
		} | null;
		author: {
			id: string;
			name: string | null;
			image: string | null;
		} | null;
		createdAt: Date;
		likesCount: number;
		commentsCount: number;
		userLiked: boolean;
		images: Array<{
			id: string;
			imageUrl: string;
			order: number;
		}>;
		userId: string;
	};
	currentUserId?: string;
}

export function PostCard({ post, currentUserId }: PostCardProps) {
	const [showComments, setShowComments] = useState(false);
	const router = useRouter();
	const utils = api.useUtils();

	const { mutate: toggleLike, isPending: isLiking } =
		api.social.toggleLike.useMutation({
			onSuccess: () => {
				utils.social.getFeed.invalidate();
			},
		});

	const { mutate: deletePost, isPending: isDeleting } =
		api.social.deletePost.useMutation({
			onSuccess: () => {
				utils.social.getFeed.invalidate();
			},
		});

	const isOwner = currentUserId === post.userId;
	const medicationName =
		post.medication?.name || post.medication?.brandName || null;

	const experienceColors = {
		positive: "text-green-600",
		negative: "text-red-600",
		neutral: "text-gray-600",
		side_effects: "text-orange-600",
	};

	const experienceLabels = {
		positive: "Positive Experience",
		negative: "Negative Experience",
		neutral: "Neutral Experience",
		side_effects: "Side Effects Reported",
	};

	return (
		<Card className="p-6 space-y-4">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
						{post.author?.image ? (
							<Image
								src={post.author.image}
								alt={post.author.name || "User"}
								width={40}
								height={40}
								className="rounded-full"
							/>
						) : (
							<span className="text-primary font-semibold">
								{post.author?.name?.charAt(0).toUpperCase() || "U"}
							</span>
						)}
					</div>
					<div>
						<div className="font-semibold text-foreground">
							{post.author?.name || "Anonymous"}
						</div>
						<div className="text-sm text-muted-foreground">
							{formatDistanceToNow(new Date(post.createdAt), {
								addSuffix: true,
							})}
						</div>
					</div>
				</div>

				{isOwner && (
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<MoreVertical className="h-4 w-4" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-40 p-1">
							<Button
								variant="ghost"
								className="w-full justify-start"
								onClick={() => router.push(`/app/social/post/${post.id}/edit`)}
							>
								<Edit className="mr-2 h-4 w-4" />
								Edit
							</Button>
							<Button
								variant="ghost"
								className="w-full justify-start text-destructive"
								onClick={() => {
									if (
										confirm("Are you sure you want to delete this post?")
									) {
										deletePost({ postId: post.id });
									}
								}}
								disabled={isDeleting}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete
							</Button>
						</PopoverContent>
					</Popover>
				)}
			</div>

			{/* Medication, Rating & Experience Type */}
			{(medicationName || post.rating != null || post.experienceType) && (
				<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
					{medicationName && (
						<span className="flex items-center gap-1.5">
							<span className="font-medium text-foreground">Medication:</span>
							<span className="text-muted-foreground">{medicationName}</span>
						</span>
					)}
					{post.rating != null && post.rating > 0 && (
						<div className="flex items-center gap-1">
							<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
							<span className="font-medium">{post.rating}/5</span>
						</div>
					)}
					{post.experienceType && (
						<span
							className={`font-medium ${experienceColors[post.experienceType as keyof typeof experienceColors] || ""}`}
						>
							{experienceLabels[post.experienceType as keyof typeof experienceLabels] || post.experienceType}
						</span>
					)}
				</div>
			)}

			{/* Title */}
			<h3 className="font-bold text-xl text-foreground">{post.title}</h3>

			{/* Content */}
			<p className="text-foreground whitespace-pre-wrap">{post.content}</p>

			{/* Actions */}
			<div className="flex items-center gap-6 pt-2 border-t">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => toggleLike({ postId: post.id })}
					disabled={isLiking || !currentUserId}
					className={post.userLiked ? "text-red-600" : ""}
				>
					<Heart
						className={`h-5 w-5 mr-2 ${post.userLiked ? "fill-red-600" : ""}`}
					/>
					{post.likesCount}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setShowComments(!showComments)}
				>
					<MessageCircle className="h-5 w-5 mr-2" />
					{post.commentsCount}
				</Button>
			</div>

			{/* Comments Section */}
			{showComments && (
				<div className="pt-4 border-t">
					<CommentSection postId={post.id} currentUserId={currentUserId} />
				</div>
			)}
		</Card>
	);
}
