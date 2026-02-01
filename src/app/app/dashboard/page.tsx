"use client";

import { Nav } from "@/components/Nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	AlertCircle,
	Calendar,
	ChevronDown,
	ChevronUp,
	Pill,
	Plus,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/trpc/react";
import { useState } from "react";
import { toast } from "sonner";

// Medication category helper
function getMedicationCategory(medicationName: string): {
	category: string;
	color: string;
	bgColor: string;
	emoji: string;
} {
	const name = medicationName.toLowerCase();

	// Pain Relief
	if (
		name.includes("ibuprofen") ||
		name.includes("aspirin") ||
		name.includes("acetaminophen") ||
		name.includes("tylenol") ||
		name.includes("advil") ||
		name.includes("naproxen") ||
		name.includes("aleve") ||
		name.includes("tramadol") ||
		name.includes("morphine") ||
		name.includes("oxycodone")
	) {
		return {
			category: "Pain Relief",
			color: "text-red-700",
			bgColor: "bg-red-100 border-red-200",
			emoji: "💊",
		};
	}

	// Heart/Blood Pressure
	if (
		name.includes("lisinopril") ||
		name.includes("amlodipine") ||
		name.includes("atenolol") ||
		name.includes("metoprolol") ||
		name.includes("losartan") ||
		name.includes("carvedilol") ||
		name.includes("warfarin") ||
		name.includes("clopidogrel") ||
		name.includes("plavix") ||
		name.includes("statin") ||
		name.includes("atorvastatin") ||
		name.includes("simvastatin")
	) {
		return {
			category: "Heart & Blood Pressure",
			color: "text-blue-700",
			bgColor: "bg-blue-100 border-blue-200",
			emoji: "💙",
		};
	}

	// Diabetes
	if (
		name.includes("metformin") ||
		name.includes("insulin") ||
		name.includes("glipizide") ||
		name.includes("glyburide") ||
		name.includes("januvia") ||
		name.includes("ozempic") ||
		name.includes("trulicity")
	) {
		return {
			category: "Diabetes",
			color: "text-amber-700",
			bgColor: "bg-amber-100 border-amber-200",
			emoji: "🍬",
		};
	}

	// Mental Health
	if (
		name.includes("sertraline") ||
		name.includes("zoloft") ||
		name.includes("prozac") ||
		name.includes("fluoxetine") ||
		name.includes("lexapro") ||
		name.includes("escitalopram") ||
		name.includes("xanax") ||
		name.includes("alprazolam") ||
		name.includes("lorazepam") ||
		name.includes("ativan") ||
		name.includes("wellbutrin") ||
		name.includes("bupropion")
	) {
		return {
			category: "Mental Health",
			color: "text-purple-700",
			bgColor: "bg-purple-100 border-purple-200",
			emoji: "🧠",
		};
	}

	// Antibiotics
	if (
		name.includes("amoxicillin") ||
		name.includes("azithromycin") ||
		name.includes("ciprofloxacin") ||
		name.includes("doxycycline") ||
		name.includes("penicillin") ||
		name.includes("cephalexin") ||
		name.includes("clindamycin") ||
		name.includes("antibiotic")
	) {
		return {
			category: "Antibiotic",
			color: "text-green-700",
			bgColor: "bg-green-100 border-green-200",
			emoji: "🦠",
		};
	}

	// Respiratory/Asthma
	if (
		name.includes("albuterol") ||
		name.includes("inhaler") ||
		name.includes("montelukast") ||
		name.includes("singulair") ||
		name.includes("fluticasone") ||
		name.includes("prednisone")
	) {
		return {
			category: "Respiratory",
			color: "text-cyan-700",
			bgColor: "bg-cyan-100 border-cyan-200",
			emoji: "🫁",
		};
	}

	// Stomach/Digestive
	if (
		name.includes("omeprazole") ||
		name.includes("pantoprazole") ||
		name.includes("ranitidine") ||
		name.includes("famotidine") ||
		name.includes("pepcid") ||
		name.includes("prilosec") ||
		name.includes("nexium")
	) {
		return {
			category: "Digestive",
			color: "text-orange-700",
			bgColor: "bg-orange-100 border-orange-200",
			emoji: "🔥",
		};
	}

	// Thyroid
	if (
		name.includes("levothyroxine") ||
		name.includes("synthroid") ||
		name.includes("thyroid")
	) {
		return {
			category: "Thyroid",
			color: "text-pink-700",
			bgColor: "bg-pink-100 border-pink-200",
			emoji: "⚡",
		};
	}

	// Default/Other
	return {
		category: "Other",
		color: "text-gray-700",
		bgColor: "bg-gray-100 border-gray-200",
		emoji: "💊",
	};
}

