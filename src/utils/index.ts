import type { 
  MedicationExtract, 
  MedicationScanConfig, 
  MedicationScanResult, 
  EnrichedMedicationData 
} from '../../types/medication';
import * as openfda from '../api/openfda';
import * as rxnav from '../api/rxnav';
import * as upc from '../api/upc';
import * as dailymed from '../api/dailymed';
import { FeatureFlags, featureFlagManager } from '@/lib/feature-flags';

import * as parsing from './parsing';
import * as manufacturer from './manufacturer';
import * as dosage from './dosage';
import * as scanning from './scanning';
import * as enrichment from './enrichment';
import * as barcode from './barcode';

/**
 * Creates API client instances for external medication data services.
 * Initializes clients for OpenFDA, RxNav, UPC Lookup, and DailyMed APIs.
 * 
 * @returns Object containing all API client instances
 * @example
 * const clients = createAPIClients() // returns {openfdaClient, rxnavClient, upcLookupClient, dailyMedClient}
 */
const createAPIClients = () => ({
  openfdaClient: openfda,
  rxnavClient: rxnav,
  upcLookupClient: upc,
  dailyMedClient: dailymed,
});

/**
 * Main medication processing API providing comprehensive medication analysis.
 * Combines OCR, barcode scanning, and multiple API lookups for complete medication data extraction.
 */
