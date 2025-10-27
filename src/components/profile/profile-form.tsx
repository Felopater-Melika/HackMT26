"use client";

import { ConditionsSelector } from "@/components/conditions-selector";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const profileSchema = z.object({
	name: z.string().min(1, "Name is required"),
	age: z
		.number()
		.min(1, "Age must be at least 1")
		.max(120, "Age must be at most 120"),
	gender: z.string().min(1, "Please select a gender"),
	conditionIds: z.array(z.string()).default([]),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
	onSuccess?: () => void;
	variant?: "page" | "modal";
}

export function ProfileForm({ onSuccess, variant = "page" }: ProfileFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
	const router = useRouter();

	const { data: profile, isLoading: profileLoading } =
		api.profile.getProfile.useQuery();
	const { data: userConditions = [] } =
		api.conditions.getUserConditions.useQuery();

	const updateProfile = api.profile.updateProfile.useMutation({
		onSuccess: () => {
			if (variant === "modal" && onSuccess) {
				onSuccess();
			} else {
				// Redirect to /app after successful update
				router.push("/app");
			}
		},
		onError: (error) => {
			console.error("Failed to update profile:", error);
		},
	});

	const form = useForm({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			name: "",
			age: 0,
			gender: "",
			conditionIds: [],
		},
	});

	// Update form when profile data loads
	useEffect(() => {
		if (profile) {
			const formData = {
				name: profile.name || "",
				age: profile.age || 0,
				gender: profile.gender || "",
				conditionIds: userConditions.map((c) => c.id),
			};
			console.log("Setting form data:", formData); // Debug log
			form.reset(formData);
			setSelectedConditions(userConditions.map((c) => c.id));
		}
	}, [profile, userConditions, form]);

	const onSubmit = async (data: ProfileFormData) => {
		setIsSubmitting(true);
		try {
			await updateProfile.mutateAsync({
				name: data.name,
				age: data.age,
				gender: data.gender,
				conditionIds: selectedConditions,
			});
		} catch (error) {
			console.error("Error updating profile:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (profileLoading && variant === "page") {
		return (
			<div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-2xl">
					<div className="animate-pulse">
						<div className="mb-6 h-8 w-1/4 rounded bg-gray-200" />
						<div className="rounded-lg bg-white p-6 shadow">
							<div className="space-y-4">
								<div className="h-4 w-1/2 rounded bg-gray-200" />
								<div className="h-10 rounded bg-gray-200" />
								<div className="h-4 w-1/2 rounded bg-gray-200" />
								<div className="h-10 rounded bg-gray-200" />
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	const formContent = (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input placeholder="Enter your name" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="age"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Age</FormLabel>
							<FormControl>
								<Input
									type="number"
									placeholder="Enter your age"
									{...field}
									onChange={(e) =>
										field.onChange(Number.parseInt(e.target.value) || 0)
									}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="gender"
					render={({ field }) => {
						console.log("Gender field value:", field.value); // Debug log
						return (
							<FormItem>
								<FormLabel>Gender</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select your gender" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="male">Male</SelectItem>
										<SelectItem value="female">Female</SelectItem>
										<SelectItem value="other">Other</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						);
					}}
				/>

				<Separator />

				<FormItem>
					<FormLabel>Medical Conditions</FormLabel>
					<FormControl>
						<ConditionsSelector
							selectedConditions={selectedConditions}
							onSelectionChange={setSelectedConditions}
							placeholder="Search for conditions..."
						/>
					</FormControl>
					<FormMessage />
				</FormItem>

				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? "Updating Profile..." : "Update Profile"}
				</Button>
			</form>
		</Form>
	);

	if (variant === "modal") {
		return formContent;
	}

	return (
		<div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-2xl">
				<div className="mb-8">
					<h1 className="font-bold text-3xl text-gray-900">Profile Settings</h1>
					<p className="mt-2 text-gray-600">
						Update your personal information and medical conditions
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Personal Information</CardTitle>
						<CardDescription>
							Update your basic profile information
						</CardDescription>
					</CardHeader>
					<CardContent>{formContent}</CardContent>
				</Card>
			</div>
		</div>
	);
}
