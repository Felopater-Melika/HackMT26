import {
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  uniqueIndex,
  numeric,
  boolean,
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { createTable } from '../table';

export const medications = createTable(
  'medications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    rxnormId: text('rxnorm_id'),
    ndcCode: text('ndc_code'),
    name: text('name'),
    brandName: text('brand_name'),
    purpose: text('purpose'),
    manufacturer: text('manufacturer'),
    lastUpdated: timestamp('last_updated'),
  },
  (t) => ({
    rxnormUnique: uniqueIndex('medications_rxnorm_unique').on(t.rxnormId),
  })
);

export const medicationStats = createTable('medication_stats', {
  medicationId: uuid('medication_id')
    .references(() => medications.id, { onDelete: 'cascade' })
    .primaryKey(),
  fetchCount: integer('fetch_count').default(0).notNull(),
  cachedData: jsonb('cached_data'),
  lastFetched: timestamp('last_fetched'),
});

export const userMedications = createTable(
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
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    pk: {
      columns: [t.userId, t.medicationId],
      name: 'user_medications_pk',
    },
  })
);
