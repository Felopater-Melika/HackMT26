import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

export const conditions = pgTable('conditions', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  source: text('source'),
  createdBy: text('created_by').references(() => user.id, {
    onDelete: 'set null',
  }),
  isVerified: boolean('is_verified'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const medications = pgTable('medications', {
  id: uuid('id').primaryKey(),
  rxnormId: text('rxnorm_id').unique(),
  ndcCode: text('ndc_code'),
  name: text('name'),
  brandName: text('brand_name'),
  purpose: text('purpose'),
  manufacturer: text('manufacturer'),
  lastUpdated: timestamp('last_updated'),
});

export const medicationStats = pgTable('medication_stats', {
  medicationId: uuid('medication_id')
    .primaryKey()
    .references(() => medications.id, { onDelete: 'cascade' }),
  fetchCount: integer('fetch_count').default(0).notNull(),
  cachedData: jsonb('cached_data'),
  lastFetched: timestamp('last_fetched'),
});

export const userConditions = pgTable(
  'user_conditions',
  {
    userId: text('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    conditionId: uuid('condition_id')
      .references(() => conditions.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    pk: { columns: [t.userId, t.conditionId] },
  })
);

export const userMedications = pgTable(
  'user_medications',
  {
    userId: text('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    medicationId: uuid('medication_id')
      .references(() => medications.id, { onDelete: 'cascade' })
      .notNull(),
    addedFromScan: boolean('added_from_scan'),
    dosage: text('dosage'),
    frequency: text('frequency'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    pk: { columns: [t.userId, t.medicationId] },
  })
);
