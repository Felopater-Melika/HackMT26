# Medication Analyzer with Azure OpenAI

AI-powered medication analysis system using LangChain, Azure OpenAI, and custom tools to provide personalized medication safety advice.

## Overview

The Medication Analyzer combines:
- **OpenFDA Tool**: Retrieves authoritative medication data from the FDA
- **Patient Records Tool**: Accesses patient medical history, conditions, and current medications
- **Azure OpenAI**: GPT-4 powered analysis with LangChain agents
- **Personalized Recommendations**: Tailored advice based on patient context

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Medication Analyzer                       │
│                                                              │
│  ┌────────────────┐      ┌──────────────────┐              │
│  │  Azure OpenAI  │◄─────┤  LangChain Agent │              │
│  │   (GPT-4)      │      │                  │              │
│  └────────────────┘      └────────┬─────────┘              │
│                                   │                          │
│                          ┌────────▼────────┐                │
│                          │     Tools       │                │
│                          └────────┬────────┘                │
│                                   │                          │
│              ┌────────────────────┼────────────────────┐    │
│              │                    │                    │    │
│      ┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────┐
│      │  OpenFDA Tool  │  │ Patient Records│  │   Future   │
│      │                │  │      Tool      │  │   Tools    │
│      └───────┬────────┘  └───────┬────────┘  └────────────┘
│              │                    │                          │
│      ┌───────▼────────┐  ┌───────▼────────┐                │
│      │  FDA Database  │  │   PostgreSQL   │                │
│      │   (OpenFDA)    │  │   (Patient DB) │                │
│      └────────────────┘  └────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## Features

### 1. Single Medication Analysis
Analyzes one medication with:
- FDA-approved information (indications, warnings, dosage)
- Drug interactions with current medications
- Contraindications based on patient conditions
- Safety score (0-100)
- Personalized recommendations

### 2. Multiple Medication Analysis
Analyzes interactions between multiple medications:
- Drug-drug interactions
- Combined effects and risks
- Overall safety assessment
- Specific warnings for the combination

### 3. Quick Safety Check
Fast safety assessment for immediate decisions:
- Safety score
- Top 3 warnings
- Top 3 interactions
- Quick recommendation

## Setup

### 1. Environment Variables

Ensure these are set in your `.env` file:

```bash
# Azure OpenAI Configuration
AZURE_AI_API_KEY=your_azure_openai_api_key
AZURE_AI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_AI_DEPLOYMENT=your-gpt4-deployment-name
AZURE_AI_API_VERSION=2024-02-15-preview
AZURE_AI_REGION=eastus

# Database
DATABASE_URL=postgresql://...
```

### 2. Install Dependencies

```bash
bun add @langchain/openai @langchain/core langchain @azure/openai
```

### 3. Database Schema

The analyzer uses these tables:
- `user_profiles` - Patient demographics
- `conditions` & `user_conditions` - Medical conditions
- `medications` & `user_medications` - Current medications
- `scans` & `scan_medications` - Scan history
- `reports` - AI-generated reports

## Usage

### Via tRPC API

```typescript
// In your React component
import { api } from "@/trpc/react";

function MyComponent() {
  const { mutate: analyzeMedication } = 
    api.medicationAnalysis.analyzeSingle.useMutation();

  const handleAnalyze = () => {
    analyzeMedication(
      { medicationName: "aspirin" },
      {
        onSuccess: (data) => {
          console.log("Safety Score:", data.safetyScore);
          console.log("Warnings:", data.warnings);
          console.log("Interactions:", data.interactions);
          console.log("Recommendations:", data.recommendations);
        },
      }
    );
  };

  return <button onClick={handleAnalyze}>Analyze</button>;
}
```

### Direct Usage

```typescript
import { createMedicationAnalyzer } from "@/lib/medication-analyzer";

const analyzer = createMedicationAnalyzer({
  userId: "user_123",
  temperature: 0.3,
  maxTokens: 2000,
});

// Analyze single medication
const result = await analyzer.analyzeMedication("aspirin");

// Analyze multiple medications
const multiResult = await analyzer.analyzeMultipleMedications([
  "aspirin",
  "ibuprofen",
  "warfarin",
]);
```

### Using the React Component

```typescript
import { MedicationAnalysisCard } from "@/components/MedicationAnalysisCard";

export default function AnalysisPage() {
  return (
    <div>
      <h1>Medication Analysis</h1>
      <MedicationAnalysisCard />
    </div>
  );
}
```

## API Endpoints

### `medicationAnalysis.analyzeSingle`
Analyzes a single medication.

**Input:**
```typescript
{
  medicationName: string;
}
```

