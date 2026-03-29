import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function embedText(text: string): Promise<number[]> {
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
    throw new Error(`Gemini API error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

async function embedAllNotes() {
  console.log('Fetching service entries with notes...');
  const { data: entries, error } = await supabase
    .from('service_entries')
    .select('id, notes')
    .not('notes', 'is', null)
    .neq('notes', '');

  if (error) {
    throw new Error(`Failed to fetch entries: ${error.message}`);
  }

  if (!entries || entries.length === 0) {
    console.log('No entries with notes found.');
    return;
  }

  console.log(`Found ${entries.length} entries. Embedding one at a time...\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    console.log(`[${i + 1}/${entries.length}] Entry ${entry.id}...`);

    try {
      const embedding = await embedText(entry.notes as string);

      const { error: upsertError } = await supabase
        .from('note_embeddings')
        .upsert(
          {
            service_entry_id: entry.id,
            embedding,
            content: entry.notes as string,
          },
          { onConflict: 'service_entry_id' }
        );

      if (upsertError) {
        console.log(`  [ERR] ${upsertError.message}`);
        failed++;
      } else {
        success++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      if (msg.includes('429')) {
        console.log('  Rate limited — waiting 5s and retrying...');
        await sleep(5000);
        i--; // retry
        continue;
      }
      console.log(`  [ERR] ${msg}`);
      failed++;
    }

    // Small delay between requests
    if (i < entries.length - 1) {
      await sleep(200);
    }
  }

  console.log(`\nDone! ${success} embedded, ${failed} failed out of ${entries.length}.`);
}

embedAllNotes().catch((err: unknown) => {
  console.error('Embedding failed:', err);
  process.exit(1);
});
