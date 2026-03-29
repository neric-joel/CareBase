// Voyage AI embeddings utility.
// SERVER-SIDE ONLY — never import this in Client Components.

import { VoyageAIClient } from 'voyageai';
import { createClient } from '@/lib/supabase/server';
import type { NoteSearchResult } from '@/types/database';

const voyage = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY!,
});

const EMBEDDING_MODEL = 'voyage-3-lite';

/**
 * Generate a 1024-dimensional embedding vector for the given text.
 * Uses Voyage AI voyage-3-lite.
 *
 * @param text      The text to embed
 * @param inputType "document" when embedding stored notes, "query" when embedding search queries
 */
export async function generateEmbedding(
  text: string,
  inputType: 'document' | 'query' = 'document'
): Promise<number[]> {
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await voyage.embed({
        input: text.replace(/\n/g, ' ').trim(),
        model: EMBEDDING_MODEL,
        inputType,
      });

      const embedding = response.data?.[0]?.embedding;
      if (!embedding) {
        throw new Error('Voyage AI returned no embedding data');
      }

      return embedding;
    } catch (err) {
      const isRateLimit = err instanceof Error && err.message.includes('429');
      if (isRateLimit && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 21000));
        continue;
      }
      if (isRateLimit) {
        throw new Error('AI search is temporarily rate-limited. Please wait ~20 seconds and try again.');
      }
      throw err;
    }
  }
  throw new Error('Voyage AI embedding failed after retries');
}

/**
 * Semantic search over service entry notes.
 * Embeds the query, then calls the match_notes pgvector RPC.
 *
 * @param query         Natural language search query
 * @param matchThreshold Minimum cosine similarity (0–1), default 0.3
 * @param matchCount    Max results to return, default 10
 */
export async function searchNotes(
  query: string,
  matchThreshold = 0.3,
  matchCount = 10
): Promise<NoteSearchResult[]> {
  const embedding = await generateEmbedding(query, 'query');

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('match_notes', {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    throw new Error(`Semantic search failed: ${error.message}`);
  }

  return (data as NoteSearchResult[]) ?? [];
}
