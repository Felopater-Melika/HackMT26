"use client";

import { Nav } from "@/components/Nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Pill,
	ChevronRight,
	Clock,
	CheckCircle,
	AlertTriangle,
	FileText,
	Plus,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/trpc/react";
import { toast } from "sonner";

export default function MyMedicationsPage() {
	const utils = api.useUtils();

	// Get all deep-dives for the user (these are the analyzed medications)
	const { data: deepDives, isLoading: isLoadingDeepDives } =
		api.medicationDeepDive.getAll.useQuery();

	// Get user's medications from user_medications table
	const { data: userMedications, isLoading: isLoadingMeds } =
		api.medications.getUserMedications.useQuery();

	// Delete mutation
	const deleteDeepDive = api.medicationDeepDive.delete.useMutation({
		onSuccess: () => {
			toast.success("Report deleted successfully");
			utils.medicationDeepDive.getAll.invalidate();
		},
		onError: (error) => {
			toast.error(`Failed to delete report: ${error.message}`);
		},
	});

	const handleDelete = (e: React.MouseEvent, deepDiveId: string) => {
		e.preventDefault();
		e.stopPropagation();
		if (confirm("Are you sure you want to delete this report?")) {
			deleteDeepDive.mutate({ id: deepDiveId });
		}
	};

	const isLoading = isLoadingDeepDives || isLoadingMeds;

	// Combine data: medications with their deep-dive status
	const medicationsWithStatus = userMedications?.map((med) => {
		const deepDive = deepDives?.find(
			(dd) => dd.medicationId === med.medicationId,
		);
		return {
			...med,
			deepDive,
			hasAnalysis: !!deepDive,
		};
	});

	// Also include deep-dives that might not be in user_medications
	const additionalDeepDives = deepDives?.filter(
		(dd) =>
			!userMedications?.some((med) => med.medicationId === dd.medicationId),
	);

	const getConfidenceColor = (confidence: string) => {
		switch (confidence) {
			case "high":
				return "text-green-600 bg-green-100";
			case "medium":
				return "text-yellow-600 bg-yellow-100";
			case "low":
				return "text-red-600 bg-red-100";
			default:
				return "text-gray-600 bg-gray-100";
		}
	};

	const formatDate = (date: Date | string | null) => {
		if (!date) return "Unknown";
		return new Date(date).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	return (
		<div className="min-h-screen bg-background">
			<Nav />
			<div className="mx-auto max-w-6xl px-4 py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="mb-2 font-bold text-3xl text-foreground">
						My Medications
					</h1>
					<p className="text-muted-foreground">
						Your analyzed medications and comprehensive reports
					</p>
				</div>

				{isLoading ? (
					<Card className="p-8 text-center">
						<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						<p className="text-muted-foreground">Loading your medications...</p>
					</Card>
				) : (medicationsWithStatus?.length ?? 0) === 0 &&
				  (additionalDeepDives?.length ?? 0) === 0 ? (
					<Card className="p-8 text-center">
						<Pill className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
						<h2 className="mb-2 font-semibold text-xl">No Medications Yet</h2>
						<p className="mb-6 text-muted-foreground">
							Scan a medication label to get started with your personalized
							medication library
						</p>
						<Link href="/app/scan">
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								Scan Medication
							</Button>
						</Link>
					</Card>
				) : (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{/* Medications from user_medications with deep-dive status */}
						{medicationsWithStatus?.map((med) => (
							<Card
								key={med.medicationId}
								className="overflow-hidden transition-shadow hover:shadow-lg"
							>
								<div className="p-5">
									<div className="mb-3 flex items-start justify-between">
										<div className="flex items-center gap-3">
											<div className="rounded-full bg-primary/10 p-2">
												<Pill className="h-5 w-5 text-primary" />
											</div>
											<div>
												<h3 className="font-semibold text-foreground">
													{med.medication?.brandName ||
														med.medication?.name ||
														"Unknown Medication"}
												</h3>
												{med.dosage && (
													<p className="text-muted-foreground text-sm">
														{med.dosage}
														{med.frequency && ` • ${med.frequency}`}
													</p>
												)}
											</div>
										</div>
										{/* Delete button for analyzed medications */}
										{med.hasAnalysis && med.deepDive && (
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-muted-foreground hover:text-destructive"
												onClick={(e) => handleDelete(e, med.deepDive!.id)}
												disabled={deleteDeepDive.isPending}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										)}
									</div>

									{med.hasAnalysis && med.deepDive ? (
										<>
											{/* Analysis Status */}
											<div className="mb-4 flex items-center gap-2">
												<CheckCircle className="h-4 w-4 text-green-600" />
												<span className="text-green-600 text-sm">
													Analysis Complete
												</span>
												{(med.deepDive.confidence as { overall: string })
													?.overall && (
													<span
														className={`rounded-full px-2 py-0.5 text-xs ${getConfidenceColor((med.deepDive.confidence as { overall: string }).overall)}`}
													>
														{(
															med.deepDive.confidence as { overall: string }
														).overall.charAt(0).toUpperCase() +
															(
																med.deepDive.confidence as { overall: string }
															).overall.slice(1)}{" "}
														Confidence
													</span>
												)}
											</div>

											{/* Summary Preview */}
											{med.deepDive.summary && (
												<p className="mb-4 line-clamp-2 text-muted-foreground text-sm">
													{med.deepDive.summary}
												</p>
											)}

											{/* Quick Stats */}
											<div className="mb-4 flex items-center gap-4 text-muted-foreground text-xs">
												<div className="flex items-center gap-1">
													<Clock className="h-3 w-3" />
													<span>
														{formatDate(med.deepDive.createdAt)}
													</span>
												</div>
												{(
													med.deepDive.personalizedWarnings as string[]
												)?.length > 0 && (
													<div className="flex items-center gap-1 text-amber-600">
														<AlertTriangle className="h-3 w-3" />
														<span>
															{
																(
																	med.deepDive
																		.personalizedWarnings as string[]
																).length
															}{" "}
															Warnings
														</span>
													</div>
												)}
											</div>

											{/* View Report Button */}
											<Link
												href={`/app/medications/${med.deepDive.medicationId}/deep-dive`}
											>
												<Button
													variant="outline"
													className="w-full"
													size="sm"
												>
													<FileText className="mr-2 h-4 w-4" />
													View Full Report
													<ChevronRight className="ml-auto h-4 w-4" />
												</Button>
											</Link>
										</>
									) : (
										<>
											{/* No Analysis Yet */}
											<div className="mb-4 flex items-center gap-2 text-muted-foreground">
												<Clock className="h-4 w-4" />
												<span className="text-sm">No analysis yet</span>
											</div>
											<Link
												href="/app/scan"
											>
												<Button
													variant="default"
													className="w-full"
													size="sm"
												>
													<Plus className="mr-2 h-4 w-4" />
													Run Scan to Generate
												</Button>
											</Link>
										</>
									)}
								</div>
							</Card>
						))}

						{/* Deep-dives that don't have a user_medication entry */}
						{additionalDeepDives?.map((deepDive) => (
							<Card
								key={deepDive.id}
								className="overflow-hidden transition-shadow hover:shadow-lg"
							>
								<div className="p-5">
									<div className="mb-3 flex items-start justify-between">
										<div className="flex items-center gap-3">
											<div className="rounded-full bg-primary/10 p-2">
												<Pill className="h-5 w-5 text-primary" />
											</div>
											<div>
												<h3 className="font-semibold text-foreground">
													{deepDive.medication?.brandName ||
														deepDive.medication?.name ||
														"Analyzed Medication"}
												</h3>
											</div>
										</div>
										{/* Delete button */}
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-muted-foreground hover:text-destructive"
											onClick={(e) => handleDelete(e, deepDive.id)}
											disabled={deleteDeepDive.isPending}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>

									{/* Analysis Status */}
									<div className="mb-4 flex items-center gap-2">
										<CheckCircle className="h-4 w-4 text-green-600" />
										<span className="text-green-600 text-sm">
											Analysis Complete
										</span>
										{(deepDive.confidence as { overall: string })?.overall && (
											<span
												className={`rounded-full px-2 py-0.5 text-xs ${getConfidenceColor((deepDive.confidence as { overall: string }).overall)}`}
											>
												{(
													deepDive.confidence as { overall: string }
												).overall.charAt(0).toUpperCase() +
													(
														deepDive.confidence as { overall: string }
													).overall.slice(1)}{" "}
												Confidence
											</span>
										)}
									</div>

									{/* Summary Preview */}
									{deepDive.summary && (
										<p className="mb-4 line-clamp-2 text-muted-foreground text-sm">
											{deepDive.summary}
										</p>
									)}

									{/* Quick Stats */}
									<div className="mb-4 flex items-center gap-4 text-muted-foreground text-xs">
										<div className="flex items-center gap-1">
											<Clock className="h-3 w-3" />
											<span>{formatDate(deepDive.createdAt)}</span>
										</div>
										{(deepDive.personalizedWarnings as string[])?.length >
											0 && (
											<div className="flex items-center gap-1 text-amber-600">
												<AlertTriangle className="h-3 w-3" />
												<span>
													{(deepDive.personalizedWarnings as string[]).length}{" "}
													Warnings
												</span>
											</div>
										)}
									</div>

									{/* View Report Button */}
									<Link
										href={`/app/medications/${deepDive.medicationId}/deep-dive`}
									>
										<Button variant="outline" className="w-full" size="sm">
											<FileText className="mr-2 h-4 w-4" />
											View Full Report
											<ChevronRight className="ml-auto h-4 w-4" />
										</Button>
									</Link>
								</div>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
