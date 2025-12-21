import { useState, useEffect, useCallback } from 'react';
import { eq } from 'drizzle-orm';
import { getDatabase, examples, Example, NewExample } from '../lib/db';

export function useExamples() {
  const [data, setData] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all examples from the database
   */
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const db = getDatabase();
      const results = await db.select().from(examples);
      setData(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch examples');
      console.error('Failed to fetch examples:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new example
   */
  const create = useCallback(
    async (example: NewExample) => {
      try {
        const db = getDatabase();
        const newExample: NewExample = {
          ...example,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await db.insert(examples).values(newExample);
        await refresh();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create example';
        setError(errorMessage);
        console.error('Failed to create example:', err);
        throw new Error(errorMessage);
      }
    },
    [refresh]
  );

  /**
   * Update an existing example
   */
  const update = useCallback(
    async (id: string, updates: Partial<Omit<Example, 'id' | 'createdAt'>>) => {
      try {
        const db = getDatabase();
        await db
          .update(examples)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(examples.id, id));
        await refresh();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update example';
        setError(errorMessage);
        console.error('Failed to update example:', err);
        throw new Error(errorMessage);
      }
    },
    [refresh]
  );

  /**
   * Remove an example
   */
  const remove = useCallback(
    async (id: string) => {
      try {
        const db = getDatabase();
        await db.delete(examples).where(eq(examples.id, id));
        await refresh();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to remove example';
        setError(errorMessage);
        console.error('Failed to remove example:', err);
        throw new Error(errorMessage);
      }
    },
    [refresh]
  );

  // Fetch data on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    data,
    loading,
    error,
    create,
    update,
    remove,
    refresh,
  };
}
