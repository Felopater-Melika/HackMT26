"use client";

import { Suspense } from "react";
import { PostForm } from "@/components/social/PostForm";
import { Nav } from "@/components/Nav";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function CreatePostContent() {
	const searchParams = useSearchParams();
	const medicationId = searchParams.get("medicationId") || undefined;
	const medicationName = searchParams.get("medicationName") || undefined;

	return (
		<PostForm
			medicationId={medicationId}
			medicationName={medicationName}
		/>
	);
}

export default function CreatePostPage() {
	return (
		<div className="min-h-screen bg-background">
			<Nav />
			<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
				<Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
					<CreatePostContent />
				</Suspense>
			</div>
		</div>
	);
}
