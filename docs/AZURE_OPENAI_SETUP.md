# Azure OpenAI Configuration Guide

## 🔴 Current Issue: 404 MODEL_NOT_FOUND

You're getting this error because the Azure OpenAI configuration in your `.env` file doesn't match your actual Azure deployment.

## ✅ Step-by-Step Fix

### 1. **Go to Azure Portal**

Navigate to: https://portal.azure.com

### 2. **Find Your Azure OpenAI Resource**

1. Search for "Azure OpenAI" in the top search bar
2. Click on your Azure OpenAI resource (e.g., "my-openai-resource")
3. You should see the resource overview page

### 3. **Get Your Endpoint**

On the resource overview page:
- Look for **"Endpoint"** in the right panel
- It will look like: `https://YOUR-RESOURCE-NAME.openai.azure.com`
- Copy this ENTIRE URL

**Example:**
```
https://cliniq-openai.openai.azure.com
```

### 4. **Get Your API Key**

1. In the left sidebar, click **"Keys and Endpoint"**
2. Copy **KEY 1** or **KEY 2** (either works)
3. Keep this secret!

### 5. **Get Your Deployment Name**

1. In the left sidebar, click **"Deployments"** (or "Model deployments")
2. You'll see a list of your deployments
3. Find the deployment you want to use (usually GPT-4 or GPT-3.5-Turbo)
4. Copy the **EXACT** deployment name (case-sensitive!)

**Common deployment names:**
- `gpt-4`
- `gpt-4-32k`
- `gpt-35-turbo`
- `gpt-4-turbo`
- Or your custom name like `my-gpt4-deployment`

### 6. **Get API Version**

The API version should be one of these (use the most recent):
- `2024-02-15-preview` ✅ **Recommended**
- `2023-12-01-preview`
- `2023-05-15`

### 7. **Update Your `.env` File**

Open your `.env` file and update these values:

```bash
# Azure OpenAI Configuration
AZURE_AI_API_KEY=your-actual-key-from-step-4
AZURE_AI_ENDPOINT=https://your-resource-name.openai.azure.com
AZURE_AI_DEPLOYMENT=your-exact-deployment-name-from-step-5
AZURE_AI_API_VERSION=2024-02-15-preview
AZURE_AI_REGION=eastus  # or your actual region

# These can stay the same (legacy, but required by schema)
AZURE_AI_KEY=your-actual-key-from-step-4
```

## 📋 Example Configuration

Here's what a complete, working configuration looks like:

```bash
# Example - Replace with YOUR actual values
AZURE_AI_API_KEY=abc123def456ghi789jkl012mno345pqr678stu
AZURE_AI_ENDPOINT=https://cliniq-openai.openai.azure.com
AZURE_AI_DEPLOYMENT=gpt-4
AZURE_AI_API_VERSION=2024-02-15-preview
AZURE_AI_REGION=eastus
AZURE_AI_KEY=abc123def456ghi789jkl012mno345pqr678stu
```

## ⚠️ Common Mistakes

### ❌ Wrong Endpoint Format
```bash
# WRONG - Missing https://
AZURE_AI_ENDPOINT=cliniq-openai.openai.azure.com

# WRONG - Extra path
AZURE_AI_ENDPOINT=https://cliniq-openai.openai.azure.com/openai/deployments

# CORRECT
AZURE_AI_ENDPOINT=https://cliniq-openai.openai.azure.com
```

### ❌ Wrong Deployment Name
```bash
# WRONG - Using model name instead of deployment name
AZURE_AI_DEPLOYMENT=gpt-4-turbo-preview

# WRONG - Typo or wrong case
AZURE_AI_DEPLOYMENT=GPT-4  # (if your deployment is named "gpt-4")

# CORRECT - Must match EXACTLY what's in Azure Portal
AZURE_AI_DEPLOYMENT=gpt-4
```

### ❌ Old API Version
```bash
# WRONG - Very old version
AZURE_AI_API_VERSION=2022-12-01

# CORRECT - Use recent version
AZURE_AI_API_VERSION=2024-02-15-preview
```

## 🧪 Test Your Configuration

After updating `.env`:

### 1. Restart Dev Server
```bash
# Stop the current server (Ctrl+C)
# Then restart:
bun run dev
```

### 2. Check Console Output
When you submit medications for analysis, you should see:
```
🔧 [AZURE CONFIG]
  Instance Name: cliniq-openai
  Deployment: gpt-4
  API Version: 2024-02-15-preview
  Endpoint: https://cliniq-openai.openai.azure.com
```

### 3. Test with Browser Console
Open your browser console at `http://localhost:3000` and run:
```javascript
fetch('/api/trpc/medicationAnalysis.testConfig')
  .then(r => r.json())
  .then(d => console.log(d));
```

You should see:
```json
{
  "configured": true,
  "instanceName": "cliniq-openai",
  "deployment": "gpt-4",
  "apiVersion": "2024-02-15-preview",
  "endpoint": "https://cliniq-openai.openai.azure.com",
  "region": "eastus",
  "hasApiKey": true
}
```

## 🎯 Quick Checklist

- [ ] Endpoint is in format: `https://[NAME].openai.azure.com`
- [ ] API Key is copied from Azure Portal (Keys and Endpoint)
- [ ] Deployment name matches EXACTLY (case-sensitive)
- [ ] API Version is `2024-02-15-preview` or newer
- [ ] Restarted dev server after changing `.env`
- [ ] No extra spaces or quotes in `.env` values

## 🚀 After Configuration

Once configured correctly, you should see:

1. **Console logs showing tool usage:**
   ```
   🔧 [TOOL USAGE] AI requested 2 tool call(s)
   📞 Calling tool: patient_records_lookup
   ✅ Completed in 89ms
   ```

2. **Successful analysis:**
   ```
   ✅ Analysis complete for: Aspirin
   📊 RESULTS:
     Safety Score: 85/100
   ```

3. **No 404 errors!** ✅

## 🆘 Still Having Issues?

If you still get 404 errors:

1. **Double-check deployment exists:**
   - Go to Azure Portal → Your Resource → Deployments
   - Make sure the deployment is **not deleted or suspended**
   - Check the deployment status is "Succeeded"

2. **Try a different deployment:**
   - If you have multiple deployments, try another one
   - Update `AZURE_AI_DEPLOYMENT` to match

3. **Check region:**
   - Some regions may have different endpoints
   - Verify your resource region matches `AZURE_AI_REGION`

4. **Create new deployment:**
   - In Azure Portal → Deployments → Create
   - Deploy a GPT-4 or GPT-3.5-Turbo model
   - Use that deployment name in `.env`

## 📞 Need Help?

Check the Azure OpenAI documentation:
- https://learn.microsoft.com/en-us/azure/ai-services/openai/

Or check the error logs in your terminal for specific details.

