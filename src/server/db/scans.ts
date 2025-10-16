import {
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

export const scans = pgTable('scans', {
  id: uuid('id').primaryKey(),
  userId: text('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  status: text('status'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const scanJobs = pgTable('scan_jobs', {
  id: uuid('id').primaryKey(),
  scanId: uuid('scan_id')
    .references(() => scans.id, { onDelete: 'cascade' })
    .notNull(),
  inngestRunId: text('inngest_run_id').unique(),
  stage: text('stage'),
  status: text('status'),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const scanImages = pgTable('scan_images', {
  id: uuid('id').primaryKey(),
  scanId: uuid('scan_id')
    .references(() => scans.id, { onDelete: 'cascade' })
    .notNull(),
  imageUrl: text('image_url'),
  ocrText: text('ocr_text'),
  confidence: numeric('confidence'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const scanMedications = pgTable(
  'scan_medications',
  {
    scanId: uuid('scan_id')
      .references(() => scans.id, { onDelete: 'cascade' })
      .notNull(),
    medicationId: uuid('medication_id').notNull(),
    confidence: numeric('confidence'),
  },
  (t) => ({
    pk: { columns: [t.scanId, t.medicationId] },
  })
);

export const ocrMetrics = pgTable('ocr_metrics', {
  id: uuid('id').primaryKey(),
  scanId: uuid('scan_id')
    .references(() => scans.id, { onDelete: 'cascade' })
    .notNull(),
  imageId: uuid('image_id').references(() => scanImages.id, {
    onDelete: 'cascade',
  }),
  provider: text('provider'),
  latencyMs: integer('latency_ms'),
  costUsd: numeric('cost_usd'),
  tokensProcessed: integer('tokens_processed'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
