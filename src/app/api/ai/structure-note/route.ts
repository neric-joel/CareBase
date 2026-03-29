// POST /api/ai/structure-note
// Takes a raw transcript from voice recording and returns structured case note fields.
// Audio is never stored — only the transcript is processed.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { callClaude } from '@/lib/ai/anthropic';
import { SERVICE_TYPES } from '@/types/database';

const requestSchema = z.object({
  transcript: z.string().min(10, 'Transcript too short').max(10000),
  client_name: z.string().optional(),
});

const SYSTEM_PROMPT = `You are a case management assistant for a nonprofit food & clothing bank called CareBase.

A case manager has just finished a session and dictated their notes via voice. Your job is to structure the raw transcript into a well-organized case note.

Available service types: ${SERVICE_TYPES.join(', ')}

Return a JSON object with these fields:
{
  "service_type": "one of the available service types that best matches",
  "summary": "2-4 sentence structured summary of the visit (professional tone, third person)",
  "action_items": ["follow-up action 1", "follow-up action 2"],
  "mood_assessment": "brief assessment of client's emotional state/mood if mentioned",
  "risk_flags": ["any risk factors identified, e.g. housing instability, food insecurity"],
  "suggested_followup_date": "YYYY-MM-DD or null if not mentioned",
  "full_note": "Complete, well-written case note suitable for the record (3-6 sentences, professional)"
}

Rules:
- Use professional, empathetic language
- Do not invent information not in the transcript
- If a field has no relevant information, use an empty array or null
- The full_note should be the primary output — a clean, readable case note
- Detect the most appropriate service_type from the transcript context
- Return ONLY valid JSON, no markdown fences`;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }

    const { transcript, client_name } = parsed.data;

    const userMessage = client_name
      ? `Client: ${client_name}\n\nVoice transcript:\n${transcript}`
      : `Voice transcript:\n${transcript}`;

    const responseText = await callClaude(SYSTEM_PROMPT, userMessage, {
      maxTokens: 1024,
      temperature: 0.3,
    });

    // Parse the JSON response from Claude
    const cleaned = responseText.replace(/```json\n?|\n?```/g, '').trim();
    const structured = JSON.parse(cleaned);

    return NextResponse.json({ data: structured });
  } catch (err) {
    console.error('Structure note error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to structure note' },
      { status: 500 }
    );
  }
}
