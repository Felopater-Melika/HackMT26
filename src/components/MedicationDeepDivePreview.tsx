"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronRight, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/trpc/react";

interface MedicationDeepDivePreviewProps {
	medicationId: string;
	medicationName: string;
	scanId?: string;
}

/**
 * Medication Deep-Dive Preview Component
 *
 * Shows a preview of the medication deep-dive with key information
 * and a link to the full detailed view.
 */
export function MedicationDeepDivePreview({
	medicationId,
	medicationName,
	scanId,
}: MedicationDeepDivePreviewProps) {
	const { data: deepDives, isLoading } =
		api.medicationDeepDive.getByMedicationId.useQuery({
			medicationId,
		});

	const latestDeepDive =
		deepDives && deepDives.length > 0 ? deepDives[0] : null;
	const confidence = latestDeepDive?.confidence as
		| { overall: string; reason: string }
		| null;
	const personalizedWarnings =
		(latestDeepDive?.personalizedWarnings as string[]) || [];

	return (
		<Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
			<div className="mb-3 flex items-center gap-2">
				<FileText className="h-5 w-5 text-primary" />
				<h4 className="font-semibold text-foreground">
					Detailed Report
				</h4>
			</div>

			{isLoading ? (
				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<Loader2 className="h-4 w-4 animate-spin" />
					<p>Loading...</p>
				</div>
			) : latestDeepDive ? (
				<>
					<p className="mb-3 text-sm leading-relaxed">
						{latestDeepDive.summary}
					</p>

					<div className="mb-3 grid grid-cols-2 gap-2 text-sm">
						<div>
							<span className="text-muted-foreground">Confidence:</span>
							<span
								className={`ml-1 font-semibold ${
									confidence?.overall === "high"
										? "text-green-600"
										: confidence?.overall === "medium"
											? "text-yellow-600"
											: "text-orange-600"
								}`}
							>
								{confidence?.overall?.toUpperCase()}
							</span>
						</div>
						<div>
							<span className="text-muted-foreground">Warnings:</span>
							<span className="ml-1 font-semibold text-foreground">
								{personalizedWarnings.length}
							</span>
						</div>
					</div>

					{personalizedWarnings.length > 0 && (
						<div className="mb-3 rounded-md bg-destructive/10 p-2">
							<div className="flex items-start gap-2">
								<AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
								<p className="text-destructive text-xs">
									{personalizedWarnings[0]}
								</p>
							</div>
						</div>
					)}

					<Link href={`/app/medications/${medicationId}/deep-dive`}>
						<Button className="w-full" variant="default">
							View Full Report
							<ChevronRight className="ml-1 h-4 w-4" />
						</Button>
					</Link>
				</>
			) : (
				<>
					<p className="mb-3 text-muted-foreground text-sm">
						Get a comprehensive, personalized analysis of this medication
						including usage instructions, side effects, and interactions.
					</p>
					<Link
						href={`/app/medications/${medicationId}/deep-dive${scanId ? `?scanId=${scanId}` : ""}`}
					>
						<Button className="w-full" variant="default">
							Generate Report
							<FileText className="ml-2 h-4 w-4" />
						</Button>
					</Link>
				</>
			)}
		</Card>
	);
}
