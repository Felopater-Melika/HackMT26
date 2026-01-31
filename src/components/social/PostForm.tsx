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
import { Star, X, Upload, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface PostFormProps {
	medicationId?: string;
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
	const [rating, setRating] = useState<number | undefined>();
	const [experienceType, setExperienceType] = useState<
		"positive" | "negative" | "neutral" | "side_effects" | undefined
	>();
	const [isPublic, setIsPublic] = useState(true);
	const [imageUrls, setImageUrls] = useState<string[]>([]);
	const [uploading, setUploading] = useState(false);

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
			setImageUrls(existingPost.images.map((img) => img.imageUrl));
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

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		setUploading(true);
		// TODO: Implement actual image upload (UploadThing or similar)
		// For now, we'll use a placeholder
		// In production, you'd upload to UploadThing and get URLs
		const newUrls: string[] = [];
		for (const file of Array.from(files)) {
			// Create a temporary URL for preview
			const url = URL.createObjectURL(file);
			newUrls.push(url);
		}
		setImageUrls([...imageUrls, ...newUrls].slice(0, 5));
		setUploading(false);
	};

	const removeImage = (index: number) => {
		setImageUrls(imageUrls.filter((_, i) => i !== index));
	};

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
			createPost({
				medicationId,
				medicationName: initialMedicationName,
				title: title.trim(),
				content: content.trim(),
				rating,
				experienceType,
				isPublic,
				imageUrls: imageUrls.filter((url) => url.startsWith("http")), // Only real URLs
			});
		}
	};

	return (
		<Card className="p-6">
			<h2 className="mb-6 font-bold text-2xl text-foreground">
				{postId ? "Edit Post" : "Share Your Experience"}
			</h2>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Medication Info (if provided) */}
				{(medicationId || initialMedicationName) && (
					<div className="p-3 rounded-lg bg-muted">
						<p className="text-sm text-muted-foreground">Medication</p>
						<p className="font-medium text-foreground">
							{initialMedicationName || "Selected medication"}
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

				{/* Images */}
				<div className="space-y-2">
					<Label>Images (Optional, max 5)</Label>
					<div className="space-y-2">
						{imageUrls.length < 5 && (
							<label className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
								<input
									type="file"
									accept="image/*"
									multiple
									onChange={handleImageUpload}
									className="hidden"
									disabled={uploading}
								/>
								<div className="text-center">
									{uploading ? (
										<Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
									) : (
										<>
											<Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
											<p className="text-sm text-muted-foreground">
												Click to upload images
											</p>
										</>
									)}
								</div>
							</label>
						)}
						{imageUrls.length > 0 && (
							<div className="grid grid-cols-3 gap-2">
								{imageUrls.map((url, index) => (
									<div
										key={index}
										className="relative aspect-square rounded-lg overflow-hidden bg-muted"
									>
										<Image
											src={url}
											alt={`Upload ${index + 1}`}
											fill
											className="object-cover"
										/>
										<Button
											type="button"
											variant="destructive"
											size="icon"
											className="absolute top-1 right-1 h-6 w-6"
											onClick={() => removeImage(index)}
										>
											<X className="h-3 w-3" />
										</Button>
									</div>
								))}
							</div>
						)}
					</div>
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
