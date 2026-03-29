import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { DbPrompt, DbPromptInsert } from '@/types/database';

const createPromptSchema = z.object({
  name: z.string().min(1).max(100),
  system_prompt: z.string().min(1),
});

const updatePromptSchema = z.object({
  name: z.string().min(1).max(100),
  system_prompt: z.string().min(1),
});

async function getAdminRole(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'admin';
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (name) {
      const { data: prompt, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('name', name)
        .eq('is_active', true)
        .single();

      if (error || !prompt) {
        return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
      }

      return NextResponse.json({ data: { prompt: prompt as DbPrompt } });
    }

    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { prompts: prompts as DbPrompt[] } });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await getAdminRole(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const body: unknown = await request.json();
    const parsed = createPromptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }

    const insertData: DbPromptInsert = {
      name: parsed.data.name,
      system_prompt: parsed.data.system_prompt,
    };

    const { data: prompt, error } = await supabase
      .from('prompts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { prompt: prompt as DbPrompt } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await getAdminRole(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const body: unknown = await request.json();
    const parsed = updatePromptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }

    const { data: existing, error: fetchError } = await supabase
      .from('prompts')
      .select('version')
      .eq('name', parsed.data.name)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const { data: prompt, error } = await supabase
      .from('prompts')
      .update({
        system_prompt: parsed.data.system_prompt,
        version: existing.version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('name', parsed.data.name)
      .select()
      .single();

    if (error || !prompt) {
      return NextResponse.json(
        { error: error?.message ?? 'Failed to update prompt' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { prompt: prompt as DbPrompt } });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
