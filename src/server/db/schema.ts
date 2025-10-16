// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { pgTableCreator } from 'drizzle-orm/pg-core';
export * from './auth-schema';
export * from './user-data';
export * from './conditions';
export * from './scans';
export * from './reports';
export * from './rag';
export * from './payments';

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `cliniq_${name}`);
