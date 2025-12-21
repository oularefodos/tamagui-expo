import 'react-native-get-random-values';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { v4 as uuidv4 } from 'uuid';

export const examples = sqliteTable('examples', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date()),
});

export type Example = typeof examples.$inferSelect;
export type NewExample = typeof examples.$inferInsert;
