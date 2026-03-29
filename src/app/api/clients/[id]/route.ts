import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type {
  DbClient,
  DbClientUpdate,
  DbServiceEntry,
  DbUser,
  ServiceEntryWithStaff,
} from '@/types/database';

const updateClientSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  // UPDATE: Accept any key-value record for dynamic custom fields
  custom_fields: z.record(z.any()).optional(),
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

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { data: entries, error: entriesError } = await supabase
      .from('service_entries')
      .select('*')
      .eq('client_id', id)
      .order('service_date', { ascending: false });

    if (entriesError) {
      return NextResponse.json({ error: entriesError.message }, { status: 500 });
    }

    const rawEntries = (entries ?? []) as DbServiceEntry[];

    const staffIds = [
      ...new Set(
        rawEntries
          .map((e) => e.staff_id)
          .filter((sid): sid is string => sid !== null)
      ),
    ];

    let staffMap: Map<string, DbUser> = new Map();

    if (staffIds.length > 0) {
      const { data: staffRows, error: staffError } = await supabase
        .from('users')
        .select('id, full_name, role, created_at, updated_at')
        .in('id', staffIds);

      if (staffError) {
        return NextResponse.json({ error: staffError.message }, { status: 500 });
      }

      staffMap = new Map(
        (staffRows as DbUser[]).map((s) => [s.id, s])
      );
    }

    const serviceEntries: ServiceEntryWithStaff[] = rawEntries.map((entry) => ({
      ...entry,
      staff: entry.staff_id ? (staffMap.get(entry.staff_id) ?? null) : null,
    }));

    return NextResponse.json({
      data: {
        client: client as DbClient,
        service_entries: serviceEntries,
      },
    });
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
    const parsed = updateClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }

    const updateData: DbClientUpdate = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    };

    const { data: client, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !client) {
      return NextResponse.json({ error: error?.message ?? 'Client not found' }, { status: error ? 500 : 404 });
    }

    return NextResponse.json({ data: { client: client as DbClient } });
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

    const { data: roleData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const { id } = await context.params;

    const { error } = await supabase
      .from('clients')
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