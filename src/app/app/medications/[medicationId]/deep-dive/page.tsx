"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	AlertCircle,
	CheckCircle,
	ChevronDown,
	ChevronUp,
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

	const [expandedSections, setExpandedSections] = useState<Set<string>>(
		new Set(["summary", "warnings", "take"]),
	);

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

	const toggleSection = (section: string) => {
		const newExpanded = new Set(expandedSections);
		if (newExpanded.has(section)) {
			newExpanded.delete(section);
		} else {
			newExpanded.add(section);
		}
		setExpandedSections(newExpanded);
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

	return (
		<div className="min-h-screen bg-background">
			<Nav />
			<div className="mx-auto max-w-4xl px-4 py-8">
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

				{/* Expandable Sections */}
				<div className="space-y-3">
					{/* What It Treats */}
					<ExpandableSection
						icon={<Heart className="h-5 w-5" />}
						title="What It Treats"
						isExpanded={expandedSections.has("treats")}
						onToggle={() => toggleSection("treats")}
					>
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
					</ExpandableSection>

					{/* How It Works */}
					<ExpandableSection
						icon={<Activity className="h-5 w-5" />}
						title="How It Works"
						isExpanded={expandedSections.has("works")}
						onToggle={() => toggleSection("works")}
					>
						<p className="leading-relaxed">{latestDeepDive?.howItWorks}</p>
					</ExpandableSection>

					{/* How To Take */}
					<ExpandableSection
						icon={<Clock className="h-5 w-5" />}
						title="How To Take"
						isExpanded={expandedSections.has("take")}
						onToggle={() => toggleSection("take")}
					>
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
					</ExpandableSection>

					{/* Expected Timeline */}
					<ExpandableSection
						icon={<Clock className="h-5 w-5" />}
						title="Expected Timeline"
						isExpanded={expandedSections.has("timeline")}
						onToggle={() => toggleSection("timeline")}
					>
						<p className="leading-relaxed">
							{latestDeepDive?.expectedTimeline}
						</p>
					</ExpandableSection>

					{/* Benefits */}
					<ExpandableSection
						icon={<Heart className="h-5 w-5 text-green-600" />}
						title="Benefits"
						isExpanded={expandedSections.has("benefits")}
						onToggle={() => toggleSection("benefits")}
					>
						<ul className="space-y-2">
							{(latestDeepDive?.benefits as string[])?.map((benefit, i) => (
								<li key={i} className="flex items-start gap-2">
									<CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
									<span>{benefit}</span>
								</li>
							))}
						</ul>
					</ExpandableSection>

					{/* Side Effects */}
					<ExpandableSection
						icon={<AlertCircle className="h-5 w-5 text-yellow-600" />}
						title="Side Effects"
						isExpanded={expandedSections.has("sideEffects")}
						onToggle={() => toggleSection("sideEffects")}
						badge={`${(sideEffects?.common?.length || 0) + (sideEffects?.serious?.length || 0)}`}
					>
						<div className="space-y-4">
							<div>
								<h4 className="mb-2 font-semibold text-sm">
									Common Side Effects
								</h4>
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
					</ExpandableSection>

					{/* Personalized Warnings */}
					<ExpandableSection
						icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
						title="Personalized Warnings"
						isExpanded={expandedSections.has("warnings")}
						onToggle={() => toggleSection("warnings")}
						badge={(
							latestDeepDive?.personalizedWarnings as string[]
						)?.length.toString()}
						variant="warning"
					>
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
					</ExpandableSection>

					{/* Interactions */}
					<ExpandableSection
						icon={<Users className="h-5 w-5" />}
						title="Interactions"
						isExpanded={expandedSections.has("interactions")}
						onToggle={() => toggleSection("interactions")}
						badge={(
							latestDeepDive?.interactions as string[]
						)?.length.toString()}
					>
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
					</ExpandableSection>

					{/* Lifestyle Considerations */}
					<ExpandableSection
						icon={<Activity className="h-5 w-5" />}
						title="Lifestyle Considerations"
						isExpanded={expandedSections.has("lifestyle")}
						onToggle={() => toggleSection("lifestyle")}
					>
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
					</ExpandableSection>

					{/* Monitoring */}
					<ExpandableSection
						icon={<Activity className="h-5 w-5" />}
						title="What to Monitor"
						isExpanded={expandedSections.has("monitoring")}
						onToggle={() => toggleSection("monitoring")}
					>
						<ul className="space-y-2">
							{(latestDeepDive?.monitoring as string[])?.map((item, i) => (
								<li key={i} className="flex items-start gap-2">
									<Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
									<span>{item}</span>
								</li>
							))}
						</ul>
					</ExpandableSection>

					{/* Questions for Doctor */}
					<ExpandableSection
						icon={<MessageSquare className="h-5 w-5" />}
						title="Questions to Ask Your Doctor"
						isExpanded={expandedSections.has("questions")}
						onToggle={() => toggleSection("questions")}
					>
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
					</ExpandableSection>
				</div>

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
interface ExpandableSectionProps {
	icon: React.ReactNode;
	title: string;
	isExpanded: boolean;
	onToggle: () => void;
	children: React.ReactNode;
	badge?: string;
	variant?: "default" | "warning";
}

function ExpandableSection({
	icon,
	title,
	isExpanded,
	onToggle,
	children,
	badge,
	variant = "default",
}: ExpandableSectionProps) {
	return (
		<Card
			className={`border ${variant === "warning" ? "border-destructive/30 bg-destructive/5" : ""}`}
		>
			<div
				className="flex cursor-pointer items-center justify-between p-4 hover:bg-accent/50"
				onClick={onToggle}
			>
				<div className="flex items-center gap-2">
					{icon}
					<h3 className="font-semibold">{title}</h3>
					{badge && (
						<span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs">
							{badge}
						</span>
					)}
				</div>
				<Button variant="ghost" size="icon">
					{isExpanded ? (
						<ChevronUp className="h-5 w-5" />
					) : (
						<ChevronDown className="h-5 w-5" />
					)}
				</Button>
			</div>
			{isExpanded && <div className="border-t p-4">{children}</div>}
		</Card>
	);
}
