import {
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema';
import { reports } from './reports';

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey(),
  userId: text('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  reportId: uuid('report_id').references(() => reports.id, {
    onDelete: 'set null',
  }),
  amount: numeric('amount'),
  currency: text('currency'),
  provider: text('provider'),
  status: text('status'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userCredits = pgTable('user_credits', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  balance: integer('balance').default(0).notNull(),
  lastPurchasedAt: timestamp('last_purchased_at'),
});
