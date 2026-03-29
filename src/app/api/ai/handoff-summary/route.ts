// POST /api/ai/handoff-summary
// Fetches ALL service entries for a client, sends to Claude,
// and returns a structured handoff brief as a JSON draft.
// NEVER sends one client's data alongside another client's data.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { callClaude } from '@/lib/ai/anthropic';
import { getActivePrompt } from '@/lib/ai/prompts';
import type { HandoffSummaryResult } from '@/types/database';

const requestSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
});

const handoffResponseSchema = z.object({
  background: z.string(),
  services_history: z.string(),
  current_status: z.string(),
  active_needs: z.array(z.string()),
  risk_factors: z.array(z.string()),
  recommended_next_steps: z.array(z.string()),
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

    const { client_id } = parseResult.data;

    // Fetch client (this client ONLY — never mixing multiple clients)
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Fetch ALL service entries for this client only
    const { data: entries, error: entriesError } = await supabase
      .from('service_entries')
      .select('*')
      .eq('client_id', client_id)
      .order('service_date', { ascending: true });

    if (entriesError) {
      return NextResponse.json(
        { error: 'Failed to fetch service history' },
        { status: 500 }
      );
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: 'No service history found for this client' },
        { status: 422 }
      );
    }

    // Build context message — this client's data only
    const customFields = client.custom_fields as {
      household_size?: number;
      dietary_restrictions?: string;
      language_preference?: string;
    };

    const clientContext = [
      `Household Size: ${customFields.household_size ?? 'Unknown'}`,
      customFields.dietary_restrictions
        ? `Dietary Restrictions: ${customFields.dietary_restrictions}`
        : null,
      customFields.language_preference
        ? `Language: ${customFields.language_preference}`
        : null,
    ]
      .filter(Boolean)
      .join('\n');

    const serviceHistory = entries
      .map(
        (e) =>
          `Date: ${e.service_date} | Service: ${e.service_type}\n${e.notes ? `Notes: ${e.notes}` : 'Notes: (none)'}`
      )
      .join('\n---\n');

    const userMessage = `Client Information:
${clientContext}

Service History (${entries.length} visits, oldest to newest):
---
${serviceHistory}

Please generate the handoff summary JSON now.`;

    // Load system prompt
    const systemPrompt = await getActivePrompt('handoff-summary');

    // Call Claude
    const rawResponse = await callClaude(systemPrompt, userMessage, {
      maxTokens: 2048,
    });

    // Strip markdown code fences
    const cleaned = rawResponse
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    // Parse and validate Claude's JSON response
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'AI returned an invalid response. Please try again.' },
        { status: 422 }
      );
    }

    const validationResult = handoffResponseSchema.safeParse(parsed);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error:
            'AI response was incomplete. Please try again.',
        },
        { status: 422 }
      );
    }

    const summary: HandoffSummaryResult = validationResult.data;

    return NextResponse.json({ data: { summary } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('aborted') || message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Summary generation timed out. Please try again.' },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to generate summary. Please try again.' },
      { status: 500 }
    );
  }
}
