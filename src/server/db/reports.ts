import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema';
import { scans } from './scans';
import { medications } from './conditions';

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey(),
    userId: text('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    scanId: uuid('scan_id').references(() => scans.id, { onDelete: 'cascade' }),
    medicationId: uuid('medication_id').references(() => medications.id, {
      onDelete: 'cascade',
    }),
    scope: text('scope'),
    summary: text('summary'),
    warnings: text('warnings'),
    aiModel: text('ai_model'),
    isPremium: boolean('is_premium'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    rawJson: jsonb('raw_json'),
  },
  (t) => ({
    uniqScanMed: { columns: [t.scanId, t.medicationId], isUnique: true },
  })
);

export const reportShares = pgTable('report_shares', {
  id: uuid('id').primaryKey(),
  reportId: uuid('report_id')
    .references(() => reports.id, { onDelete: 'cascade' })
    .notNull(),
  sharedBy: text('shared_by').references(() => user.id, {
    onDelete: 'set null',
  }),
  shareToken: text('share_token').unique(),
  expiresAt: timestamp('expires_at'),
  accessedAt: timestamp('accessed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reportMetrics = pgTable('report_metrics', {
  reportId: uuid('report_id')
    .primaryKey()
    .references(() => reports.id, { onDelete: 'cascade' }),
  promptSha256: text('prompt_sha256'),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  costUsd: numeric('cost_usd'),
  latencyMs: integer('latency_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
