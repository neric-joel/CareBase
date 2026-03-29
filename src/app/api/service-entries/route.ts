import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { DbServiceEntry, DbServiceEntryInsert } from '@/types/database';
import { logAudit } from '@/lib/audit';
import { SERVICE_TYPES } from '@/types/database';

const createEntrySchema = z.object({
  client_id: z.string().uuid(),
  service_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  service_type: z.enum(SERVICE_TYPES),
  notes: z.string().max(5000).optional().nullable(),
  staff_id: z.string().uuid().optional().nullable(),
});

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
    const clientId = searchParams.get('client_id');

    if (!clientId) {
      return NextResponse.json(
        { error: 'client_id query parameter is required' },
        { status: 400 }
      );
    }

    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));

    const { data: entries, error } = await supabase
      .from('service_entries')
      .select('*')
      .eq('client_id', clientId)
      .order('service_date', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { entries: entries as DbServiceEntry[] } });
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

    const body: unknown = await request.json();
    const parsed = createEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }

    const insertData: DbServiceEntryInsert = {
      client_id: parsed.data.client_id,
      service_date: parsed.data.service_date,
      service_type: parsed.data.service_type,
      notes: parsed.data.notes ?? null,
      staff_id: parsed.data.staff_id ?? user.id,
    };

    const { data: entry, error } = await supabase
      .from('service_entries')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logAudit('create', 'service_entry', entry.id, {
      service_type: parsed.data.service_type,
      service_date: parsed.data.service_date,
    }).catch(() => {});

    return NextResponse.json({ data: { entry: entry as DbServiceEntry } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
