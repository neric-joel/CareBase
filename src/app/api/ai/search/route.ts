// POST /api/ai/search
// Semantic search over service entry notes using pgvector cosine similarity.
// Embeds the query with Voyage AI voyage-3-lite, then calls match_notes RPC.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { searchNotes } from '@/lib/ai/embeddings';

const requestSchema = z.object({
  query: z.string().min(1, 'Query is required').max(1000),
  match_threshold: z.number().min(0).max(1).optional().default(0.0),
  match_count: z.number().int().min(1).max(50).optional().default(10),
});

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body: unknown = await request.json();
    const parseResult = requestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message ?? 'Invalid request' },
        { status: 400 }
      );
    }

    const { query, match_threshold, match_count } = parseResult.data;

    // Perform semantic search
    const results = await searchNotes(query, match_threshold, match_count);

    return NextResponse.json({ data: { results } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Search failed: ${message}` },
      { status: 500 }
    );
  }
}
