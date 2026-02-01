"use client";

import { PostForm } from "@/components/social/PostForm";
import { Nav } from "@/components/Nav";
import { useParams } from "next/navigation";

export default function EditPostPage() {
	const params = useParams();
	const postId = params.postId as string;

	return (
		<div className="min-h-screen bg-background">
			<Nav />
			<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
				<PostForm postId={postId} />
			</div>
		</div>
	);
}
