"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "@/trpc/react";
import { searchByDrugName } from "@/utils/api/rxnav";

export function MedicationSearch() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const { mutate: analyzeMedication, isPending, data } =
    api.medicationAnalysis.analyzeSingle.useMutation();

  // debounce queries
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    let mounted = true;
    setLoadingSuggestions(true);
    const t = setTimeout(async () => {
      try {
        const results = await searchByDrugName(query.trim());
        if (!mounted) return;
        setSuggestions(
          results.map((r) => (r.name || r.synonym || "").toString()).filter(Boolean),
        );
      } catch (e) {
        console.error("Suggest error", e);
        if (mounted) setSuggestions([]);
      } finally {
        if (mounted) setLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [query]);

  const uniqueSuggestions = useMemo(() => Array.from(new Set(suggestions)).slice(0, 8), [suggestions]);

  const handleSelect = (name: string) => {
    setQuery(name);
    setSuggestions([]);
    analyzeMedication({ medicationName: name });
  };

  return (
    <div className="mb-6">
      <Card className="p-6">
        <h2 className="mb-3 font-bold text-lg text-foreground">Find Medication</h2>
        <p className="mb-4 text-sm text-muted-foreground">Type a medication name or select a suggestion to get AI analysis.</p>

        <div className="relative">
          <div className="flex gap-2">
            <Input
              placeholder="Search medications (e.g., ibuprofen)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) analyzeMedication({ medicationName: query.trim() });
              }}
              className="flex-1"
            />
            <Button onClick={() => analyzeMedication({ medicationName: query.trim() })} disabled={!query.trim() || isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Analyzing...</> : <><Search className="mr-2 h-4 w-4"/>Analyze</>}
            </Button>
          </div>

          {/* Suggestions dropdown */}
          {loadingSuggestions && (
            <div className="mt-2 text-sm text-muted-foreground">Searching...</div>
          )}

          {uniqueSuggestions.length > 0 && (
            <ul className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-md border bg-popover p-2 shadow">
              {uniqueSuggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => handleSelect(s)}
                    className="w-full text-left px-2 py-1 hover:bg-accent"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Analysis result (reuses MedicationAnalysisCard layout) */}
        {data && (
          <div className="mt-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-xl text-foreground">{data.medicationName}</h3>
                <div className="mt-2 flex items-center gap-2">
                  {data.requiresAttention ? (
                    <><AlertCircle className="h-5 w-5 text-destructive"/><span className="font-medium text-destructive text-sm">Requires Attention</span></>
                  ) : (
                    <><CheckCircle className="h-5 w-5 text-green-600"/><span className="font-medium text-green-600 text-sm">Generally Safe</span></>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-3xl text-foreground">{data.safetyScore}</div>
                <div className="text-muted-foreground text-xs">Safety Score</div>
              </div>
            </div>

            {data.warnings?.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 font-semibold text-foreground text-sm">Warnings</h4>
                <ul className="space-y-1">
                  {data.warnings.map((w: string, i: number) => (
                    <li key={i} className="rounded-md bg-destructive/10 px-3 py-2 text-sm">{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.interactions?.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 font-semibold text-foreground text-sm">Potential Interactions</h4>
                <ul className="space-y-1">
                  {data.interactions.map((it: string, i: number) => (
                    <li key={i} className="rounded-md bg-muted px-3 py-2 text-sm">{it}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.recommendations?.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 font-semibold text-foreground text-sm">Recommendations</h4>
                <ul className="space-y-1">
                  {data.recommendations.map((r: string, i: number) => (
                    <li key={i} className="rounded-md bg-primary/10 px-3 py-2 text-sm">{r}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="mb-2 font-semibold text-foreground text-sm">Detailed Analysis</h4>
              <div className="rounded-md bg-card p-4 text-sm leading-relaxed whitespace-pre-wrap border">{data.analysis}</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
