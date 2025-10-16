import { pgTableCreator } from 'drizzle-orm/pg-core';

// Centralized table factory to avoid direct pgTable usage across the codebase
export const createTable = pgTableCreator((name) => name);
