"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	AlertCircle,
	CheckCircle,
	Pill,
	Clock,
	Heart,
	AlertTriangle,
	Users,
	Activity,
	MessageSquare,
	Sparkles,
	Loader2,
	Info,
	ChevronRight,
} from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import Link from "next/link";

/**
 * Medication Deep-Dive Full Page
 *
 * Displays comprehensive medication information with expandable sections.
 */
export default function MedicationDeepDivePage() {
	const params = useParams();
	const searchParams = useSearchParams();
	const medicationIdFromUrl = params.medicationId as string;
	const scanId = searchParams.get("scanId");
	const medicationName = searchParams.get("medicationName");

	// Check if medicationId is a valid UUID or if we should use medicationName
	const isValidUuid =
		medicationIdFromUrl !== "new" &&
		/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
			medicationIdFromUrl,
		);

	const [activeSection, setActiveSection] = useState<string | null>(null);

	// Query existing deep-dive (only if we have a valid UUID)
	const { data: existingDeepDives, isLoading: isLoadingExisting } =
		api.medicationDeepDive.getByMedicationId.useQuery(
			{ medicationId: medicationIdFromUrl },
			{ enabled: isValidUuid },
		);

	// Mutation to generate new deep-dive
	const generateDeepDive = api.medicationDeepDive.getOrCreate.useMutation({
		onSuccess: () => {
			toast.success("Deep-dive generated successfully!");
		},
		onError: (error) => {
			toast.error(`Failed to generate deep-dive: ${error.message}`);
		},
	});

	const latestDeepDive =
		existingDeepDives && existingDeepDives.length > 0
			? existingDeepDives[0]
			: generateDeepDive.data;
	const confidence = latestDeepDive?.confidence as
		| { overall: string; reason: string }
		| null;
	const sourcesUsed = latestDeepDive?.sourcesUsed as
		| { scanLabel: boolean; openFda: boolean; patientProfile: boolean }
		| null;

	const handleSectionClick = (section: string) => {
		setActiveSection((current) => (current === section ? null : section));
	};

	const handleGenerate = () => {
		generateDeepDive.mutate({
			medicationId: isValidUuid ? medicationIdFromUrl : undefined,
			medicationName: medicationName || undefined,
			scanId: scanId || undefined,
		});
	};

	if (isLoadingExisting) {
		return (
			<div className="min-h-screen bg-background">
				<Nav />
				<div className="mx-auto max-w-4xl px-4 py-8">
					<Card className="p-8 text-center">
						<Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
						<p className="text-muted-foreground">Loading deep-dive...</p>
					</Card>
				</div>
			</div>
		);
	}

	if (!latestDeepDive && !generateDeepDive.isPending) {
		return (
			<div className="min-h-screen bg-background">
				<Nav />
				<div className="mx-auto max-w-4xl px-4 py-8">
					<Card className="p-8 text-center">
						<Pill className="mx-auto mb-4 h-12 w-12 text-primary" />
						<h2 className="mb-2 font-bold text-2xl">
							{medicationName
								? `${medicationName} - Detailed Report`
								: "Medication Report"}
						</h2>
						<p className="mb-6 text-muted-foreground">
							Generate a comprehensive, personalized analysis of this medication
						</p>
						<Button onClick={handleGenerate} size="lg">
							<Sparkles className="mr-2 h-5 w-5" />
							Generate Report
						</Button>
					</Card>
				</div>
			</div>
		);
	}

	if (generateDeepDive.isPending) {
		return (
			<div className="min-h-screen bg-background">
				<Nav />
				<div className="mx-auto max-w-4xl px-4 py-8">
					<Card className="p-8 text-center">
						<Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
						<p className="text-lg text-foreground">
							Generating your report...
						</p>
						<p className="mt-2 text-muted-foreground text-sm">
							Analyzing medication data and creating personalized insights
						</p>
					</Card>
				</div>
			</div>
		);
	}

	const howToTake = latestDeepDive?.howToTake as
		| { timing: string; withFood: string; missedDose: string }
		| null;
	const sideEffects = latestDeepDive?.sideEffects as
		| { common: string[]; serious: string[] }
		| null;
	const warningCount = (latestDeepDive?.personalizedWarnings as string[])
		?.length;
	const interactionCount = (latestDeepDive?.interactions as string[])?.length;

	const sections = [
		{
			key: "treats",
			title: "What It Treats",
			icon: <Heart className="h-4 w-4" />,
			content: (
				<ul className="space-y-2">
					{(latestDeepDive?.whatItTreats as string[])?.map(
						(condition, i) => (
							<li key={i} className="flex items-start gap-2">
								<CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
								<span>{condition}</span>
							</li>
						),
					)}
				</ul>
			),
		},
		{
			key: "works",
			title: "How It Works",
			icon: <Activity className="h-4 w-4" />,
			content: <p className="leading-relaxed">{latestDeepDive?.howItWorks}</p>,
		},
		{
			key: "take",
			title: "How To Take",
			icon: <Clock className="h-4 w-4" />,
			content: (
				<div className="space-y-3">
					<div>
						<h4 className="mb-1 font-semibold text-sm">Timing</h4>
						<p className="text-sm">{howToTake?.timing}</p>
					</div>
					<div>
						<h4 className="mb-1 font-semibold text-sm">
							Food Instructions
						</h4>
						<p className="text-sm">{howToTake?.withFood}</p>
					</div>
					<div>
						<h4 className="mb-1 font-semibold text-sm">Missed Dose</h4>
						<p className="text-sm">{howToTake?.missedDose}</p>
					</div>
				</div>
			),
		},
		{
			key: "timeline",
			title: "Expected Timeline",
			icon: <Clock className="h-4 w-4" />,
			content: (
				<p className="leading-relaxed">{latestDeepDive?.expectedTimeline}</p>
			),
		},
		{
			key: "benefits",
			title: "Benefits",
			icon: <Heart className="h-4 w-4 text-green-600" />,
			content: (
				<ul className="space-y-2">
					{(latestDeepDive?.benefits as string[])?.map((benefit, i) => (
						<li key={i} className="flex items-start gap-2">
							<CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
							<span>{benefit}</span>
						</li>
					))}
				</ul>
			),
		},
		{
			key: "sideEffects",
			title: "Side Effects",
			icon: <AlertCircle className="h-4 w-4 text-yellow-600" />,
			badge: `${
				(sideEffects?.common?.length || 0) + (sideEffects?.serious?.length || 0)
			}`,
			content: (
				<div className="space-y-4">
					<div>
						<h4 className="mb-2 font-semibold text-sm">Common Side Effects</h4>
						<ul className="space-y-1">
							{sideEffects?.common?.map((effect, i) => (
								<li key={i} className="rounded-md bg-muted px-3 py-2 text-sm">
									{effect}
								</li>
							))}
						</ul>
					</div>
					<div>
						<h4 className="mb-2 font-semibold text-destructive text-sm">
							Serious Side Effects
						</h4>
						<ul className="space-y-1">
							{sideEffects?.serious?.map((effect, i) => (
								<li
									key={i}
									className="rounded-md bg-destructive/10 px-3 py-2 text-sm"
								>
									{effect}
								</li>
							))}
						</ul>
					</div>
				</div>
			),
		},
		{
			key: "warnings",
			title: "Personalized Warnings",
			icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
			badge: warningCount ? warningCount.toString() : undefined,
			variant: "warning" as const,
			content: (
				<ul className="space-y-2">
					{(latestDeepDive?.personalizedWarnings as string[])?.map(
						(warning, i) => (
							<li
								key={i}
								className="rounded-md bg-destructive/10 px-3 py-2 text-sm"
							>
								<div className="flex items-start gap-2">
									<AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
									<span>{warning}</span>
								</div>
							</li>
						),
					)}
				</ul>
			),
		},
		{
			key: "interactions",
			title: "Interactions",
			icon: <Users className="h-4 w-4" />,
			badge: interactionCount ? interactionCount.toString() : undefined,
			content: (
				<ul className="space-y-2">
					{(latestDeepDive?.interactions as string[])?.map(
						(interaction, i) => (
							<li
								key={i}
								className="rounded-md border bg-card px-3 py-2 text-sm"
							>
								{interaction}
							</li>
						),
					)}
				</ul>
			),
		},
		{
			key: "lifestyle",
			title: "Lifestyle Considerations",
			icon: <Activity className="h-4 w-4" />,
			content: (
				<ul className="space-y-2">
					{(latestDeepDive?.lifestyle as string[])?.map((item, i) => (
						<li
							key={i}
							className="rounded-md border bg-card px-3 py-2 text-sm"
						>
							{item}
						</li>
					))}
				</ul>
			),
		},
		{
			key: "monitoring",
			title: "What to Monitor",
			icon: <Activity className="h-4 w-4" />,
			content: (
				<ul className="space-y-2">
					{(latestDeepDive?.monitoring as string[])?.map((item, i) => (
						<li key={i} className="flex items-start gap-2">
							<Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
							<span>{item}</span>
						</li>
					))}
				</ul>
			),
		},
		{
			key: "questions",
			title: "Questions to Ask Your Doctor",
			icon: <MessageSquare className="h-4 w-4" />,
			content: (
				<ul className="space-y-2">
					{(latestDeepDive?.questionsToAskDoctor as string[])?.map(
						(question, i) => (
							<li
								key={i}
								className="rounded-md bg-primary/5 px-3 py-2 text-sm"
							>
								<span className="font-semibold">{i + 1}.</span> {question}
							</li>
						),
					)}
				</ul>
			),
		},
	];

	const activeSectionConfig = sections.find(
		(section) => section.key === activeSection,
	);

	return (
		<div className="min-h-screen bg-background">
			<Nav />
			<div className="mx-auto max-w-7xl px-4 py-8">
				{/* Header */}
				<div className="mb-6">
					<div className="mb-2 flex items-center gap-2 text-muted-foreground text-sm">
						<Link href="/app/dashboard" className="hover:underline">
							Dashboard
						</Link>
						<ChevronRight className="h-4 w-4" />
						<Link href="/app/medications" className="hover:underline">
							My Medications
						</Link>
						<ChevronRight className="h-4 w-4" />
						<span>Detailed Report</span>
					</div>
					<h1 className="mb-2 font-bold text-3xl text-foreground">
						{medicationName || "Medication Report"}
					</h1>
					{medicationName && (
						<p className="text-muted-foreground text-sm">
							Comprehensive personalized analysis
						</p>
					)}
					<div className="flex items-center gap-4">
						<span
							className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
								confidence?.overall === "high"
									? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
									: confidence?.overall === "medium"
										? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
										: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
							}`}
						>
							Confidence: {confidence?.overall?.toUpperCase()}
						</span>
						<span className="text-muted-foreground text-sm">
							Generated{" "}
							{new Date(latestDeepDive?.createdAt || "").toLocaleDateString()}
						</span>
					</div>
				</div>

				{/* Summary */}
				<Card className="mb-4 border-2 border-primary/20 bg-primary/5 p-6">
					<div className="mb-4 flex items-start justify-between">
						<div className="flex items-center gap-2">
							<Pill className="h-6 w-6 text-primary" />
							<h2 className="font-semibold text-xl">Summary</h2>
						</div>
					</div>
					<p className="mb-4 text-foreground leading-relaxed">
						{latestDeepDive?.summary}
					</p>

					{/* Sources Used */}
					<div className="flex flex-wrap gap-2 text-xs">
						<span className="text-muted-foreground">Sources:</span>
						{sourcesUsed?.scanLabel && (
							<span className="rounded-full bg-primary/20 px-2 py-0.5">
								Scan Label
							</span>
						)}
						{sourcesUsed?.openFda && (
							<span className="rounded-full bg-primary/20 px-2 py-0.5">
								OpenFDA
							</span>
						)}
						{sourcesUsed?.patientProfile && (
							<span className="rounded-full bg-primary/20 px-2 py-0.5">
								Patient Profile
							</span>
						)}
					</div>
				</Card>

				{/* Section Overview Grid */}
				<div>
					<div className="grid grid-flow-col grid-rows-2 gap-3">
						{sections.map((section) => {
							const isActive = section.key === activeSection;
							const isWarning = section.variant === "warning";

							return (
								<button
									key={section.key}
									type="button"
									onClick={() => handleSectionClick(section.key)}
									className="min-w-[180px] text-left"
									aria-expanded={isActive}
								>
									<Card
										className={`h-full border p-3 transition ${
											isWarning
												? "border-destructive/30 bg-destructive/5"
												: ""
										} ${isActive ? "border-primary/60 bg-primary/5" : ""}`}
									>
										<div className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-2">
												{section.icon}
												<h3 className="font-semibold text-sm">
													{section.title}
												</h3>
												{section.badge && (
													<span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs">
														{section.badge}
													</span>
												)}
											</div>
											<ChevronRight
												className={`h-4 w-4 transition ${
													isActive ? "rotate-90 text-primary" : ""
												}`}
											/>
										</div>
										<p className="mt-2 text-muted-foreground text-xs">
											{isActive ? "Selected" : "Tap to view"}
										</p>
									</Card>
								</button>
							);
						})}
					</div>
				</div>

				{/* Active Section Content */}
				<Card
					className={`mt-4 border ${activeSectionConfig?.variant === "warning" ? "border-destructive/30 bg-destructive/5" : ""}`}
				>
					{activeSectionConfig ? (
						<>
							<div className="flex items-center justify-between border-b p-4">
								<div className="flex items-center gap-2">
									{activeSectionConfig.icon}
									<h3 className="font-semibold text-base">
										{activeSectionConfig.title}
									</h3>
									{activeSectionConfig.badge && (
										<span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs">
											{activeSectionConfig.badge}
										</span>
									)}
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setActiveSection(null)}
								>
									Close
								</Button>
							</div>
							<div className="p-4">{activeSectionConfig.content}</div>
						</>
					) : (
						<div className="p-4 text-muted-foreground text-sm">
							Select a section above to view details.
						</div>
					)}
				</Card>

				{/* Disclaimer */}
				<Card className="mt-6 border bg-muted p-4">
					<p className="text-muted-foreground text-xs">
						<strong>Disclaimer:</strong> {latestDeepDive?.disclaimer}
					</p>
				</Card>

				{/* Confidence Reason */}
				{confidence?.reason && (
					<Card className="mt-4 border p-4">
						<div className="flex items-start gap-2">
							<Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
							<div>
								<h4 className="mb-1 font-semibold text-sm">
									About this analysis
								</h4>
								<p className="text-muted-foreground text-xs">
									{confidence.reason}
								</p>
							</div>
						</div>
					</Card>
				)}
			</div>
		</div>
	);
}

/**
 * Reusable expandable section component
 */
