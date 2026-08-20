import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const notes = pgTable(
  'notes',
  {
    id: text('id').primaryKey(),
    ownerSubject: text('owner_subject').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('notes_owner_subject_idx').on(table.ownerSubject)],
);
