import { table, integer, text, boolean, sql } from 'sdk/db';

export const users = table('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tgId: integer('tg_id').notNull().unique(),
  chatId: integer('chat_id').notNull(),
  username: text('username'),
  firstName: text('first_name'),
  isBanned: boolean('is_banned').default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const replies = table('replies', {
  ownerMessageId: integer('owner_message_id').primaryKey(),
  userChatId: integer('user_chat_id').notNull(),
  userMessageId: integer('user_message_id').notNull(),
});

export const settings = table('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
