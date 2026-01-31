"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/social/PostCard";
import { PostForm } from "@/components/social/PostForm";
import { Nav } from "@/components/Nav";
import { api } from "@/trpc/react";
import { Plus, Loader2, MessageSquare } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function SocialFeedPage() {
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [filterMedication, setFilterMedication] = useState<string | undefined>();
	const [searchQuery, setSearchQuery] = useState("");
	const router = useRouter();

	const { data: session } = authClient.useSession();

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		refetch,
	} = api.social.getFeed.useInfiniteQuery(
		{
			limit: 20,
			medicationId: filterMedication,
		},
		{
			getNextPageParam: (lastPage) => lastPage.nextCursor,
		},
	);

	const posts = data?.pages.flatMap((page) => page.posts) ?? [];

	const filteredPosts = searchQuery
		? posts.filter(
				(post) =>
					post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
					post.medicationName?.toLowerCase().includes(searchQuery.toLowerCase()),
			)
		: posts;

	if (!session) {
		router.push("/app/signin");
		return null;
	}

	return (
		<div className="min-h-screen bg-background">
			<Nav />
			<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
			{/* Header */}
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl text-foreground">Community</h1>
					<p className="mt-2 text-muted-foreground">
						Share your medication experiences and learn from others
					</p>
				</div>
				<Button onClick={() => setShowCreateForm(!showCreateForm)}>
					<Plus className="mr-2 h-4 w-4" />
					New Post
				</Button>
			</div>

			{/* Create Post Form */}
			{showCreateForm && (
				<div className="mb-8">
					<PostForm
						onSuccess={() => {
							setShowCreateForm(false);
							refetch();
						}}
					/>
				</div>
			)}

			{/* Filters */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row">
				<Input
					placeholder="Search posts..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="flex-1"
				/>
				<Select
					value={filterMedication || "all"}
					onValueChange={(value) =>
						setFilterMedication(value === "all" ? undefined : value)
					}
				>
					<SelectTrigger className="w-full sm:w-[200px]">
						<SelectValue placeholder="Filter by medication" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Medications</SelectItem>
						{/* TODO: Add medication list from API */}
					</SelectContent>
				</Select>
			</div>

			{/* Posts Feed */}
			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			) : filteredPosts.length === 0 ? (
				<div className="rounded-lg border bg-card p-12 text-center">
					<MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
					<h3 className="mt-4 font-semibold text-lg text-foreground">
						No posts yet
					</h3>
					<p className="mt-2 text-sm text-muted-foreground">
						Be the first to share your medication experience!
					</p>
					<Button
						onClick={() => setShowCreateForm(true)}
						className="mt-4"
					>
						<Plus className="mr-2 h-4 w-4" />
						Create First Post
					</Button>
				</div>
			) : (
				<div className="space-y-6">
					{filteredPosts.map((post) => (
						<PostCard
							key={post.id}
							post={post}
							currentUserId={session.user.id}
						/>
					))}

					{/* Load More */}
					{hasNextPage && (
						<div className="flex justify-center pt-4">
							<Button
								variant="outline"
								onClick={() => fetchNextPage()}
								disabled={isFetchingNextPage}
							>
								{isFetchingNextPage ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Loading...
									</>
								) : (
									"Load More"
								)}
							</Button>
						</div>
					)}
				</div>
			)}
			</div>
		</div>
	);
}
