import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { VoyageAIClient } from 'voyageai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const voyage = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY!,
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function embedAllNotes() {
  // Step 1: Fetch all entries with notes
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

  console.log(`Found ${entries.length} entries. Embedding in 3 batches (3 RPM limit)...\n`);

  let success = 0;
  let failed = 0;

  // Batch into groups of 12-13 (3 batches for 36 entries = 1 API call each)
  const BATCH_SIZE = 13;
  const batches: typeof entries[] = [];
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    batches.push(entries.slice(i, i + BATCH_SIZE));
  }

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    const texts = batch.map((e) => (e.notes as string).replace(/\n/g, ' ').trim());

    console.log(`Batch ${b + 1}/${batches.length} (${batch.length} entries)...`);

    try {
      const response = await voyage.embed({
        input: texts,
        model: 'voyage-3-lite',
        inputType: 'document',
      });

      for (let j = 0; j < batch.length; j++) {
        const entry = batch[j];
        const embedding = response.data?.[j]?.embedding;

        if (!embedding) {
          console.log(`  [SKIP] No embedding for entry ${entry.id}`);
          failed++;
          continue;
        }

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
          console.log(`  [ERR] ${entry.id}: ${upsertError.message}`);
          failed++;
        } else {
          success++;
        }
      }

      console.log(`  Done — ${success} total embedded so far.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      if (msg.includes('429')) {
        console.log(`  Rate limited — waiting 25s and retrying...`);
        await sleep(25000);
        b--; // retry this batch
        continue;
      }
      console.log(`  [ERR] Batch failed: ${msg}`);
      failed += batch.length;
    }

    // Wait 21s between batches to stay under 3 RPM
    if (b < batches.length - 1) {
      console.log('  Waiting 21s for rate limit...');
      await sleep(21000);
    }
  }

  console.log(`\nDone! ${success} embedded, ${failed} failed out of ${entries.length}.`);
}

embedAllNotes().catch((err: unknown) => {
  console.error('Embedding failed:', err);
  process.exit(1);
});
