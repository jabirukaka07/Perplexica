import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { Block } from '../types';
import { SearchSources } from '../agents/search/types';

// OIDC 用户扩展信息类型
export interface OIDCProfile {
  sub: string;
  department?: string;
  jobTitle?: string;
  phone?: string;
  [key: string]: unknown;
}

// 用户表
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // OIDC sub
  email: text('email').notNull().unique(),
  name: text('name'),
  avatar: text('avatar'),
  oidcProfile: text('oidcProfile', { mode: 'json' }).$type<OIDCProfile>(),
  isAdmin: integer('isAdmin', { mode: 'boolean' }).default(false),
  createdAt: text('createdAt').notNull(),
  lastLoginAt: text('lastLoginAt').notNull(),
  authProvider: text('authProvider').notNull().default('oidc'),
});

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey(),
  messageId: text('messageId').notNull(),
  chatId: text('chatId').notNull(),
  backendId: text('backendId').notNull(),
  query: text('query').notNull(),
  createdAt: text('createdAt').notNull(),
  responseBlocks: text('responseBlocks', { mode: 'json' })
    .$type<Block[]>()
    .default(sql`'[]'`),
  status: text({ enum: ['answering', 'completed', 'error'] }).default(
    'answering',
  ),
});

interface DBFile {
  name: string;
  fileId: string;
}

export const chats = sqliteTable('chats', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: text('createdAt').notNull(),
  sources: text('sources', {
    mode: 'json',
  })
    .$type<SearchSources[]>()
    .default(sql`'[]'`),
  files: text('files', { mode: 'json' })
    .$type<DBFile[]>()
    .default(sql`'[]'`),
  userId: text('userId').notNull(),
});
