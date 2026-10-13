import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema';
import type { VideoJobStatus } from '@/aizombie/contracts';

export const videoJobs = sqliteTable('video_jobs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  idempotencyKey: text('idempotency_key').notNull(),
  status: text('status').notNull().$type<VideoJobStatus>(),
  mode: text('mode').notNull().$type<'couple' | 'pet'>(),
  quality: text('quality').notNull().$type<'480p' | '720p'>(),
  aspect: text('aspect').notNull().$type<'16:9' | '9:16'>(),
  providerJobId: text('provider_job_id').unique(),
  videoKey: text('video_key'),
  error: text('error'),
  deletedAt: integer('deleted_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (t) => [
  uniqueIndex('video_jobs_user_request_idx').on(t.userId, t.idempotencyKey),
  index('video_jobs_user_created_idx').on(t.userId, t.createdAt),
]);

export const videoCreditGrants = sqliteTable('video_credit_grants', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  orderId: text('order_id').notNull(),
  packId: text('pack_id').notNull(),
  credits: integer('credits').notNull(),
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at').notNull(),
}, (t) => [
  uniqueIndex('video_credit_order_idx').on(t.provider, t.orderId),
  index('video_credit_grants_user_idx').on(t.userId, t.expiresAt),
]);

export const videoCreditEntries = sqliteTable('video_credit_entries', {
  id: text('id').primaryKey(),
  grantId: text('grant_id').notNull().references(() => videoCreditGrants.id, { onDelete: 'cascade' }),
  jobId: text('job_id').notNull().references(() => videoJobs.id, { onDelete: 'no action' }),
  kind: text('kind').notNull().$type<'debit' | 'refund'>(),
  amount: integer('amount').notNull(),
  createdAt: integer('created_at').notNull(),
}, (t) => [uniqueIndex('video_credit_job_kind_idx').on(t.grantId, t.jobId, t.kind)]);

// This sandbox table is intentionally unrelated to spendable video grants.
export const videoTestCheckouts = sqliteTable('aizombie_test_checkouts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  requestId: text('request_id').notNull(),
  packId: text('pack_id').notNull(),
  productId: text('product_id').notNull(),
  storeId: text('store_id').notNull(),
  amount: integer('amount').notNull(),
  credits: integer('credits').notNull(),
  status: text('status').notNull().default('pending').$type<'pending' | 'paid' | 'refunded'>(),
  orderId: text('order_id').unique(),
  sessionUrl: text('session_url'),
  sessionExpiresAt: integer('session_expires_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (t) => [
  uniqueIndex('aizombie_test_checkout_request_idx').on(t.userId, t.requestId),
  index('aizombie_test_checkouts_user_idx').on(t.userId, t.createdAt),
]);
