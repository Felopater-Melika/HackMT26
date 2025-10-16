import {
  pgTable,
  text,
  timestamp,
  uuid,
  customType,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

// Note: For vector type, we can use a text placeholder or a custom type until pgvector is wired.
const vector1536 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
});

export const aiContexts = pgTable('ai_contexts', {
  id: uuid('id').primaryKey(),
  userId: text('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  contentType: text('content_type'),
  contentId: uuid('content_id'),
  text: text('text'),
  // Requires pgvector extension enabled on the DB.
  embedding: vector1536('embedding'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
