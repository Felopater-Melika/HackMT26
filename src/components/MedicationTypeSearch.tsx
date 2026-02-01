"use client";

import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { searchByDrugName } from "@/utils/api/rxnav";

// Common medications to suggest when query is short
const COMMON_MEDICATIONS = [
	"Aspirin",
	"Ibuprofen",
	"Acetaminophen",
	"Tylenol",
	"Advil",
	"Metformin",
	"Lisinopril",
	"Atorvastatin",
	"Omeprazole",
	"Amoxicillin",
	"Losartan",
	"Amlodipine",
	"Sertraline",
	"Albuterol",
	"Simvastatin",
	"Furosemide",
	"Clopidogrel",
	"Fluoxetine",
	"Prednisone",
	"Tramadol",
	"Diazepam",
	"Levothyroxine",
	"Metoprolol",
	"Insulin",
	"Warfarin",
	"Ceftriaxone",
	"Ciprofloxacin",
	"Doxycycline",
	"Azithromycin",
	"Ranitidine",
];

interface MedicationTypeSearchProps {
	onSelect: (medicationName: string) => void;
	placeholder?: string;
	submitLabel?: string;
	disabled?: boolean;
	isPending?: boolean;
	/** When true, selecting adds to list; when false, triggers analysis (dashboard) */
	mode?: "add" | "analyze";
	/** Hide the built-in header and description (for custom header in parent) */
	hideHeader?: boolean;
}

const DEBOUNCE_MS = 250;
const MIN_CHARS = 1;
const MAX_SUGGESTIONS = 10;

export function MedicationTypeSearch({
	onSelect,
	placeholder = "e.g. aspirin, metformin, ibuprofen",
	submitLabel = "Analyze",
	disabled = false,
	isPending = false,
	mode = "analyze",
	hideHeader = false,
}: MedicationTypeSearchProps) {
	const [query, setQuery] = useState("");
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [loadingSuggestions, setLoadingSuggestions] = useState(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!query || query.trim().length < MIN_CHARS) {
			setSuggestions([]);
			setLoadingSuggestions(false);
			return;
		}

		let mounted = true;
		const queryLower = query.trim().toLowerCase();

		// First, filter common medications for quick results - match from start
		const localMatches = COMMON_MEDICATIONS.filter((med) =>
			med.toLowerCase().startsWith(queryLower),
		).sort();

		if (localMatches.length > 0) {
			setSuggestions(localMatches.slice(0, MAX_SUGGESTIONS));
			setHighlightedIndex(-1);
			setLoadingSuggestions(false);
			return;
		}

		// If less than 2 chars, only show local matches (avoid API spam)
		if (query.trim().length < 2) {
			setSuggestions([]);
			setLoadingSuggestions(false);
			return;
		}

		setLoadingSuggestions(true);
		const t = setTimeout(async () => {
			try {
				const results = await searchByDrugName(query.trim());
				if (!mounted) return;
				const names = results
					.map((r) => (r.name || r.synonym || "").toString())
					.filter((name) => name.toLowerCase().startsWith(queryLower));
				const uniqueNames = Array.from(new Set(names));
				const sortedNames = uniqueNames.sort((a, b) =>
					a.toLowerCase().localeCompare(b.toLowerCase()),
				);
				setSuggestions(sortedNames.slice(0, MAX_SUGGESTIONS));
				setHighlightedIndex(-1);
			} catch (e) {
				if (mounted) setSuggestions([]);
			} finally {
				if (mounted) setLoadingSuggestions(false);
			}
		}, DEBOUNCE_MS);

		return () => {
			mounted = false;
			clearTimeout(t);
		};
	}, [query]);

	const showDropdown =
		isDropdownOpen &&
		query.trim().length >= MIN_CHARS &&
		(loadingSuggestions || suggestions.length > 0);

	const handleSelect = (name: string) => {
		setQuery("");
		setSuggestions([]);
		setIsDropdownOpen(false);
		setHighlightedIndex(-1);
		onSelect(name);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!showDropdown || suggestions.length === 0) {
			if (e.key === "Enter" && query.trim()) {
				handleSelect(query.trim());
			}
			return;
		}

		if (e.key === "ArrowDown") {
			e.preventDefault();
			setHighlightedIndex((i) =>
				i < suggestions.length - 1 ? i + 1 : i,
			);
			return;
		}
		if (e.key === "ArrowUp") {
			e.preventDefault();
			setHighlightedIndex((i) => (i > 0 ? i - 1 : -1));
			return;
		}
		if (e.key === "Enter") {
			e.preventDefault();
			if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
				handleSelect(suggestions[highlightedIndex]!);
			} else if (query.trim()) {
				handleSelect(query.trim());
			}
			return;
		}
		if (e.key === "Escape") {
			setIsDropdownOpen(false);
			setHighlightedIndex(-1);
		}
	};

	// Close dropdown when clicking outside
	useEffect(() => {
		const handler = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	return (
		<div ref={containerRef} className="relative">
			{!hideHeader && (
				<>
					<h3 className="mb-2 font-semibold text-foreground text-sm">
						Type Medication
					</h3>
					<p className="mb-3 text-muted-foreground text-sm">
						{mode === "analyze"
							? "Get AI analysis—safety score, warnings, interactions, and recommendations."
							: "Type a medication name and select from suggestions to add to your list."}
					</p>
				</>
			)}
			<div className="flex gap-2">
				<div className="relative flex-1">
					<Input
						type="text"
						placeholder={placeholder}
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
							setIsDropdownOpen(true);
						}}
						onFocus={() => query.trim().length >= MIN_CHARS && setIsDropdownOpen(true)}
						onKeyDown={handleKeyDown}
						disabled={disabled || isPending}
						className="w-full"
					/>

					{/* Autocomplete dropdown */}
					{showDropdown && (
						<ul
							className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-lg"
							role="listbox"
						>
							{loadingSuggestions ? (
								<li className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
									<Loader2 className="h-4 w-4 animate-spin" />
									Searching...
								</li>
							) : (
								suggestions.map((s, i) => (
									<li key={`${s}-${i}`}>
										<button
											type="button"
											role="option"
											aria-selected={i === highlightedIndex}
											onClick={() => handleSelect(s)}
											onMouseEnter={() => setHighlightedIndex(i)}
											className={`w-full rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
												i === highlightedIndex ? "bg-accent" : ""
											}`}
										>
											{s}
										</button>
									</li>
								))
							)}
						</ul>
					)}
				</div>
				<Button
					onClick={() => query.trim() && handleSelect(query.trim())}
					disabled={
						disabled ||
						isPending ||
						!query.trim() ||
						(loadingSuggestions && suggestions.length === 0)
					}
				>
					{isPending ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Analyzing...
						</>
					) : (
						<>
							<Search className="mr-2 h-4 w-4" />
							{mode === "add" ? "Add" : submitLabel}
						</>
					)}
				</Button>
			</div>
		</div>
	);
}
