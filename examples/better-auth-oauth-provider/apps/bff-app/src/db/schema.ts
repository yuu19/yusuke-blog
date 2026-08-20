import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const oauthTransactions = pgTable('oauth_bff_transaction', {
  stateHash: text('state_hash').primaryKey(),
  browserBindingHash: text('browser_binding_hash').notNull(),
  codeVerifier: text('code_verifier').notNull(),
  nonce: text('nonce').notNull(),
  dpopKeyCiphertext: text('dpop_key_ciphertext'),
  dpopJkt: text('dpop_jkt'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const oauthSessions = pgTable('oauth_bff_session', {
  sessionIdHash: text('session_id_hash').primaryKey(),
  tokenCiphertext: text('token_ciphertext').notNull(),
  subject: text('subject').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('oauth_bff_session_expires_at_idx').on(table.expiresAt)]);
