import { uuid, text, timestamp, numeric, integer } from 'drizzle-orm/pg-core';
import { createTable } from '../table';

import { medications } from './medications';
import { user } from './auth';
export const scans = createTable('scans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  status: text('status').notNull(),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const scanJobs = createTable('scan_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  scanId: uuid('scan_id')
    .references(() => scans.id, { onDelete: 'cascade' })
    .notNull(),
  inngestRunId: text('inngest_run_id').unique(),
  stage: text('stage').notNull(),
  status: text('status').notNull(),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const scanImages = createTable('scan_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  scanId: uuid('scan_id')
    .references(() => scans.id, { onDelete: 'cascade' })
    .notNull(),
  imageUrl: text('image_url'),
  ocrText: text('ocr_text'),
  confidence: numeric('confidence'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const scanMedications = createTable(
  'scan_medications',
  {
    scanId: uuid('scan_id')
      .references(() => scans.id, { onDelete: 'cascade' })
      .notNull(),
    medicationId: uuid('medication_id')
      .references(() => medications.id, { onDelete: 'cascade' })
      .notNull(),
    confidence: numeric('confidence'),
  },
  (t) => ({
    pk: {
      columns: [t.scanId, t.medicationId],
      name: 'scan_medications_pk',
    },
  })
);

export const ocrMetrics = createTable('ocr_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  scanId: uuid('scan_id')
    .references(() => scans.id, { onDelete: 'cascade' })
    .notNull(),
  imageId: uuid('image_id')
    .references(() => scanImages.id, { onDelete: 'cascade' })
    .notNull(),
  provider: text('provider'),
  latencyMs: integer('latency_ms'),
  costUsd: numeric('cost_usd'),
  tokensProcessed: integer('tokens_processed'),
  createdAt: timestamp('created_at').defaultNow(),
});
