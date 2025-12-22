# Medication Analysis API Response Format

## Overview

The medication analysis API now returns **structured JSON** that's optimized for frontend parsing and display. The AI is instructed to respond in a specific format, and the response is parsed into strongly-typed TypeScript interfaces.

## Response Structure

### Individual Medication Analysis

```typescript
{
  "success": true,
  "individualResults": [
    {
      "medicationName": "Aspirin",
      "dosage": 500,
      "measurement": "mg",
      "success": true,
      "safetyScore": 85,
      "requiresAttention": false,
      "summary": "Aspirin is generally safe for this patient. Monitor for bleeding risks due to concurrent warfarin use.",
      "warnings": [
        "Increased bleeding risk with current warfarin medication",
        "Avoid if allergic to NSAIDs",
        "May cause stomach upset"
      ],
      "interactions": [
        "Warfarin + Aspirin: Significantly increased bleeding risk",
        "May reduce effectiveness of blood pressure medications"
      ],
      "recommendations": [
        "Take with food to minimize stomach upset",
        "Consult doctor about dosage adjustment with warfarin",
        "Monitor for unusual bleeding or bruising",
        "Report any black stools immediately"
      ]
    }
  ],
  "interactionAnalysis": null,
  "summary": {
    "totalMedications": 1,
    "analyzedSuccessfully": 1,
    "requiresAttention": false,
    "averageSafetyScore": 85
  }
}
```

### Multiple Medications with Interaction Analysis

```typescript
{
  "success": true,
  "individualResults": [
    {
      "medicationName": "Aspirin",
      "safetyScore": 85,
      "requiresAttention": false,
      // ... (same as above)
    },
    {
      "medicationName": "Ibuprofen",
      "safetyScore": 70,
      "requiresAttention": true,
      // ...
    }
  ],
  "interactionAnalysis": {
    "medications": ["Aspirin", "Ibuprofen"],
    "overallSafetyScore": 65,
    "requiresAttention": true,
    "summary": "Taking Aspirin and Ibuprofen together increases GI bleeding risk. These medications should not be combined without medical supervision.",
    "interactions": [
      "Both are NSAIDs - increased risk of stomach bleeding",
      "Reduced effectiveness of aspirin for heart protection",
      "Combined kidney stress"
    ],
    "recommendations": [
      "Do not take these medications together",
      "Consult doctor for alternative pain relief",
      "If must use both, separate by at least 8 hours",
      "Watch for signs of GI bleeding"
    ]
  },
  "summary": {
    "totalMedications": 2,
    "analyzedSuccessfully": 2,
    "requiresAttention": true,
    "averageSafetyScore": 77
  }
}
```

## Safety Score Interpretation

| Score Range | Level | Color | Meaning |
|-------------|-------|-------|---------|
| 90-100 | Very Safe | 🟢 Green | Minimal concerns, safe for patient |
| 70-89 | Safe | 🔵 Blue | Generally safe with standard precautions |
| 50-69 | Moderate | 🟡 Yellow | Some concerns, consult healthcare provider |
| 0-49 | Concerning | 🔴 Red | Significant concerns, immediate consultation needed |

## AI Prompt Format

The AI is instructed to respond with this **exact JSON structure**:

```json
{
  "safetyScore": 85,
  "requiresAttention": false,
  "warnings": ["warning 1", "warning 2"],
  "interactions": ["interaction 1", "interaction 2"],
  "recommendations": ["rec 1", "rec 2"],
  "summary": "Brief 2-3 sentence overview"
}
```

### Prompt Guidelines

1. **Concise & Direct**: Prompts are optimized for clarity and reduced token usage
2. **Tool Usage**: AI explicitly told to use both tools (OpenFDA + Patient Records)
3. **Structured Output**: AI instructed to return only JSON, no extra text
4. **Fallback Parsing**: If JSON fails, text extraction provides fallback

## Parsing Logic

### Primary: JSON Parsing
```typescript
// Extract JSON from AI response
const jsonMatch = text.match(/\{[\s\S]*\}/);
const parsed = JSON.parse(jsonMatch[0]);
```

### Fallback: Text Extraction
```typescript
// If JSON parsing fails, extract from text
const warnings = extractListItems(text, "warning");
const interactions = extractListItems(text, "interaction");
```

## Frontend Usage

### TypeScript Types

```typescript
import type { 
  MedicationAnalysisResponse,
  MedicationAnalysisResult,
  InteractionAnalysis 
} from "@/types/medication-analysis";

// Use in your component
const { mutate } = api.medications.analyze.useMutation<MedicationAnalysisResponse>();
```

### Display Component Example

```tsx
function AnalysisResults({ data }: { data: MedicationAnalysisResponse }) {
  return (
    <div>
      <h2>Analysis Summary</h2>
      <p>Average Safety Score: {data.summary.averageSafetyScore}/100</p>
      
      {data.individualResults.map((med) => (
        <div key={med.medicationName}>
          <h3>{med.medicationName}</h3>
          <SafetyBadge score={med.safetyScore} />
          
          <div>
            <h4>Warnings</h4>
            <ul>
              {med.warnings?.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
          
          <div>
            <h4>Recommendations</h4>
            <ul>
              {med.recommendations?.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        </div>
      ))}
      
      {data.interactionAnalysis && (
        <div>
          <h3>Drug Interactions</h3>
          <p>{data.interactionAnalysis.summary}</p>
          <ul>
            {data.interactionAnalysis.interactions.map((int, i) => (
              <li key={i}>{int}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## Benefits

✅ **Type Safety**: Strongly typed interfaces for frontend  
✅ **Easy Parsing**: JSON structure is straightforward  
✅ **Flexible Display**: Arrays allow easy mapping to UI  
✅ **Fallback Support**: Text extraction if JSON fails  
✅ **Optimized Tokens**: Concise prompts reduce costs  
✅ **Consistent Format**: Same structure every time  
✅ **Summary Stats**: Quick overview without parsing  

## Console Output

The API also logs beautiful formatted output to the terminal:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔬 [MEDICATION ANALYSIS] Starting analysis...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Analyzing: Aspirin...

🔧 [TOOL USAGE] AI requested 2 tool call(s)

📞 Calling tool: patient_records_lookup
   Arguments: { "medicationName": "Aspirin" }
✅ Patient records lookup completed in 89ms
   Result preview: {"patient":{"demographics":...

📞 Calling tool: openfda_drug_lookup
   Arguments: { "medicationName": "Aspirin" }
✅ OpenFDA lookup completed in 234ms
   Result preview: {"found":true,"medication":"aspirin"...

📊 [TOOL RESULTS] All 2 tool(s) executed successfully
   Sending results back to AI for final analysis...

✅ Analysis complete for: Aspirin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESULTS:
  Safety Score: 85 /100
  Requires Attention: false

⚠️  Warnings: 3
  1. Increased bleeding risk with current warfarin medication
  2. Avoid if allergic to NSAIDs
  3. May cause stomach upset
  ...
```

## Error Handling

```typescript
{
  "success": true,
  "individualResults": [
    {
      "medicationName": "Unknown Drug",
      "success": false,
      "error": "404 Resource not found"
    }
  ],
  "interactionAnalysis": null,
  "summary": {
    "totalMedications": 1,
    "analyzedSuccessfully": 0,
    "requiresAttention": false,
    "averageSafetyScore": 0
  }
}
```

## Next Steps

Now you can:
1. Create beautiful UI components to display the results
2. Add color coding based on safety scores
3. Show warnings/interactions in expandable sections
4. Export results to PDF
5. Save to database for history
6. Share results with healthcare providers

The structured format makes all of this easy! 🎉

