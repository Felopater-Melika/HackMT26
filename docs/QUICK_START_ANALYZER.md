# Quick Start: Medication Analyzer

Get started with AI-powered medication analysis in 5 minutes.

## 1. Prerequisites

Ensure your `.env` file has Azure OpenAI credentials:

```bash
AZURE_AI_API_KEY=your_key_here
AZURE_AI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_AI_DEPLOYMENT=gpt-4
AZURE_AI_API_VERSION=2024-02-15-preview
```

## 2. Add to Your Page

```typescript
import { MedicationAnalysisCard } from "@/components/MedicationAnalysisCard";

export default function AnalysisPage() {
  return (
    <div className="container mx-auto py-8">
      <MedicationAnalysisCard />
    </div>
  );
}
```

## 3. Use the API

```typescript
import { api } from "@/trpc/react";

function MyComponent() {
  const { mutate: analyze, data } = 
    api.medicationAnalysis.analyzeSingle.useMutation();

  return (
    <button onClick={() => analyze({ medicationName: "aspirin" })}>
      Analyze Aspirin
    </button>
  );
}
```

## 4. What You Get

The analyzer returns:

```typescript
{
  medicationName: "aspirin",
  safetyScore: 85,              // 0-100
  requiresAttention: false,     // true if concerns
  warnings: [                   // Patient-specific warnings
    "May interact with warfarin",
    "Avoid if allergic to NSAIDs"
  ],
  interactions: [               // With current medications
    "Increased bleeding risk with warfarin"
  ],
  recommendations: [            // Personalized advice
    "Take with food to reduce stomach upset",
    "Consult doctor about warfarin interaction"
  ],
  analysis: "Full detailed analysis text..."
}
```

## 5. Available Endpoints

### Single Medication
```typescript
api.medicationAnalysis.analyzeSingle.useMutation()
```

### Multiple Medications (Interactions)
```typescript
api.medicationAnalysis.analyzeMultiple.useMutation()
```

### Quick Safety Check
```typescript
api.medicationAnalysis.quickSafetyCheck.useQuery()
```

### Scanned Medication
```typescript
api.medicationAnalysis.analyzeScannedMedication.useMutation()
```

## How It Works

1. **Patient Context**: Retrieves your medical history, conditions, and current medications
2. **FDA Data**: Looks up official medication information from OpenFDA
3. **AI Analysis**: Azure OpenAI analyzes interactions and contraindications
4. **Personalized Advice**: Generates recommendations specific to your situation

## Example Use Cases

### After Scanning a Medication
```typescript
const { mutate: analyzeScanned } = 
  api.medicationAnalysis.analyzeScannedMedication.useMutation();

// After OCR scan detects "Ibuprofen"
analyzeScanned({
  medicationName: "Ibuprofen",
  scanId: scanResult.id,
});
```

### Checking Drug Interactions
```typescript
const { mutate: checkInteractions } = 
  api.medicationAnalysis.analyzeMultiple.useMutation();

checkInteractions({
  medicationNames: ["aspirin", "warfarin", "ibuprofen"],
});
```

### Quick Safety Check Before Purchase
```typescript
const { data } = api.medicationAnalysis.quickSafetyCheck.useQuery({
  medicationName: "acetaminophen",
});

// Returns: { safetyScore, topWarnings, topInteractions, quickRecommendation }
```

## Safety Features

✅ **Personalized**: Based on your medical history  
✅ **Comprehensive**: Checks FDA data + patient records  
✅ **Interactive**: Drug-drug interaction detection  
✅ **Contraindications**: Flags issues with your conditions  
✅ **Safety Scores**: Easy-to-understand 0-100 rating  

## Important Notes

- Requires authenticated user with profile
- Analysis takes 5-15 seconds
- Not a substitute for medical advice
- Always consult healthcare provider for decisions

## Need Help?

See full documentation: [MEDICATION_ANALYZER.md](./MEDICATION_ANALYZER.md)

