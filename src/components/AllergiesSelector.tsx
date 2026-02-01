"use client";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";

interface Allergy {
	id: string;
	name: string;
	description: string | null;
	source: string | null;
	createdBy: string | null;
	isVerified: boolean | null;
}

interface AllergiesSelectorProps {
	selectedAllergies: string[];
	onSelectionChange: (allergyIds: string[]) => void;
	placeholder?: string;
}

export function AllergiesSelector({
	selectedAllergies,
	onSelectionChange,
	placeholder = "Search allergies...",
}: AllergiesSelectorProps) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [customAllergyName, setCustomAllergyName] = useState("");
	const [customAllergyDescription, setCustomAllergyDescription] =
		useState("");
	const [isCreatingCustom, setIsCreatingCustom] = useState(false);

	const { data: allergies = [], isLoading } = api.allergies.search.useQuery(
		{ query: searchQuery },
		{
			enabled: searchQuery.length > 0,
		},
	);

	// Use prioritized list for picker (user-created first, then verified, then name)
	const { data: allAllergies = [] } =
		api.allergies.getAllForPicker.useQuery();

	const createCustomAllergy =
		api.allergies.createCustomAllergy.useMutation({
			onSuccess: (newAllergy) => {
				// Add the new allergy to selected allergies
				onSelectionChange([...selectedAllergies, newAllergy?.id ?? ""]);
				setCustomAllergyName("");
				setCustomAllergyDescription("");
				setIsCreatingCustom(false);
			},
			onError: (error) => {
				console.error("Failed to create custom allergy:", error);
			},
		});

	// Show full prioritized list when no search; do not slice
	const displayAllergies = searchQuery.length > 0 ? allergies : allAllergies;

	const selectedAllergyNames = selectedAllergies
		.map((allergyId) => {
			const allergy = [...allergies, ...allAllergies].find(
				(a) => a.id === allergyId,
			);
			return allergy?.name || "";
		})
		.filter(Boolean);

	const toggleAllergy = (allergyId: string) => {
		if (selectedAllergies.includes(allergyId)) {
			onSelectionChange(selectedAllergies.filter((id) => id !== allergyId));
		} else {
			onSelectionChange([...selectedAllergies, allergyId]);
		}
	};

	const handleCreateCustomAllergy = async () => {
		if (!customAllergyName.trim()) return;

		try {
			await createCustomAllergy.mutateAsync({
				name: customAllergyName.trim(),
				description: customAllergyDescription.trim() || undefined,
			});
		} catch (error) {
			console.error("Error creating custom allergy:", error);
		}
	};

	const handleAddCustomClick = () => {
		// Pre-fill with search query if available
		if (searchQuery.trim()) {
			setCustomAllergyName(searchQuery.trim());
		}
		setIsCreatingCustom(true);
		setOpen(false);
	};

	return (
		<div className="space-y-2">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						aria-expanded={open}
						className="w-full justify-between"
					>
						{selectedAllergyNames.length > 0
							? `${selectedAllergyNames.length} allerg${selectedAllergyNames.length > 1 ? "ies" : "y"} selected`
							: placeholder}
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-full p-0" align="start">
					<Command shouldFilter={false}>
						<CommandInput
							placeholder="Search allergies..."
							value={searchQuery}
							onValueChange={setSearchQuery}
						/>
						<CommandList>
							<CommandEmpty>
								{isLoading ? (
									<div className="py-6 text-center text-sm">Searching...</div>
								) : (
									<div className="flex flex-col items-center justify-center px-4 py-6 text-sm">
										<p className="mb-4 text-center text-muted-foreground">
											"{searchQuery}" wasn't found. Would you like to add it?
										</p>
										<Button
											variant="outline"
											size="sm"
											onClick={handleAddCustomClick}
											className="w-full max-w-full"
										>
											<Plus className="mr-2 h-4 w-4 flex-shrink-0" />
											<span>Add allergy</span>
										</Button>
									</div>
								)}
							</CommandEmpty>
							<CommandGroup>
								{displayAllergies.map((allergy) => (
									<CommandItem
										key={allergy.id}
										value={allergy.id}
										onSelect={() => toggleAllergy(allergy.id)}
									>
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												selectedAllergies.includes(allergy.id)
													? "opacity-100"
													: "opacity-0",
											)}
										/>
										<div className="flex flex-col">
											<span>{allergy.name}</span>
											{allergy.description && (
												<span className="text-muted-foreground text-sm">
													{allergy.description}
												</span>
											)}
											{allergy.source === "user" && (
												<span className="text-primary text-xs">
													Custom allergy
												</span>
											)}
										</div>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			<Dialog open={isCreatingCustom} onOpenChange={setIsCreatingCustom}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Add Custom Allergy</DialogTitle>
						<DialogDescription>
							Add a medication allergy that's not in our database.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="allergy-name" className="text-right">
								Name *
							</Label>
							<Input
								id="allergy-name"
								value={customAllergyName}
								onChange={(e) => setCustomAllergyName(e.target.value)}
								className="col-span-3"
								placeholder="Enter allergy name"
							/>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="allergy-description" className="text-right">
								Description
							</Label>
							<Input
								id="allergy-description"
								value={customAllergyDescription}
								onChange={(e) => setCustomAllergyDescription(e.target.value)}
								className="col-span-3"
								placeholder="Optional description"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsCreatingCustom(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleCreateCustomAllergy}
							disabled={
								!customAllergyName.trim() || createCustomAllergy.isPending
							}
						>
							{createCustomAllergy.isPending ? "Adding..." : "Add Allergy"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{selectedAllergyNames.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{selectedAllergyNames.map((name) => (
						<span
							key={name || Math.random().toString(36)}
							className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-primary text-sm"
						>
							{name}
							<button
								type="button"
								onClick={() => {
									const allergyId =
										[...allergies, ...allAllergies].find(
											(a) => a.name === name,
										)?.id || "";
									onSelectionChange(
										selectedAllergies.filter((id) => id !== allergyId),
									);
								}}
								className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
							>
								×
							</button>
						</span>
					))}
				</div>
			)}
		</div>
	);
}
