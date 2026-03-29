// POST /api/ai/embed
// Generates a Voyage AI voyage-3-lite vector for a service entry note
// and stores it in the note_embeddings table.
// Called automatically by the frontend after saving a service entry with notes.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/ai/embeddings';

const requestSchema = z.object({
  text: z.string().min(1, 'Text is required').max(8000),
  service_entry_id: z.string().uuid('Invalid service entry ID'),
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

    const { text, service_entry_id } = parseResult.data;

    // Verify the service entry exists and belongs to this user's accessible data
    const { data: entry, error: entryError } = await supabase
      .from('service_entries')
      .select('id')
      .eq('id', service_entry_id)
      .single();

    if (entryError || !entry) {
      return NextResponse.json(
        { error: 'Service entry not found' },
        { status: 404 }
      );
    }

    // Generate embedding
    const embedding = await generateEmbedding(text);

    // Upsert into note_embeddings (one embedding per service entry)
    const { data: noteEmbedding, error: upsertError } = await supabase
      .from('note_embeddings')
      .upsert(
        {
          service_entry_id,
          embedding,
          content: text,
        },
        { onConflict: 'service_entry_id' }
      )
      .select()
      .single();

    if (upsertError) {
      return NextResponse.json(
        { error: 'Failed to store embedding' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { id: noteEmbedding.id } });
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate embedding' },
      { status: 500 }
    );
  }
}
