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
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { useState } from "react";

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
	dosage: number;
	measurement: string;
};

export function Dashboard() {
	const [rows, setRows] = useState<MedicationEntry[]>([
		{ id: "1", name: "Amoxicillin", dosage: 500, measurement: "mg" },
		{ id: "2", name: "Ibuprofen", dosage: 200, measurement: "mg" },
	]);
	const [selected, setSelected] = useState<Record<string, boolean>>({});
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [editingRow, setEditingRow] = useState<MedicationEntry | null>(null);
	const [isAdding, setIsAdding] = useState(false);

	const allSelected =
		rows.length > 0 && rows.every((r) => selected[r.id] === true);

	const toggleRow = (id: string) =>
		setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

	const toggleAll = () => {
		if (allSelected) setSelected({});
		else {
			const all: Record<string, boolean> = {};
			rows.forEach((r) => (all[r.id] = true));
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
				<div
					className="max-w-[150px] cursor-pointer truncate hover:text-blue-600"
					onClick={() => handleRowClick(row.original)}
				>
					{row.original.name}
				</div>
			),
		},
		{
			accessorKey: "dosage",
			header: () => <div className="pr-2 text-right">Dosage</div>,
			cell: ({ row }) => (
				<div
					className="cursor-pointer pr-2 text-right hover:text-blue-600"
					onClick={() => handleRowClick(row.original)}
				>
					{row.original.dosage}
				</div>
			),
		},
		{
			accessorKey: "measurement",
			header: () => <div className="pr-2 text-right">Unit</div>,
			cell: ({ row }) => (
				<div
					className="cursor-pointer pr-2 text-right capitalize hover:text-blue-600"
					onClick={() => handleRowClick(row.original)}
				>
					{row.original.measurement}
				</div>
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
				<div className="flex flex-wrap items-center gap-4">
					<Button onClick={handleAdd}>+ Add Medication</Button>
					<label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-gray-300 border-dashed bg-white p-4 transition hover:bg-gray-50">
						<span className="text-gray-600 text-sm">Upload / Take Picture</span>
						<input type="file" accept="image/*" className="hidden" />
					</label>
					<Button variant="secondary">Submit</Button>
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

				{/* Edit / Add Modal */}
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
