"use client";

import { useState } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import { Star, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PostFormProps {
	/** Required when creating a post (community feature requires a medication). */
	medicationId?: string;
	/** Optional display label when creating (e.g. from URL); not sent to API. */
	medicationName?: string;
	postId?: string; // For editing
	onSuccess?: () => void;
}

export function PostForm({
	medicationId,
	medicationName: initialMedicationName,
	postId,
	onSuccess,
}: PostFormProps) {
	const router = useRouter();
	const utils = api.useUtils();

	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [selectedMedicationId, setSelectedMedicationId] = useState<string>(
		medicationId ?? "",
	);
	const [rating, setRating] = useState<number | undefined>();
	const [experienceType, setExperienceType] = useState<
		"positive" | "negative" | "neutral" | "side_effects" | undefined
	>();
	const [isPublic, setIsPublic] = useState(true);

	// Sync prop into state when URL has medicationId
	React.useEffect(() => {
		if (medicationId) setSelectedMedicationId(medicationId);
	}, [medicationId]);

	// Load current user's medications for dropdown (when creating)
	const { data: myMedications } = api.social.getMyMedications.useQuery(
		undefined,
		{ enabled: !postId },
	);

	// Load existing post data if editing
	const { data: existingPost } = api.social.getPost.useQuery(
		{ postId: postId! },
		{ enabled: !!postId },
	);

	// Populate form if editing (using useEffect to avoid state issues)
	React.useEffect(() => {
		if (existingPost && postId) {
			setTitle(existingPost.title);
			setContent(existingPost.content);
			setRating(existingPost.rating || undefined);
			setExperienceType(
				(existingPost.experienceType as typeof experienceType) || undefined,
			);
			setIsPublic(existingPost.isPublic);
		}
	}, [existingPost, postId]);

	const { mutate: createPost, isPending: isCreating } =
		api.social.createPost.useMutation({
			onSuccess: () => {
				utils.social.getFeed.invalidate();
				if (onSuccess) {
					onSuccess();
				} else {
					router.push("/app/social");
				}
			},
			onError: (error) => {
				console.error("Failed to create post:", error);
				toast.error(`Failed to create post: ${error.message}`);
			},
		});

	const { mutate: updatePost, isPending: isUpdating } =
		api.social.updatePost.useMutation({
			onSuccess: () => {
				utils.social.getFeed.invalidate();
				utils.social.getPost.invalidate({ postId: postId! });
				if (onSuccess) {
					onSuccess();
				} else {
					router.push("/app/social");
				}
			},
		});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim() || !content.trim()) return;

		if (postId) {
			updatePost({
				postId,
				title: title.trim(),
				content: content.trim(),
				rating,
				experienceType,
				isPublic,
			});
		} else {
			if (!selectedMedicationId) {
				toast.error("Please select a medication to share an experience.");
				return;
			}
			createPost({
				medicationId: selectedMedicationId,
				title: title.trim(),
				content: content.trim(),
				rating: rating || undefined,
				experienceType: experienceType || undefined,
				isPublic,
				// Fix: Remove imageUrls property, since it's not supported by the type
			});
		}
	};

	return (
		<Card className="p-6">
			<h2 className="mb-2 font-bold text-2xl text-foreground">
				{postId ? "Edit Post" : "Share Your Experience"}
			</h2>
			<p className="mb-6 text-muted-foreground text-sm">
				Help others by sharing how a medication worked for you. Include the
				medication name, your experience, and optionally a rating or experience
				type.
			</p>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Medication dropdown (when creating) */}
				{!postId && (
					<div className="space-y-2">
						<Label>Medication *</Label>
						{myMedications && myMedications.length > 0 ? (
							<Select
								value={selectedMedicationId}
								onValueChange={setSelectedMedicationId}
								required
							>
								<SelectTrigger>
									<SelectValue placeholder="Select a medication to share your experience" />
								</SelectTrigger>
								<SelectContent>
									{myMedications.map((med) => (
										<SelectItem key={med.id} value={med.id}>
											{med.name ?? med.brandName ?? med.id}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : (
							<div className="p-3 rounded-lg border border-dashed bg-muted/50 text-muted-foreground text-sm">
								No medications in your list yet. Add medications from a scan or
								your dashboard first, then come back to share an experience.
							</div>
						)}
					</div>
				)}

				{/* Medication display when prefilled from URL */}
				{!postId && (medicationId || initialMedicationName) && selectedMedicationId && (
					<div className="p-3 rounded-lg bg-muted">
						<p className="text-sm text-muted-foreground">Sharing experience for</p>
						<p className="font-medium text-foreground">
							{initialMedicationName ??
								myMedications?.find((m) => m.id === selectedMedicationId)?.name ??
								myMedications?.find((m) => m.id === selectedMedicationId)?.brandName ??
								"Selected medication"}
						</p>
					</div>
				)}

				{/* Title */}
				<div className="space-y-2">
					<Label htmlFor="title">Title *</Label>
					<Input
						id="title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Share your experience with this medication..."
						maxLength={200}
						required
					/>
				</div>

				{/* Content */}
				<div className="space-y-2">
					<Label htmlFor="content">Your Experience *</Label>
					<textarea
						id="content"
						value={content}
						onChange={(e) => setContent(e.target.value)}
						placeholder="Describe how this medication worked for you, any side effects, or helpful tips..."
						className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						maxLength={5000}
						required
					/>
					<p className="text-xs text-muted-foreground">
						{content.length}/5000 characters
					</p>
				</div>

				{/* Rating */}
				<div className="space-y-2">
					<Label>Rating (Optional)</Label>
					<div className="flex items-center gap-2">
						{[1, 2, 3, 4, 5].map((star) => (
							<button
								key={star}
								type="button"
								onClick={() => setRating(rating === star ? undefined : star)}
								className="focus:outline-none"
							>
								<Star
									className={`h-6 w-6 ${
										rating && star <= rating
											? "fill-yellow-400 text-yellow-400"
											: "text-muted-foreground"
									}`}
								/>
							</button>
						))}
						{rating && (
							<span className="ml-2 text-sm text-muted-foreground">
								{rating}/5 stars
							</span>
						)}
					</div>
				</div>

				{/* Experience Type */}
				<div className="space-y-2">
					<Label htmlFor="experienceType">Experience Type</Label>
					<Select
						value={experienceType || ""}
						onValueChange={(value) =>
							setExperienceType(
								value as typeof experienceType,
							)
						}
					>
						<SelectTrigger id="experienceType">
							<SelectValue placeholder="Select experience type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="positive">Positive Experience</SelectItem>
							<SelectItem value="negative">Negative Experience</SelectItem>
							<SelectItem value="neutral">Neutral Experience</SelectItem>
							<SelectItem value="side_effects">Side Effects Reported</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Privacy */}
				<div className="flex items-center gap-2">
					<input
						type="checkbox"
						id="isPublic"
						checked={isPublic}
						onChange={(e) => setIsPublic(e.target.checked)}
						className="h-4 w-4 rounded border-input"
					/>
					<Label htmlFor="isPublic" className="cursor-pointer">
						Make this post public
					</Label>
				</div>

				{/* Submit */}
				<div className="flex gap-2">
					<Button
						type="submit"
						disabled={isCreating || isUpdating || !title.trim() || !content.trim()}
						className="flex-1"
					>
						{isCreating || isUpdating ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{postId ? "Updating..." : "Posting..."}
							</>
						) : (
							<>{postId ? "Update Post" : "Share Experience"}</>
						)}
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => router.back()}
					>
						Cancel
					</Button>
				</div>
			</form>
		</Card>
	);
}
