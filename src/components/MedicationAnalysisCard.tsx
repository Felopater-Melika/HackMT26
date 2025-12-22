"use client";

/**
 * Medication Analysis Card Component
 * 
 * Displays AI-powered medication analysis results with tailored advice
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { AlertCircle, CheckCircle, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function MedicationAnalysisCard() {
	const [medicationName, setMedicationName] = useState("");

	const { mutate: analyzeMedication, isPending, data } =
		api.medicationAnalysis.analyzeSingle.useMutation();

	const handleAnalyze = () => {
		if (medicationName.trim()) {
			analyzeMedication({ medicationName: medicationName.trim() });
		}
	};

	return (
		<div className="space-y-4">
			<Card className="p-6">
				<h2 className="mb-4 font-bold text-2xl text-foreground">
					Medication Analysis
				</h2>
				<p className="mb-4 text-muted-foreground text-sm">
					Get personalized safety analysis and recommendations based on your
					medical history and current medications.
				</p>

				<div className="flex gap-2">
					<Input
						type="text"
						placeholder="Enter medication name (e.g., aspirin)"
						value={medicationName}
						onChange={(e) => setMedicationName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleAnalyze();
						}}
						disabled={isPending}
						className="flex-1"
					/>
					<Button
						onClick={handleAnalyze}
						disabled={isPending || !medicationName.trim()}
					>
						{isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Analyzing...
							</>
						) : (
							<>
								<Search className="mr-2 h-4 w-4" />
								Analyze
							</>
						)}
					</Button>
				</div>
			</Card>

			{data && (
				<Card className="p-6">
					<div className="mb-4 flex items-start justify-between">
						<div>
							<h3 className="font-bold text-xl text-foreground">
								{data.medicationName}
							</h3>
							<div className="mt-2 flex items-center gap-2">
								{data.requiresAttention ? (
									<>
										<AlertCircle className="h-5 w-5 text-destructive" />
										<span className="font-medium text-destructive text-sm">
											Requires Attention
										</span>
									</>
								) : (
									<>
										<CheckCircle className="h-5 w-5 text-green-600" />
										<span className="font-medium text-green-600 text-sm">
											Generally Safe
										</span>
									</>
								)}
							</div>
						</div>
						<div className="text-right">
							<div className="font-bold text-3xl text-foreground">
								{data.safetyScore}
							</div>
							<div className="text-muted-foreground text-xs">Safety Score</div>
						</div>
					</div>

					{/* Warnings */}
					{data.warnings.length > 0 && (
						<div className="mb-4">
							<h4 className="mb-2 flex items-center gap-2 font-semibold text-foreground text-sm">
								<AlertCircle className="h-4 w-4" />
								Warnings
							</h4>
							<ul className="space-y-1">
								{data.warnings.map((warning, index) => (
									<li
										key={index}
										className="rounded-md bg-destructive/10 px-3 py-2 text-sm"
									>
										{warning}
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Interactions */}
					{data.interactions.length > 0 && (
						<div className="mb-4">
							<h4 className="mb-2 font-semibold text-foreground text-sm">
								Potential Interactions
							</h4>
							<ul className="space-y-1">
								{data.interactions.map((interaction, index) => (
									<li
										key={index}
										className="rounded-md bg-muted px-3 py-2 text-sm"
									>
										{interaction}
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Recommendations */}
					{data.recommendations.length > 0 && (
						<div className="mb-4">
							<h4 className="mb-2 font-semibold text-foreground text-sm">
								Recommendations
							</h4>
							<ul className="space-y-1">
								{data.recommendations.map((recommendation, index) => (
									<li
										key={index}
										className="rounded-md bg-primary/10 px-3 py-2 text-sm"
									>
										{recommendation}
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Full Analysis */}
					<div>
						<h4 className="mb-2 font-semibold text-foreground text-sm">
							Detailed Analysis
						</h4>
						<div className="rounded-md bg-card p-4 text-sm leading-relaxed whitespace-pre-wrap border">
							{data.analysis}
						</div>
					</div>
				</Card>
			)}
		</div>
	);
}

