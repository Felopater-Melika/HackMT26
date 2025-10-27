import {integer, numeric, text, timestamp, uuid} from 'drizzle-orm/pg-core';
import {createTable} from '../table';
import {reports} from './reports';
import {user} from './auth';

export const payments = createTable('payments', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
        .references(() => user.id, {onDelete: 'cascade'})
        .notNull(),
    reportId: uuid('report_id').references(() => reports.id, {
        onDelete: 'set null',
    }),
    amount: numeric('amount'),
    currency: text('currency'),
    provider: text('provider'),
    status: text('status'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const userCredits = createTable('user_credits', {
    userId: text('user_id')
        .primaryKey()
        .references(() => user.id, {onDelete: 'cascade'}),
    balance: integer('balance').default(0).notNull(),
    lastPurchasedAt: timestamp('last_purchased_at'),
});
