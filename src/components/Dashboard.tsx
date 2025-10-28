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
import { Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";

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

export function Dashboard() {
	const [rows, setRows] = useState<MedicationEntry[]>([]);
	const [selected, setSelected] = useState<Record<string, boolean>>({});
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [editingRow, setEditingRow] = useState<MedicationEntry | null>(null);
	const [isAdding, setIsAdding] = useState(false);
	const [files, setFiles] = useState<File[]>([]);
	const [loading, setLoading] = useState(false);

	const ocrMutation = api.ocr.analyzeImages.useMutation();
	const medsAnalyzeMutation = api.medications.analyze.useMutation();

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

	// New drag-and-drop uploader handlers and component
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const onFilesAdded = useCallback(
		(newFiles: FileList | File[]) => {
			const uploaded = Array.from(newFiles);
			// Filter to only images or PDFs
			const filtered = uploaded.filter((file) => {
				const type = file.type.toLowerCase();
				return type.startsWith("image/") || type === "application/pdf";
			});
			if (filtered.length > 0) {
				setFiles((prev) => [...prev, ...filtered]);
			}
		},
		[],
	);

	const handleFileUpload = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files) {
				onFilesAdded(e.target.files);
				e.target.value = ""; // reset input to allow same file upload again
			}
		},
		[onFilesAdded],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent<HTMLButtonElement>) => {
			e.preventDefault();
			if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
				onFilesAdded(e.dataTransfer.files);
				e.dataTransfer.clearData();
			}
		},
		[onFilesAdded],
	);

	const handleDragOver = useCallback((e: React.DragEvent<HTMLButtonElement>) => {
		e.preventDefault();
	}, []);

	const removeFile = (name: string) =>
		setFiles((prev) => prev.filter((f) => f.name !== name));

	const handleSubmit = async () => {
		if (files.length === 0) return;
		setLoading(true);
		try {
			// Convert files to base64 strings
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

			// Call OCR mutation with base64 files
			const response = await ocrMutation.mutateAsync({
				files: base64Files,
			});

			// Parse response and update rows
			// Assuming response.medications is array of { name: string, dosage: number, measurement: string }
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
				setRows(parsedRows);
				setSelected({});
				setFiles([]);
			}
		} catch (error) {
			console.error("OCR submission failed:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleAnalyzeMedications = async () => {
		try {
			await medsAnalyzeMutation.mutateAsync({
				medications: rows.map((r) => ({
					name: r.name,
					dosage: r.dosage,
					measurement: r.measurement,
					ocrLines: r.ocrLines ?? [],
				})),
			});
		} catch (error) {
			console.error("Medication analysis request failed:", error);
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
					className="max-w-[150px] cursor-pointer truncate text-left hover:text-blue-600"
					onClick={() => handleRowClick(row.original)}
				>
					{row.original.name}
				</button>
			),
		},
		{
			accessorKey: "dosage",
			header: () => <div className="pr-2 text-right">Dosage</div>,
			cell: ({ row }) => (
				<button
					type="button"
					className="w-full cursor-pointer pr-2 text-right hover:text-blue-600"
					onClick={() => handleRowClick(row.original)}
				>
					{row.original.dosage}
				</button>
			),
		},
		{
			accessorKey: "measurement",
			header: () => <div className="pr-2 text-right">Unit</div>,
			cell: ({ row }) => (
				<button
					type="button"
					className="w-full cursor-pointer pr-2 text-right capitalize hover:text-blue-600"
					onClick={() => handleRowClick(row.original)}
				>
					{row.original.measurement}
				</button>
			),
		},
		{
			id: "actions",
			header: () => (
				<div className="flex w-[60px] justify-end gap-1 pr-[8px]">
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={handleDeleteSelected}
						disabled={
							!Object.values(selected).some((v) => v === true) ||
							rows.length === 0
						}
					>
						<Trash2
							className={`h-4 w-4 ${
								Object.values(selected).some((v) => v)
									? "text-red-500"
									: "text-gray-400"
							}`}
						/>
					</Button>
				</div>
			),
			cell: ({ row }) => (
				<div className="flex w-[60px] justify-end gap-1 pr-[8px]">
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
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
		<div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-4xl space-y-8">
				<div className="flex items-center justify-between">
					<h1 className="font-bold text-2xl text-gray-900">
						Medication Dashboard
					</h1>
				</div>

				{/* Controls */}
				<div className="flex flex-col gap-4">
					<div className="flex flex-wrap items-center gap-4">
						<Button onClick={handleAdd}>+ Add Medication</Button>

					{/* New Drag and Drop Upload Area */}
					<button
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onClick={() => fileInputRef.current?.click()}
						className="relative flex cursor-pointer flex-col items-center justify-center rounded-md border border-gray-300 border-dashed bg-white p-4 text-center text-gray-600 transition hover:bg-gray-50"
						aria-label="File Upload Dropzone"
						type="button"
					>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="mb-2 h-8 w-8"
								role="img"
								aria-label="Upload icon"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
								/>
							</svg>
							<span className="font-medium text-sm">
								Drag &amp; drop images or PDFs here, or click to select files
							</span>
							<input
								type="file"
								accept="image/*,application/pdf"
								multiple
								ref={fileInputRef}
								onChange={handleFileUpload}
								className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
							/>
						</button>

						<Button
							variant="secondary"
							onClick={handleAnalyzeMedications}
							disabled={rows.length === 0 || medsAnalyzeMutation.isPending}
						>
							{medsAnalyzeMutation.isPending
								? "Sending..."
								: "Analyze Medications"}
						</Button>

						<Button
							variant="secondary"
							disabled={files.length === 0 || loading}
							onClick={handleSubmit}
						>
							{loading ? "Processing..." : "Submit"}
						</Button>
					</div>

					{/* File list with previews */}
					{files.length > 0 && (
						<div className="rounded-md border bg-white p-3 text-gray-700 text-sm">
							<div className="mb-1 font-medium">Uploaded Files:</div>
							<ul className="flex flex-wrap gap-3">
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
												className="max-h-24 max-w-24 rounded-md object-contain"
												onLoad={() => URL.revokeObjectURL(url)}
											/>
										);
									} else if (isPDF) {
										preview = (
											<div className="flex h-24 w-24 flex-col items-center justify-center rounded-md border border-gray-300 bg-gray-100 p-2 text-gray-700 text-xs">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													strokeWidth={1.5}
													stroke="currentColor"
													className="mb-1 h-8 w-8"
													role="img"
													aria-label="PDF file"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M12 4.5v15m7.5-7.5h-15"
													/>
												</svg>
												<span className="truncate">{file.name}</span>
											</div>
										);
									}

									return (
										<li
											key={file.name + file.size}
											className="relative flex flex-col items-center rounded-md border border-gray-300 bg-white p-1"
										>
											{preview}
											<button
												onClick={() => removeFile(file.name)}
												className="absolute top-0 right-0 rounded-bl-md bg-red-500 px-1 font-bold text-white text-xs hover:bg-red-600"
												aria-label={`Remove ${file.name}`}
												type="button"
											>
												×
											</button>
											{!isImage && !isPDF && (
												<span className="max-w-[80px] truncate text-center text-xs">
													{file.name}
												</span>
											)}
										</li>
									);
								})}
							</ul>
						</div>
					)}
				</div>

				{/* Table */}
				<div className="w-fit overflow-hidden rounded-md border bg-white p-2">
					<Table className="text-sm">
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead
											key={header.id}
											className="font-semibold text-xs"
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
										className={`text-sm ${
											selected[row.original.id] ? "bg-gray-100" : "bg-white"
										}`}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id} className="px-3 py-2">
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
										className="h-24 text-center text-gray-500"
									>
										No medications found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				{/* Edit Modal */}
				<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
					<DialogContent className="max-w-sm">
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
						<div className="mt-4 space-y-3">
							<Input
								value={editingRow?.name ?? ""}
								onChange={(e) =>
									setEditingRow((prev) =>
										prev ? { ...prev, name: e.target.value } : null,
									)
								}
								placeholder="Medication name"
							/>
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
								placeholder="Dosage"
							/>
							<select
								value={editingRow?.measurement ?? ""}
								onChange={(e) =>
									setEditingRow((prev) =>
										prev ? { ...prev, measurement: e.target.value } : null,
									)
								}
								className="w-full rounded-md border border-gray-300 p-2 text-sm"
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
							<div className="flex justify-end gap-2 pt-3">
								<Button variant="outline" onClick={() => setIsEditOpen(false)}>
									Cancel
								</Button>
								<Button onClick={handleSave}>
									{isAdding ? "Add" : "Save"}
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
