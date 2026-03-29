// POST /api/ai/photo-intake
// Accepts a base64-encoded image, runs it through Claude Vision,
// and returns extracted client registration fields as a draft JSON object.
// The client UI must present these as a draft — nothing is auto-saved.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { callClaudeVision } from '@/lib/ai/anthropic';
import { getActivePrompt } from '@/lib/ai/prompts';
import type { PhotoIntakeResult } from '@/types/database';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

const requestSchema = z.object({
  image: z.string().min(1, 'Image data is required'),
  mimeType: z.enum(ALLOWED_MIME_TYPES).default('image/jpeg'),
});

// Expected shape of Claude's JSON response
const photoIntakeResponseSchema = z.object({
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  custom_fields: z
    .object({
      household_size: z.number().nullable().optional(),
      dietary_restrictions: z.string().nullable().optional(),
      language_preference: z.string().nullable().optional(),
    })
    .optional()
    .default({}),
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

    const { image, mimeType } = parseResult.data;

    // Load system prompt from DB (with hardcoded fallback)
    const systemPrompt = await getActivePrompt('photo-intake');

    // Call Claude Vision
    const rawResponse = await callClaudeVision(
      systemPrompt,
      image,
      mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
    );

    // Strip markdown code fences if Claude wrapped the JSON
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
        {
          error:
            'Could not read the form. Please try a clearer image or enter fields manually.',
        },
        { status: 422 }
      );
    }

    const validationResult = photoIntakeResponseSchema.safeParse(parsed);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error:
            'Could not extract fields from the image. Please enter fields manually.',
        },
        { status: 422 }
      );
    }

    const result: PhotoIntakeResult = {
      first_name: validationResult.data.first_name ?? null,
      last_name: validationResult.data.last_name ?? null,
      date_of_birth: validationResult.data.date_of_birth ?? null,
      phone: validationResult.data.phone ?? null,
      email: validationResult.data.email ?? null,
      address: validationResult.data.address ?? null,
      custom_fields: {
        household_size:
          validationResult.data.custom_fields?.household_size ?? null,
        dietary_restrictions:
          validationResult.data.custom_fields?.dietary_restrictions ?? null,
        language_preference:
          validationResult.data.custom_fields?.language_preference ?? null,
      },
    };

    return NextResponse.json({ data: { fields: result } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('aborted') || message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Request timed out. Please try again.' },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: 'Photo intake failed. Please enter fields manually.' },
      { status: 500 }
    );
  }
}