export const medicationAPI = {
  /**
   * Parses OCR text lines into structured medication extract data.
   * Extracts medication information including name, dosage, manufacturer, NDC, etc.
   * 
   * @param lines - Array of OCR text lines to process
   * @returns Structured medication extract object
   * @example
   * medicationAPI.parseText(["Tylenol Extra Strength", "500mg per tablet"]) // returns medication extract
   */
  parseText: (lines: string[]): MedicationExtract => {
    return parsing.createMedicationExtract(lines);
  },

  /**
   * Scans medication image using barcode and OCR with API enrichment.
   * Processes image buffer to extract medication information and enriches with external API data.
   * 
   * @param buffer - Image buffer to scan for medication information
   * @param config - Scanning configuration including API settings
   * @param filename - Optional filename for logging and processing
   * @returns Complete medication scan result with suggestions and manual entry requirements
   * @example
   * medicationAPI.scan(imageBuffer, config, "medication.jpg") // returns scan result with enriched data
   */
  scan: async (
    buffer: Buffer,
    config: MedicationScanConfig,
    filename?: string
  ): Promise<MedicationScanResult> => {
    const apiClients = createAPIClients();
    
    const barcode = await scanning.scanBarcode(buffer);
    
    let extract: MedicationExtract;
    let openfda: any = null;

    if (barcode) {
      extract = {
        name: barcode.code,
        source: 'barcode',
        confidence: barcode.confidence,
        raw_lines: [barcode.code],
      };
      
      if (config.openfda.enabled) {
        openfda = await scanning.tryOpenFDALookup(extract, apiClients.openfdaClient);
        if (openfda) {
          extract.manufacturer = openfda.manufacturer_name;
        }
      }
    } else {
      const ocrLines = await scanning.scanWithOCR(buffer, config, filename);
      extract = parsing.createMedicationExtract(ocrLines);
      
      if (config.openfda.enabled) {
        openfda = await scanning.tryOpenFDALookup(extract, apiClients.openfdaClient);
      }
    }

    const requiresManualEntry = dosage.getMissingFields(extract, openfda);
    const suggestions = {
      names: extract.name ? [extract.name] : [],
      manufacturers: extract.manufacturer ? [extract.manufacturer] : [],
      purposes: extract.purpose ? [extract.purpose] : [],
    };

    return {
      extract,
      barcode: barcode || undefined,
      openfda: openfda || undefined,
      requiresManualEntry,
      suggestions,
    };
  },

  /**
   * Scans multiple medication images in batch processing.
   * Processes array of files sequentially and returns results for each file.
   * 
   * @param files - Array of file objects containing buffer data and filenames
   * @param config - Scanning configuration for all files
   * @returns Array of medication scan results, one per input file
   * @example
   * medicationAPI.scanBatch([{data: buffer1, filename: "med1.jpg"}, {data: buffer2, filename: "med2.jpg"}], config) // returns array of results
   */
  scanBatch: async (
    files: Array<{ data: Buffer; filename: string }>,
    config: MedicationScanConfig
  ): Promise<MedicationScanResult[]> => {
    const results: MedicationScanResult[] = [];
    
    for (const file of files) {
      const result = await medicationAPI.scan(file.data, config, file.filename);
      results.push(result);
    }
    
    return results;
  },

  /**
   * Enriches medication extract with comprehensive data from multiple APIs.
   * Combines data from OpenFDA, RxNav, DailyMed, and UPC Lookup services.
   * 
   * @param extract - The medication extract to enrich
   * @param options - Optional API enable/disable flags
   * @returns Fully enriched medication data with verification and confidence scores
   * @example
   * medicationAPI.enrich(extract, {enableOpenFDA: true, enableRxNav: true}) // returns enriched medication data
   */
  enrich: async (
    extract: MedicationExtract,
    options: {
      enableOpenFDA?: boolean;
      enableRxNav?: boolean;
      enableDailyMed?: boolean;
      enableUPCLookup?: boolean;
    } = {}
  ): Promise<EnrichedMedicationData> => {
    const apiClients = createAPIClients();
    
    const shouldUseOpenFDA = enrichment.shouldUseAPI(options.enableOpenFDA, featureFlagManager.isEnabled(FeatureFlags.ENABLE_OPENFDA));
    const shouldUseRxNav = enrichment.shouldUseAPI(options.enableRxNav, featureFlagManager.isEnabled(FeatureFlags.ENABLE_RXNAV));
    const shouldUseDailyMed = enrichment.shouldUseAPI(options.enableDailyMed, featureFlagManager.isEnabled(FeatureFlags.ENABLE_DAILYMED));
    const shouldUseUPCLookup = enrichment.shouldUseAPI(options.enableUPCLookup, featureFlagManager.isEnabled(FeatureFlags.ENABLE_UPC_LOOKUP));

    const enriched = enrichment.createInitialEnrichedData(extract);
    enrichment.addBarcodeDetection(enriched, extract);

    if (enrichment.isUPCFormat(extract.ndc_code || '') && shouldUseUPCLookup) {
      const upcResult = await apiClients.upcLookupClient.lookupByUPC(extract.ndc_code!);
      if (upcResult) {
        enrichment.addAPIResponse(enriched, 'upc_lookup', upcResult);
        if (upcResult.name && !enriched.name) enriched.name = upcResult.name;
        if (upcResult.brand_name && !enriched.brand_name) enriched.brand_name = upcResult.brand_name;
        if (upcResult.manufacturer && !enriched.manufacturer) enriched.manufacturer = upcResult.manufacturer;
        if (upcResult.ndc) enriched.ndc_code = upcResult.ndc;
        enrichment.updateConfidenceScore(enriched, 0.3);
      }
    }

    if (shouldUseOpenFDA) {
      const openfdaResult = await scanning.tryOpenFDALookup(extract, apiClients.openfdaClient);
      if (openfdaResult) {
        enrichment.mergeOpenFDAData(enriched, openfdaResult);
        enrichment.setOpenFDAVerified(enriched);
        enrichment.updateConfidenceScore(enriched, 0.3);
        enrichment.addAPIResponse(enriched, 'openfda', openfdaResult);
        enrichment.updateBarcodeLookupResult(enriched, extract, openfdaResult);
        
        if (!enriched.dosage) {
          const dosageFromOpenFDA = dosage.extractDosageFromOpenFDA(openfdaResult);
          if (dosageFromOpenFDA) enriched.dosage = dosageFromOpenFDA;
        }
      }
    }

    if (shouldUseRxNav && (extract.name || extract.brand_name)) {
      const rxnavResult = await apiClients.rxnavClient.searchByDrugName(extract.name || extract.brand_name!);
      if (rxnavResult) {
        enrichment.mergeRxNavData(enriched, rxnavResult);
        enrichment.setRxNavVerified(enriched);
        enrichment.updateConfidenceScore(enriched, 0.2);
        enrichment.addAPIResponse(enriched, 'rxnav', rxnavResult);
        enrichment.updateRxNormExtraction(enriched, extract);
      }
    }

    if (shouldUseDailyMed && (extract.name || extract.brand_name)) {
      const searchTerm = extract.name || extract.brand_name!;
      const dailyMedResult = await apiClients.dailyMedClient.getLatestByGeneric(searchTerm);
      if (dailyMedResult) {
        enrichment.addAPIResponse(enriched, 'dailymed', dailyMedResult);
        
        if (!enriched.dosage) {
          const dosageFromDailyMed = dosage.extractDosageFromDailyMed(dailyMedResult);
          if (dosageFromDailyMed) enriched.dosage = dosageFromDailyMed;
        }
      }
    }

    if (!enriched.dosage) {
      const dosageInfo = dosage.findFirstDosage(extract.raw_lines);
      if (dosageInfo) {
        enriched.dosage = dosageInfo;
        enrichment.updateConfidenceScore(enriched, 0.1);
      }
    }

    if (!enriched.manufacturer) {
      const manufacturerResult = await medicationAPI.lookupManufacturer(extract, enriched.api_responses?.openfda);
      if (manufacturerResult) {
        enriched.manufacturer = manufacturerResult.manufacturer;
        enrichment.addManufacturerDetection(enriched, manufacturerResult);
        enrichment.updateConfidenceScore(enriched, 0.1);
      }
    }

    if (!enriched.purpose && enriched.name) {
      enriched.purpose = dosage.generatePurpose(enriched.name);
    }

    enrichment.capConfidenceScore(enriched);
    return enriched;
  },

  /**
   * Looks up manufacturer information using multiple detection strategies.
   * Tries OpenFDA data, brand mapping, OCR text, NDC analysis, and generic mapping.
   * 
   * @param extract - The medication extract to find manufacturer for
   * @param openfdaResult - Optional OpenFDA result for manufacturer lookup
   * @returns Manufacturer detection result with method and confidence details
   * @example
   * medicationAPI.lookupManufacturer(extract, openfdaResult) // returns manufacturer detection result
   */
  lookupManufacturer: async (extract: MedicationExtract, openfdaResult?: any): Promise<any> => {
    if (openfdaResult?.manufacturer_name) {
      return {
        manufacturer: openfdaResult.manufacturer_name,
        method: 'openfda',
        confidence: 'high',
        details: `Found via OpenFDA API`,
      };
    }

    if (extract.brand_name || extract.name) {
      const brandManufacturer = manufacturer.getBrandManufacturer(extract.brand_name || extract.name!);
      if (brandManufacturer) {
        return {
          manufacturer: brandManufacturer,
          method: 'brand_mapping',
          confidence: 'medium',
          details: `Mapped from brand name "${extract.brand_name || extract.name}"`,
        };
      }
    }

    const manufacturerFromText = manufacturer.findFirstManufacturer(extract.raw_lines);
    if (manufacturerFromText) {
      return {
        manufacturer: manufacturerFromText,
        method: 'ocr_text',
        confidence: 'medium',
        details: `Found manufacturer name in OCR text: "${manufacturerFromText}"`,
      };
    }

    if (extract.ndc_code) {
      const ndcPrefix = manufacturer.extractNDCPrefix(extract.ndc_code);
      const manufacturerFromNDC = manufacturer.getNDCManufacturer(ndcPrefix);
      if (manufacturerFromNDC) {
        return {
          manufacturer: manufacturerFromNDC,
          method: 'ndc_analysis',
          confidence: 'high',
          details: `Decoded from NDC code "${extract.ndc_code}"`,
        };
      }
    }

    if (extract.name) {
      const manufacturerFromGeneric = manufacturer.getGenericManufacturer(extract.name);
      if (manufacturerFromGeneric) {
        return {
          manufacturer: manufacturerFromGeneric,
          method: 'generic_mapping',
          confidence: 'low',
          details: `Mapped generic name "${extract.name}" to manufacturer`,
        };
      }
    }

    return null;
  },

  /**
   * Generates medication purpose based on generic drug name.
   * Uses comprehensive mapping of generic names to therapeutic purposes.
   * 
   * @param genericName - The generic drug name to generate purpose for
   * @returns Descriptive purpose string for the medication
   * @example
   * medicationAPI.generatePurpose("acetaminophen") // returns "Pain relief and fever reduction"
   */
  generatePurpose: (genericName: string): string => {
    return dosage.generatePurpose(genericName);
  },

  /**
   * Determines which required fields are missing from medication data.
   * Compares extract and OpenFDA data to identify missing essential fields.
   * 
   * @param extract - The medication extract to validate
   * @param openfda - Optional OpenFDA result to include in validation
   * @returns Array of missing field names
   * @example
   * medicationAPI.determineRequiredFields(extract, openfdaResult) // returns ["manufacturer", "dosage"]
   */
  determineRequiredFields: (extract: MedicationExtract, openfda?: any): string[] => {
    return dosage.getMissingFields(extract, openfda);
  },

  /**
   * Generates suggestions for medication data fields.
   * Creates suggestion arrays for names, manufacturers, and purposes.
   * 
   * @param extract - The medication extract to generate suggestions for
   * @returns Object containing suggestion arrays for different field types
   * @example
   * medicationAPI.generateSuggestions(extract) // returns {names: ["Tylenol"], manufacturers: ["Johnson"], purposes: ["Pain relief"]}
   */
  generateSuggestions: (extract: MedicationExtract) => {
    return {
      names: extract.name ? [extract.name] : [],
      manufacturers: extract.manufacturer ? [extract.manufacturer] : [],
      purposes: extract.purpose ? [extract.purpose] : [],
    };
  },
};

export { parsing, manufacturer, dosage, scanning, enrichment, barcode };

export default medicationAPI;