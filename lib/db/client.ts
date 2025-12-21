import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import * as schema from './schema';

let database: ReturnType<typeof drizzle> | null = null;
let sqliteDb: SQLiteDatabase | null = null;

/**
 * Get the database instance (singleton)
 */
export function getDatabase() {
  if (!database) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return database;
}

/**
 * Initialize the database (async)
 * Should be called once at app startup
 */
export async function initDatabase() {
  try {
    // Open database asynchronously
    sqliteDb = await openDatabaseAsync('app.db');

    // Create Drizzle instance
    database = drizzle(sqliteDb, { schema });

    // Create tables if they don't exist
    await sqliteDb.execAsync(`
      CREATE TABLE IF NOT EXISTS examples (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);

    console.log('Database initialized successfully');
    return database;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