export default function DashboardPage() {
	const { data: reports, isLoading } = api.reports.getAll.useQuery();
	const { data: usage } = api.usage.getUsage.useQuery();

	const [expandedReports, setExpandedReports] = useState<Set<string>>(
		new Set(),
	);

	const toggleReport = (reportId: string) => {
		const newExpanded = new Set(expandedReports);
		if (newExpanded.has(reportId)) {
			newExpanded.delete(reportId);
		} else {
			newExpanded.add(reportId);
		}
		setExpandedReports(newExpanded);
	};

	return (
		<div className="min-h-screen bg-background">
			<Nav />
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h1 className="font-bold text-3xl text-foreground">Dashboard</h1>
						<p className="text-muted-foreground">
							View your medication analysis history
						</p>
					</div>
					<Link href="/app/scan">
						<Button disabled={usage?.hasReachedLimit}>
							<Plus className="mr-2 h-4 w-4" />
							New Scan
						</Button>
					</Link>
				</div>

				{/* Usage Card */}
				{usage && (
					<Card className="mb-6 border">
						<div className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="mb-1 font-semibold text-sm text-foreground">
										Scan Usage
									</h3>
									<p className="text-muted-foreground text-sm">
										{usage.hasReachedLimit
											? "You've reached your limit"
											: `${usage.remaining} scan${usage.remaining !== 1 ? "s" : ""} remaining`}
									</p>
								</div>
								<div className="text-right">
									<div
										className={`font-bold text-2xl ${
											usage.hasReachedLimit
												? "text-destructive"
												: usage.remaining === 1
													? "text-yellow-600"
													: "text-primary"
										}`}
									>
										{usage.remaining} / {usage.limit}
									</div>
								</div>
							</div>
							{usage.hasReachedLimit && (
								<div className="mt-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
									⚠️ You've used all {usage.limit} scans. Upgrade to continue analyzing medications.
								</div>
							)}
						</div>
					</Card>
				)}

				{isLoading ? (
					<Card className="border p-8 text-center">
						<p className="text-muted-foreground">Loading your reports...</p>
					</Card>
				) : !reports || reports.length === 0 ? (
					<Card className="border p-8 text-center">
						<Pill className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
						<h2 className="mb-2 font-semibold text-xl">No scans yet</h2>
						<p className="mb-4 text-muted-foreground">
							Start by scanning your medications to get personalized analysis
						</p>
						<Link href="/app/scan">
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								Scan Medications
							</Button>
						</Link>
					</Card>
				) : (
					<div className="space-y-4">
						{reports.map((report) => {
							const analysisData = report.rawJson as any;
							const isExpanded = expandedReports.has(report.id);

							return (
								<Card key={report.id} className="border">
									{/* Header - Always visible */}
									<div
										className="flex cursor-pointer items-center justify-between p-6 hover:bg-accent/50"
										onClick={() => toggleReport(report.id)}
									>
										<div className="flex-1">
											<div className="mb-2 flex items-center gap-4">
												<h3 className="font-semibold text-lg text-foreground">
													{report.summary}
												</h3>
												{analysisData?.summary?.requiresAttention && (
													<span className="flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-destructive text-xs">
														<AlertCircle className="h-3 w-3" />
														Attention Required
													</span>
												)}
											</div>
											<div className="flex items-center gap-4 text-muted-foreground text-sm">
												<span className="flex items-center gap-1">
													<Calendar className="h-4 w-4" />
													{new Date(
														report.createdAt || "",
													).toLocaleDateString()}
												</span>
												<span className="flex items-center gap-1">
													<Pill className="h-4 w-4" />
													{analysisData?.summary?.totalMedications || 0}{" "}
													medication(s)
												</span>
												<span>
													Safety Score:{" "}
													<span className="font-semibold text-foreground">
														{analysisData?.summary?.averageSafetyScore || 0}
														/100
													</span>
												</span>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Button variant="ghost" size="icon">
												{isExpanded ? (
													<ChevronUp className="h-5 w-5" />
												) : (
													<ChevronDown className="h-5 w-5" />
												)}
											</Button>
										</div>
									</div>

									{/* Expanded Content */}
									{isExpanded && (
										<div className="border-t p-6">
											{/* Individual Medications */}
											<div className="space-y-4">
												<h4 className="font-semibold text-foreground">
													Individual Medications
												</h4>

												{analysisData?.individualResults?.map(
													(med: any, index: number) => {
														const category = getMedicationCategory(
															med.medicationName,
														);
														return (
															<Card key={index} className="border bg-card p-4">
																<div className="mb-3 flex items-start justify-between">
																	<div className="flex-1">
																		<div className="mb-2 flex items-center gap-2">
																			<h5 className="font-semibold text-foreground">
																				{med.medicationName}
																			</h5>
																			<span
																				className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${category.bgColor} ${category.color}`}
																			>
																				<span>{category.emoji}</span>
																				<span>{category.category}</span>
																			</span>
																		</div>
																		{med.dosage && med.measurement && (
																			<p className="text-muted-foreground text-sm">
																				{med.dosage} {med.measurement}
																			</p>
																		)}
																	</div>
																	{med.success && (
																		<div className="text-right">
																			<div className="font-bold text-2xl text-foreground">
																				{med.safetyScore}
																			</div>
																			<div className="text-muted-foreground text-xs">
																				Safety Score
																			</div>
																		</div>
																	)}
																</div>

																{med.success ? (
																	<>
																		{med.summary && (
																			<div className="mb-3 rounded-md bg-muted p-3">
																				<p className="text-sm leading-relaxed">
																					{med.summary}
																				</p>
																			</div>
																		)}

																		{med.warnings && med.warnings.length > 0 && (
																			<div className="mb-3">
																				<h6 className="mb-2 flex items-center gap-2 font-semibold text-sm">
																					<AlertCircle className="h-4 w-4" />
																					Warnings
																				</h6>
																				<ul className="space-y-1">
																					{med.warnings.map(
																						(warning: string, i: number) => (
																							<li
																								key={i}
																								className="rounded-md border bg-card px-3 py-2 text-sm"
																							>
																								{warning}
																							</li>
																						),
																					)}
																				</ul>
																			</div>
																		)}

																		{med.recommendations &&
																			med.recommendations.length > 0 && (
																				<div>
																					<h6 className="mb-2 font-semibold text-sm">
																						Recommendations
																					</h6>
																					<ul className="space-y-1">
																						{med.recommendations.map(
																							(rec: string, i: number) => (
																								<li
																									key={i}
																									className="rounded-md border bg-card px-3 py-2 text-sm"
																								>
																									{rec}
																								</li>
																							),
																						)}
																					</ul>
																				</div>
																			)}
																	</>
																) : (
																	<div className="rounded-md bg-destructive/10 p-3">
																		<p className="font-medium text-destructive text-sm">
																			Analysis Failed: {med.error}
																		</p>
																	</div>
																)}
															</Card>
														);
													},
												)}
											</div>

											{/* Drug Interaction Analysis */}
											{analysisData?.interactionAnalysis && (
												<Card className="mt-4 border-2 border-primary/20 bg-primary/5 p-4">
													<h4 className="mb-3 flex items-center gap-2 font-semibold">
														<AlertCircle className="h-5 w-5 text-primary" />
														Drug Interaction Analysis
													</h4>

													<div className="mb-3 rounded-md bg-background p-3">
														<p className="text-sm leading-relaxed">
															{analysisData.interactionAnalysis.summary}
														</p>
													</div>

													{analysisData.interactionAnalysis.interactions
														.length > 0 && (
														<div className="mb-3">
															<h6 className="mb-2 font-semibold text-sm">
																Interactions Found
															</h6>
															<ul className="space-y-1">
																{analysisData.interactionAnalysis.interactions.map(
																	(int: string, i: number) => (
																		<li
																			key={i}
																			className="rounded-md border bg-card px-3 py-2 text-sm"
																		>
																			{int}
																		</li>
																	),
																)}
															</ul>
														</div>
													)}

													{analysisData.interactionAnalysis.recommendations
														.length > 0 && (
														<div>
															<h6 className="mb-2 font-semibold text-sm">
																Recommendations
															</h6>
															<ul className="space-y-1">
																{analysisData.interactionAnalysis.recommendations.map(
																	(rec: string, i: number) => (
																		<li
																			key={i}
																			className="rounded-md border bg-card px-3 py-2 text-sm"
																		>
																			{rec}
																		</li>
																	),
																)}
															</ul>
														</div>
													)}
												</Card>
											)}

											{/* Disclaimer */}
											<Card className="mt-4 border bg-muted p-3">
												<p className="text-muted-foreground text-xs">
													<strong>Disclaimer:</strong> This analysis is for
													informational purposes only and does not constitute
													medical advice.
												</p>
											</Card>
										</div>
									)}
								</Card>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
