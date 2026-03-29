import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { DbServiceEntry, DbServiceEntryUpdate } from '@/types/database';
import { SERVICE_TYPES } from '@/types/database';

const updateEntrySchema = z.object({
  client_id: z.string().uuid().optional(),
  service_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  service_type: z.enum(SERVICE_TYPES).optional(),
  notes: z.string().max(5000).optional().nullable(),
  staff_id: z.string().uuid().optional().nullable(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const { data: entry, error } = await supabase
      .from('service_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !entry) {
      return NextResponse.json({ error: 'Service entry not found' }, { status: 404 });
    }

    return NextResponse.json({ data: { entry: entry as DbServiceEntry } });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const body: unknown = await request.json();
    const parsed = updateEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }

    const updateData: DbServiceEntryUpdate = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    };

    const { data: entry, error } = await supabase
      .from('service_entries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !entry) {
      return NextResponse.json(
        { error: error?.message ?? 'Service entry not found' },
        { status: error ? 500 : 404 }
      );
    }

    return NextResponse.json({ data: { entry: entry as DbServiceEntry } });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const { error } = await supabase
      .from('service_entries')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { deleted: true } });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
