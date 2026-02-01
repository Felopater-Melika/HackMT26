"use client";

import { useEffect } from "react";
import { PostCard } from "@/components/social/PostCard";
import { Nav } from "@/components/Nav";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function PostDetailPage({
	params,
}: {
	params: { postId: string };
}) {
	const router = useRouter();
	const { data: session, isPending: sessionLoading } = authClient.useSession();

	// Redirect if not authenticated
	useEffect(() => {
		if (!sessionLoading && !session) {
			router.push("/app/signin");
		}
	}, [session, sessionLoading, router]);

	const { data: post, isLoading } = api.social.getPost.useQuery(
		{
			postId: params.postId,
		},
		{
			enabled: !!session, // Only fetch if authenticated
		},
	);

	if (sessionLoading || !session) {
		return (
			<div className="min-h-screen bg-background">
				<Nav />
				<div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background">
				<Nav />
				<div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			</div>
		);
	}

	if (!post) {
		return (
			<div className="min-h-screen bg-background">
				<Nav />
				<div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
					<div className="rounded-lg border bg-card p-12 text-center">
						<h3 className="font-semibold text-lg text-foreground">
							Post not found
						</h3>
						<p className="mt-2 text-sm text-muted-foreground">
							This post may have been deleted or doesn't exist.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<Nav />
			<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
				<PostCard post={post} currentUserId={session.user.id} />
			</div>
		</div>
	);
}