**Output:**
```typescript
{
  medicationName: string;
  analysis: string;
  warnings: string[];
  interactions: string[];
  recommendations: string[];
  safetyScore: number; // 0-100
  requiresAttention: boolean;
  rawResponse: string;
}
```

### `medicationAnalysis.analyzeMultiple`
Analyzes multiple medications for interactions.

**Input:**
```typescript
{
  medicationNames: string[]; // min 2
}
```

**Output:**
```typescript
{
  medications: string[];
  overallAnalysis: string;
  interactions: string[];
  recommendations: string[];
  rawResponse: string;
}
```

### `medicationAnalysis.quickSafetyCheck`
Quick safety assessment.

**Input:**
```typescript
{
  medicationName: string;
}
```

**Output:**
```typescript
{
  medicationName: string;
  safetyScore: number;
  requiresAttention: boolean;
  topWarnings: string[]; // max 3
  topInteractions: string[]; // max 3
  quickRecommendation: string;
}
```

### `medicationAnalysis.analyzeScannedMedication`
Analyzes a scanned medication with scan context.

**Input:**
```typescript
{
  medicationName: string;
  scanId?: string;
  additionalContext?: string;
}
```

## How It Works

### 1. Tool Invocation
When analyzing a medication, the LangChain agent:
1. Calls `patient_records_lookup` to get patient context
2. Calls `openfda_drug_lookup` to get FDA medication data
3. Synthesizes information using Azure OpenAI

### 2. Analysis Process
The agent:
1. Retrieves patient demographics, conditions, and current medications
2. Looks up the medication in the FDA database
3. Identifies drug interactions with current medications
4. Checks for contraindications based on patient conditions
5. Calculates a safety score
6. Generates personalized recommendations

### 3. Response Parsing
The system extracts structured data from the AI response:
- Safety score (0-100)
- List of warnings
- List of interactions
- List of recommendations
- Attention flag (if score < 70 or critical warnings)

## Safety Considerations

### Safety Score Interpretation
- **90-100**: Very safe, minimal concerns
- **70-89**: Generally safe, some precautions
- **50-69**: Moderate concerns, consult healthcare provider
- **0-49**: Significant concerns, immediate medical consultation recommended

### Attention Flags
The system flags medications requiring attention when:
- Safety score < 70
- Critical/severe warnings detected
- Serious drug interactions identified
- Contraindications with patient conditions

## Customization

### Adjusting Temperature
```typescript
const analyzer = createMedicationAnalyzer({
  userId: "user_123",
  temperature: 0.2, // Lower = more focused, Higher = more creative
});
```

### Adjusting Max Tokens
```typescript
const analyzer = createMedicationAnalyzer({
  userId: "user_123",
  maxTokens: 1000, // Shorter responses
});
```

### Custom Prompts
Modify the prompt in `src/lib/medication-analyzer.ts`:

```typescript
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "Your custom system prompt here..."],
  ["human", "{input}"],
  ["placeholder", "{agent_scratchpad}"],
]);
```

## Error Handling

The analyzer handles errors gracefully:

```typescript
try {
  const result = await analyzer.analyzeMedication("aspirin");
} catch (error) {
  console.error("Analysis failed:", error);
  // Fallback to basic FDA lookup or show error to user
}
```

## Performance

- **Single medication analysis**: ~5-15 seconds
- **Multiple medication analysis**: ~10-25 seconds
- **Quick safety check**: ~3-8 seconds

Times vary based on:
- Patient record complexity
- Number of current medications
- Azure OpenAI response time
- Network latency

## Future Enhancements

- [ ] Caching for common medications
- [ ] Batch analysis for scan results
- [ ] Integration with pharmacy databases
- [ ] Multi-language support
- [ ] Voice input for medication names
- [ ] PDF report generation
- [ ] Email notifications for critical warnings
- [ ] Integration with electronic health records (EHR)

## Troubleshooting

### "UNAUTHORIZED" Error
Ensure the user is authenticated. The analyzer requires a valid session.

### "No medication information found"
- Check medication name spelling
- Try brand name or generic name
- Verify OpenFDA API is accessible

### "Failed to retrieve patient records"
- Verify database connection
- Check user has a profile and conditions set up
- Ensure proper permissions

### Slow Response Times
- Check Azure OpenAI quota and limits
- Verify network connectivity
- Consider using `quickSafetyCheck` for faster results

## License

This medication analyzer is part of the Cliniq application and follows the same license terms.

## Disclaimer

**IMPORTANT**: This tool is for informational purposes only and does not constitute medical advice. Always consult with a qualified healthcare provider before making decisions about medications.

