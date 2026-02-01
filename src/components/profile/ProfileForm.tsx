"use client";

import { AllergiesSelector } from "@/components/AllergiesSelector";
import { ConditionsSelector } from "@/components/ConditionsSelector";
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
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";

const profileSchema = z.object({
	name: z.string().min(1, "Name is required"),
	age: z
		.number()
		.min(1, "Age must be at least 1")
		.max(120, "Age must be at most 120"),
	gender: z.string().min(1, "Please select a gender"),
	conditionIds: z.array(z.string()),
	allergyIds: z.array(z.string()),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
	onSuccess?: () => void;
	variant?: "page" | "modal";
}

export function ProfileForm({ onSuccess, variant = "page" }: ProfileFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
	const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
	const router = useRouter();

	const { data: profile, isLoading: profileLoading } =
		api.profile.getProfile.useQuery();
	const { data: userConditions = [], isLoading: conditionsLoading } =
		api.conditions.getUserConditions.useQuery();
	const { data: userAllergies = [], isLoading: allergiesLoading } =
		api.allergies.getUserAllergies.useQuery();

	const utils = api.useUtils();
	const updateProfile = api.profile.updateProfile.useMutation({
		onSuccess: () => {
			toast.success("Profile updated successfully!");
			utils.profile.getProfile.invalidate();
			utils.conditions.getUserConditions.invalidate();
			utils.allergies.getUserAllergies.invalidate();

			if (variant === "modal" && onSuccess) {
				onSuccess();
			}
		},
		onError: (error) => {
			console.error("Failed to update profile:", error);
			toast.error("Failed to update profile", {
				description: error.message,
			});
		},
	});

	const form = useForm<ProfileFormData>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			name: "",
			age: 0,
			gender: "",
			conditionIds: [],
			allergyIds: [],
		},
	});

	// Update form when profile data loads
	useEffect(() => {
		if (profile && !profileLoading) {
			const formData = {
				name: profile.name || "",
				age: profile.age || 0,
				gender: profile.gender || "",
				conditionIds: userConditions.map((c) => c.id),
				allergyIds: userAllergies.map((a) => a.id),
			};
			console.log("Setting form data:", formData);
			form.reset(formData);
			setSelectedConditions(userConditions.map((c) => c.id));
			setSelectedAllergies(userAllergies.map((a) => a.id));
		}
	}, [profile, userConditions, userAllergies, profileLoading, form]);

	const onSubmit = async (data: ProfileFormData) => {
		setIsSubmitting(true);
		try {
			await updateProfile.mutateAsync({
				name: data.name,
				age: data.age,
				gender: data.gender,
				conditionIds: selectedConditions,
				allergyIds: selectedAllergies,
			});
		} catch (error) {
			console.error("Error updating profile:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Show loading state for both variants
	const isLoading = profileLoading || conditionsLoading || allergiesLoading || !profile;
	
	if (isLoading && variant === "page") {
		return (
			<div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-2xl">
					<div className="animate-pulse">
						<div className="mb-6 h-8 w-1/4 rounded bg-muted" />
						<div className="rounded-lg bg-card p-6 shadow border">
							<div className="space-y-4">
								<div className="h-4 w-1/2 rounded bg-muted" />
								<div className="h-10 rounded bg-muted" />
								<div className="h-4 w-1/2 rounded bg-muted" />
								<div className="h-10 rounded bg-muted" />
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (isLoading && variant === "modal") {
		return (
			<div className="space-y-4">
				<div className="animate-pulse">
					<div className="h-4 w-1/2 rounded bg-muted" />
					<div className="mt-2 h-10 rounded bg-muted" />
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
					render={({ field }) => (
						<FormItem>
							<FormLabel>Gender</FormLabel>
							<Select
								onValueChange={field.onChange}
								value={field.value}
								defaultValue={field.value}
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
					)}
				/>

				<Separator />

				<div className="space-y-2">
					<Label>Medical Conditions</Label>
					<ConditionsSelector
						selectedConditions={selectedConditions}
						onSelectionChange={setSelectedConditions}
						placeholder="Search for conditions..."
					/>
				</div>

				<div className="space-y-2">
					<Label>Medication Allergies</Label>
					<AllergiesSelector
						selectedAllergies={selectedAllergies}
						onSelectionChange={setSelectedAllergies}
						placeholder="Search for allergies..."
					/>
				</div>

				<div className="flex gap-3">
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Updating Profile..." : "Update Profile"}
					</Button>
					{variant === "page" && (
						<Button
							type="button"
							variant="outline"
							onClick={() => router.push("/app/dashboard")}
						>
							Cancel
						</Button>
					)}
				</div>
			</form>
		</Form>
	);

	if (variant === "modal") {
		return formContent;
	}

	return (
		<div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-2xl">
				<div className="mb-8">
					<h1 className="font-bold text-3xl text-foreground">Profile Settings</h1>
					<p className="mt-2 text-muted-foreground">
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
