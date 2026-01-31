"use client";

import { PostForm } from "@/components/social/PostForm";
import { Nav } from "@/components/Nav";
import { useSearchParams } from "next/navigation";

export default function CreatePostPage() {
	const searchParams = useSearchParams();
	const medicationId = searchParams.get("medicationId") || undefined;
	const medicationName = searchParams.get("medicationName") || undefined;

	return (
		<div className="min-h-screen bg-background">
			<Nav />
			<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
				<PostForm
					medicationId={medicationId}
					medicationName={medicationName}
				/>
			</div>
		</div>
	);
}
