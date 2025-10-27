import {boolean, integer, jsonb, numeric, text, timestamp, uniqueIndex, uuid,} from 'drizzle-orm/pg-core';
import {user} from './auth';
import {scans} from './scans';
import {medications} from './medications';
import {createTable} from '../table';

export const reports = createTable(
    'reports',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: text('user_id')
            .references(() => user.id, {onDelete: 'cascade'})
            .notNull(),
        scanId: uuid('scan_id').references(() => scans.id, {onDelete: 'cascade'}),
        medicationId: uuid('medication_id').references(() => medications.id, {
            onDelete: 'cascade',
        }),
        scope: text('scope').notNull(),
        summary: text('summary'),
        warnings: text('warnings'),
        aiModel: text('ai_model'),
        isPremium: boolean('is_premium'),
        createdAt: timestamp('created_at').defaultNow(),
        rawJson: jsonb('raw_json'),
    },
    (t) => ({
        scanMedicationUnique: uniqueIndex('reports_scan_medication_unique').on(
            t.scanId,
            t.medicationId
        ),
    })
);

export const reportShares = createTable('report_shares', {
    id: uuid('id').primaryKey().defaultRandom(),
    reportId: uuid('report_id')
        .references(() => reports.id, {onDelete: 'cascade'})
        .notNull(),
    sharedBy: text('shared_by').references(() => user.id, {
        onDelete: 'set null',
    }),
    shareToken: text('share_token').unique(),
    expiresAt: timestamp('expires_at'),
    accessedAt: timestamp('accessed_at'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const reportMetrics = createTable('report_metrics', {
    reportId: uuid('report_id')
        .primaryKey()
        .references(() => reports.id, {onDelete: 'cascade'}),
    promptSha256: text('prompt_sha256'),
    tokensInput: integer('tokens_input'),
    tokensOutput: integer('tokens_output'),
    costUsd: numeric('cost_usd'),
    latencyMs: integer('latency_ms'),
    createdAt: timestamp('created_at').defaultNow(),
});
