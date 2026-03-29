// Gemini embeddings utility.
// SERVER-SIDE ONLY — never import this in Client Components.

import { createClient } from '@/lib/supabase/server';
import type { NoteSearchResult } from '@/types/database';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768;

/**
 * Generate a 768-dimensional embedding vector for the given text.
 * Uses Google Gemini embedding-001 with outputDimensionality=768.
 */
export async function generateEmbedding(
  text: string,
  _inputType: 'document' | 'query' = 'document' // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<number[]> {
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: `models/${EMBEDDING_MODEL}`,
            content: { parts: [{ text: text.replace(/\n/g, ' ').trim() }] },
            outputDimensionality: EMBEDDING_DIMENSIONS,
          }),
        }
      );

      if (response.status === 429) {
        throw new Error('429 rate limit');
      }

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errBody}`);
      }

      const data = await response.json();
      const embedding = data?.embedding?.values;

      if (!embedding || !Array.isArray(embedding)) {
        throw new Error('Gemini returned no embedding data');
      }

      return embedding;
    } catch (err) {
      const isRateLimit = err instanceof Error && err.message.includes('429');
      if (isRateLimit && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }
      if (isRateLimit) {
        throw new Error('AI search is temporarily rate-limited. Please wait a moment and try again.');
      }
      throw err;
    }
  }
  throw new Error('Gemini embedding failed after retries');
}

/**
 * Semantic search over service entry notes.
 * Embeds the query, then calls the match_notes pgvector RPC.
 */
export async function searchNotes(
  query: string,
  matchThreshold = 0.0,
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
