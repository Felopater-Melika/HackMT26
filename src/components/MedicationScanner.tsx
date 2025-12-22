"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/trpc/react";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Upload, Trash2, Scan, Plus, FileText } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

enum MeasurementUnit {
	Mg = "mg",
	Mcg = "mcg",
	G = "g",
	Kg = "kg",
	Ml = "ml",
	L = "l",
	Unit = "unit",
	Tablet = "tablet",
	Capsule = "capsule",
	Drop = "drop",
	Spray = "spray",
	Puff = "puff",
	Patch = "patch",
	Suppository = "suppository",
	Ampule = "ampule",
	Vial = "vial",
	Dose = "dose",
	Injection = "injection",
	Suspension = "suspension",
	Solution = "solution",
	Cream = "cream",
	Gel = "gel",
	Ointment = "ointment",
}

type MedicationEntry = {
	id: string;
	name: string;
	dosage: number | null;
	measurement: string | null;
	ocrLines: string[];
};

interface MedicationScannerProps {
	profile?: unknown;
}

const STORAGE_KEY = "cliniq-medication-rows";

export function MedicationScanner({ profile }: MedicationScannerProps) {
	const [rows, setRows] = useState<MedicationEntry[]>([]);
	const [selected, setSelected] = useState<Record<string, boolean>>({});
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [editingRow, setEditingRow] = useState<MedicationEntry | null>(null);
	const [isAdding, setIsAdding] = useState(false);
	const [files, setFiles] = useState<File[]>([]);
	const [loading, setLoading] = useState(false);
	const [isInitialized, setIsInitialized] = useState(false);

	const router = useRouter();
	const ocrMutation = api.ocr.analyzeImages.useMutation();
	const medsAnalyzeMutation = api.medications.analyze.useMutation();

	// Load from localStorage on mount
	useEffect(() => {
		if (typeof window === "undefined") return;

		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored) as MedicationEntry[];
				if (Array.isArray(parsed)) {
					setRows(parsed);
				}
			}
		} catch (error) {
			console.error("Failed to load medications from localStorage:", error);
		} finally {
			setIsInitialized(true);
		}
	}, []);

	// Save to localStorage whenever rows change (but not on initial load)
	useEffect(() => {
		if (!isInitialized || typeof window === "undefined") return;

		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
		} catch (error) {
			console.error("Failed to save medications to localStorage:", error);
		}
	}, [rows, isInitialized]);

	const allSelected =
		rows.length > 0 && rows.every((r) => selected[r.id] === true);

	const toggleRow = (id: string) =>
		setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

	const toggleAll = () => {
		if (allSelected) setSelected({});
		else {
			const all: Record<string, boolean> = {};
			for (const r of rows) {
				all[r.id] = true;
			}
			setSelected(all);
		}
	};

	const handleSave = () => {
		if (!editingRow) return;
		setRows((prev) => {
			const exists = prev.some((r) => r.id === editingRow.id);
			return exists
				? prev.map((r) => (r.id === editingRow.id ? editingRow : r))
				: [...prev, editingRow];
		});
		setIsEditOpen(false);
		setIsAdding(false);
	};

	const handleDelete = (id: string) =>
		setRows((prev) => prev.filter((r) => r.id !== id));

	const handleDeleteSelected = () => {
		const idsToDelete = Object.keys(selected).filter((id) => selected[id]);
		setRows((prev) => prev.filter((r) => !idsToDelete.includes(r.id)));
		setSelected({});
	};

	const handleAdd = () => {
		const newRow: MedicationEntry = {
			id: crypto.randomUUID(),
			name: "",
			dosage: 0,
			measurement: "mg",
			ocrLines: [],
		};
		setEditingRow(newRow);
		setIsAdding(true);
		setIsEditOpen(true);
	};

	const handleRowClick = (row: MedicationEntry) => {
		setEditingRow(row);
		setIsAdding(false);
		setIsEditOpen(true);
	};

	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const onFilesAdded = useCallback((newFiles: FileList | File[]) => {
		const uploaded = Array.from(newFiles);
		const filtered = uploaded.filter((file) => {
			const type = file.type.toLowerCase();
			return type.startsWith("image/") || type === "application/pdf";
		});
		if (filtered.length > 0) {
			setFiles((prev) => [...prev, ...filtered]);
		}
	}, []);

	const handleFileUpload = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files) {
				onFilesAdded(e.target.files);
				e.target.value = "";
			}
		},
		[onFilesAdded],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
				onFilesAdded(e.dataTransfer.files);
				e.dataTransfer.clearData();
			}
		},
		[onFilesAdded],
	);

	const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	}, []);

	const removeFile = (name: string) =>
		setFiles((prev) => prev.filter((f) => f.name !== name));

	const handleSubmit = async () => {
		if (files.length === 0) return;
		setLoading(true);
		try {
			const base64Files = await Promise.all(
				files.map(async (file) => {
					const arrayBuffer = await file.arrayBuffer();
					const base64 = Buffer.from(arrayBuffer).toString("base64");
					return {
						data: base64,
						filename: file.name,
					};
				}),
			);

			const response = await ocrMutation.mutateAsync({
				files: base64Files,
			});

			if (response?.medications && Array.isArray(response.medications)) {
				const parsedRows: MedicationEntry[] = response.medications.map(
					(med) => ({
						id: crypto.randomUUID(),
						name: med.name ?? "",
						dosage: med.dosage ?? 0,
						measurement: med.measurement ?? "mg",
						ocrLines: med.ocrLines ?? [],
					}),
				);
				setRows((prev) => {
					const map = new Map(prev.map((r) => [r.name, r]));
					for (const r of parsedRows) {
						map.set(r.name, r);
					}
					return Array.from(map.values());
				});
				setSelected({});
				setFiles([]);
			}
		} catch (error) {
			console.error("OCR submission failed:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleClearStorage = () => {
		if (confirm("Clear all scanned medications? This cannot be undone.")) {
			localStorage.removeItem(STORAGE_KEY);
			setRows([]);
			setSelected({});
			console.log("✅ Local storage cleared");
		}
	};

	const handleAnalyzeMedications = async () => {
		try {
			console.log("🚀 Starting medication analysis...");
			
			toast.loading("Analyzing medications...", { id: "analysis" });
			
			const result = await medsAnalyzeMutation.mutateAsync({
				medications: rows.map((r) => ({
					name: r.name,
					dosage: r.dosage,
					measurement: r.measurement,
					ocrLines: r.ocrLines ?? [],
				})),
			});
			
			console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
			console.log("🎉 ANALYSIS COMPLETE - Frontend Results:");
			console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
			console.log("\n📊 Summary:");
			console.log("  Total Medications:", result.summary.totalMedications);
			console.log("  Successfully Analyzed:", result.summary.analyzedSuccessfully);
			console.log("  Average Safety Score:", result.summary.averageSafetyScore, "/100");
			console.log("  Requires Attention:", result.summary.requiresAttention ? "⚠️ YES" : "✅ No");
			
			console.log("\n💊 Individual Results:");
			result.individualResults.forEach((med: any, i: number) => {
				console.log(`\n${i + 1}. ${med.medicationName}`);
				if (med.success) {
					console.log(`   Safety Score: ${med.safetyScore}/100`);
					console.log(`   Warnings: ${med.warnings.length}`);
					console.log(`   Interactions: ${med.interactions.length}`);
					console.log(`   Recommendations: ${med.recommendations.length}`);
				} else {
					console.log(`   ❌ Error: ${med.error}`);
				}
			});
			
			if (result.interactionAnalysis) {
				console.log("\n🔗 Drug Interaction Analysis:");
				console.log("   Medications:", result.interactionAnalysis.medications.join(", "));
				console.log("   Interactions Found:", result.interactionAnalysis.interactions.length);
				console.log("   Recommendations:", result.interactionAnalysis.recommendations.length);
			}
			console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
			
			// Clear storage after successful analysis
			localStorage.removeItem(STORAGE_KEY);
			setRows([]);
			setSelected({});
			
			console.log("✅ Local storage cleared after successful analysis");
			
			// Show success toast
			toast.success("Analysis complete!", { 
				id: "analysis",
				description: `Analyzed ${result.summary.analyzedSuccessfully} medication(s)`,
			});
			
			// Redirect to dashboard
			router.push("/app/dashboard");
		} catch (error) {
			console.error("❌ Medication analysis request failed:", error);
			toast.error("Analysis failed", { 
				id: "analysis",
				description: "Please try again or check console for details",
			});
		}
	};

	const columns: ColumnDef<MedicationEntry>[] = [
		{
			id: "select",
			header: () => (
				<div className="flex items-center gap-2">
					<Checkbox
						checked={allSelected}
						onCheckedChange={toggleAll}
						aria-label="Select all"
					/>
				</div>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={!!selected[row.original.id]}
					onCheckedChange={() => toggleRow(row.original.id)}
					aria-label="Select row"
				/>
			),
			enableSorting: false,
		},
		{
			accessorKey: "name",
			header: "Medication",
			cell: ({ row }) => (
				<button
					type="button"
					className="max-w-[200px] cursor-pointer truncate text-left font-medium hover:text-primary"
					onClick={() => handleRowClick(row.original)}
				>
					{row.original.name || "Unnamed medication"}
				</button>
			),
		},
		{
			accessorKey: "dosage",
			header: () => <div className="text-right">Dosage</div>,
			cell: ({ row }) => (
				<button
					type="button"
					className="w-full cursor-pointer text-right hover:text-primary"
					onClick={() => handleRowClick(row.original)}
				>
					{row.original.dosage ?? "-"}
				</button>
			),
		},
		{
			accessorKey: "measurement",
			header: () => <div className="text-right">Unit</div>,
			cell: ({ row }) => (
				<button
					type="button"
					className="w-full cursor-pointer text-right capitalize hover:text-primary"
					onClick={() => handleRowClick(row.original)}
				>
					{row.original.measurement ?? "-"}
				</button>
			),
		},
		{
			id: "actions",
			header: () => (
				<div className="flex w-[60px] justify-end">
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={handleDeleteSelected}
						disabled={
							!Object.values(selected).some((v) => v === true) ||
							rows.length === 0
						}
					>
						<Trash2
							className={`h-4 w-4 ${
								Object.values(selected).some((v) => v)
									? "text-destructive"
									: "text-muted-foreground"
							}`}
						/>
					</Button>
				</div>
			),
			cell: ({ row }) => (
				<div className="flex w-[60px] justify-end">
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={() => handleDelete(row.original.id)}
					>
						<Trash2 className="h-4 w-4 text-red-500" />
					</Button>
				</div>
			),
		},
	];

	const table = useReactTable({
		data: rows,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
			{/* Header */}
			<div className="mb-8">
				<h1 className="mb-2 font-bold text-3xl text-foreground">
					Scan Medications
				</h1>
				<p className="text-muted-foreground">
					Upload images or PDFs of your medications to extract information
					automatically
				</p>
			</div>

			<div className="space-y-6">
				{/* Upload Section */}
				<div className="rounded-lg border bg-card p-6 shadow-sm">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="font-semibold text-lg text-foreground">
							Upload Files
						</h2>
						<Button
							variant="default"
							size="sm"
							onClick={handleAdd}
							className="gap-2"
						>
							<Plus className="h-4 w-4" />
							Add Manually
						</Button>
					</div>

					<div
  onDrop={handleDrop}
  onDragOver={handleDragOver}
  className="group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted p-12 hover:border-primary hover:bg-accent/50"
>
  <Upload className="mb-4 h-12 w-12 text-muted-foreground group-hover:text-primary" />

  <div className="text-center pointer-events-none">
    <p className="mb-1 font-medium text-foreground">
      Drag and drop files here
    </p>
    <p className="text-sm text-muted-foreground">
      or click to browse (images or PDFs)
    </p>
  </div>

  <input
    type="file"
    accept="image/*,application/pdf"
    multiple
    ref={fileInputRef}
    onChange={handleFileUpload}
    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
  />
</div>
					{/* File Previews */}
					{files.length > 0 && (
						<div className="mt-6">
							<div className="mb-3 flex items-center justify-between">
								<p className="font-medium text-sm text-foreground">
									{files.length} file{files.length !== 1 ? "s" : ""} ready
									to scan
								</p>
								<Button
									variant="default"
									size="sm"
									onClick={handleSubmit}
									disabled={loading}
									className="gap-2"
								>
									<Scan className="h-4 w-4" />
									{loading ? "Processing..." : "Scan Files"}
								</Button>
							</div>
							<div className="flex flex-wrap gap-3">
								{files.map((file) => {
									const isImage = file.type.startsWith("image/");
									const isPDF = file.type === "application/pdf";

									let preview = null;
									if (isImage) {
										const url = URL.createObjectURL(file);
										preview = (
											<img
												src={url}
												alt={file.name}
												className="h-20 w-20 rounded-md object-cover"
												onLoad={() => URL.revokeObjectURL(url)}
											/>
										);
									} else if (isPDF) {
										preview = (
											<div className="flex h-20 w-20 flex-col items-center justify-center rounded-md border bg-muted">
												<FileText className="mb-1 h-8 w-8 text-muted-foreground" />
											</div>
										);
									}

									return (
										<div
											key={file.name + file.size}
											className="group relative rounded-md border bg-card p-1 shadow-sm"
										>
											{preview}
											<button
												onClick={(e) => {
													e.stopPropagation();
													removeFile(file.name);
												}}
												className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
												aria-label={`Remove ${file.name}`}
												type="button"
											>
												×
											</button>
											<p className="mt-1 max-w-[80px] truncate text-xs text-muted-foreground">
												{file.name}
											</p>
										</div>
									);
								})}
							</div>
						</div>
					)}
				</div>

				{/* Medications Table */}
				{rows.length > 0 && (
					<div className="rounded-lg border bg-card shadow-sm">
						<div className="border-b bg-muted px-6 py-4">
							<div className="flex items-center justify-between">
								<h2 className="font-semibold text-lg text-foreground">
									Scanned Medications ({rows.length})
								</h2>
								<div className="flex gap-2">
									<Button
										variant="destructive"
										size="sm"
										onClick={handleClearStorage}
										disabled={rows.length === 0}
										className="gap-2"
									>
										<Trash2 className="h-4 w-4" />
										Clear All
									</Button>
									<Button
										variant="default"
										size="sm"
										onClick={handleAnalyzeMedications}
										disabled={medsAnalyzeMutation.isPending}
										className="gap-2"
									>
										<Scan className="h-4 w-4" />
										{medsAnalyzeMutation.isPending
											? "Analyzing..."
											: "Analyze All"}
									</Button>
								</div>
							</div>
						</div>
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									{table.getHeaderGroups().map((headerGroup) => (
										<TableRow key={headerGroup.id}>
											{headerGroup.headers.map((header) => (
												<TableHead
													key={header.id}
													className="font-semibold text-xs text-foreground"
												>
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
												</TableHead>
											))}
										</TableRow>
									))}
								</TableHeader>
								<TableBody>
									{table.getRowModel().rows.length ? (
										table.getRowModel().rows.map((row) => (
											<TableRow
												key={row.id}
												className={`transition-colors ${
													selected[row.original.id]
														? "bg-accent"
														: "hover:bg-muted/50"
												}`}
											>
												{row.getVisibleCells().map((cell) => (
													<TableCell key={cell.id} className="py-3">
														{flexRender(
															cell.column.columnDef.cell,
															cell.getContext(),
														)}
													</TableCell>
												))}
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell
												colSpan={columns.length}
												className="h-32 text-center text-muted-foreground"
											>
												No medications found.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					</div>
				)}

				{/* Empty State */}
				{rows.length === 0 && files.length === 0 && (
					<div className="rounded-lg border bg-card p-12 text-center">
						<Scan className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
						<h3 className="mb-2 font-semibold text-lg text-foreground">
							No medications scanned yet
						</h3>
						<p className="text-muted-foreground">
							Upload images or PDFs of your medications to get started
						</p>
					</div>
				)}
			</div>

			{/* Edit Modal */}
			<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							{isAdding ? "Add Medication" : "Edit Medication"}
						</DialogTitle>
						<DialogDescription>
							{isAdding
								? "Enter details for the new medication."
								: "Update the medication details below."}
						</DialogDescription>
					</DialogHeader>
					<div className="mt-4 space-y-4">
						<div>
							<label className="mb-2 block text-sm font-medium text-foreground">
								Medication Name
							</label>
							<Input
								value={editingRow?.name ?? ""}
								onChange={(e) =>
									setEditingRow((prev) =>
										prev ? { ...prev, name: e.target.value } : null,
									)
								}
								placeholder="Enter medication name"
							/>
						</div>
						<div>
							<label className="mb-2 block text-sm font-medium text-foreground">
								Dosage
							</label>
							<Input
								type="number"
								value={editingRow?.dosage ?? 0}
								onChange={(e) =>
									setEditingRow((prev) =>
										prev
											? { ...prev, dosage: Number.parseFloat(e.target.value) }
											: null,
									)
								}
								placeholder="Enter dosage"
							/>
						</div>
						<div>
							<label className="mb-2 block text-sm font-medium text-foreground">
								Unit
							</label>
							<select
								value={editingRow?.measurement ?? ""}
								onChange={(e) =>
									setEditingRow((prev) =>
										prev ? { ...prev, measurement: e.target.value } : null,
									)
								}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
							>
								<option value="" disabled>
									Select unit
								</option>
								{Object.values(MeasurementUnit).map((unit) => (
									<option key={unit} value={unit}>
										{unit}
									</option>
								))}
							</select>
						</div>
						<div className="flex justify-end gap-3 pt-4">
							<Button
								variant="outline"
								onClick={() => setIsEditOpen(false)}
							>
								Cancel
							</Button>
							<Button onClick={handleSave}>
								{isAdding ? "Add" : "Save Changes"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

