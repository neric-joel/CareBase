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
import { logAudit } from '@/lib/audit';

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
      const { data: staffRows } = await supabase
        .from('app_users')
        .select('id, full_name, role, created_at, updated_at')
        .in('id', staffIds);

      if (staffRows) {
        staffMap = new Map(
          (staffRows as DbUser[]).map((s) => [s.id, s])
        );
      }
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

    // Fetch current client data before update for audit trail
    const { data: existingClient } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    const { data: client, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !client) {
      return NextResponse.json({ error: error?.message ?? 'Client not found' }, { status: error ? 500 : 404 });
    }

    // Build audit details: track changed fields, but exclude PII values
    const PII_FIELDS = ['first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'address'];
    const auditDetails: Record<string, unknown> = {};
    const changedFields: string[] = [];

    if (existingClient) {
      const oldData = existingClient as Record<string, unknown>;
      const newData = client as Record<string, unknown>;

      for (const key of Object.keys(parsed.data)) {
        if (key === 'custom_fields') {
          const oldCf = (oldData.custom_fields ?? {}) as Record<string, unknown>;
          const newCf = (newData.custom_fields ?? {}) as Record<string, unknown>;
          const cfChanges: Record<string, { before: unknown; after: unknown }> = {};
          const allCfKeys = new Set([...Object.keys(oldCf), ...Object.keys(newCf)]);
          for (const cfKey of allCfKeys) {
            if (JSON.stringify(oldCf[cfKey]) !== JSON.stringify(newCf[cfKey])) {
              cfChanges[cfKey] = { before: oldCf[cfKey] ?? null, after: newCf[cfKey] ?? null };
            }
          }
          if (Object.keys(cfChanges).length > 0) {
            changedFields.push('custom_fields');
            auditDetails.custom_fields_changes = cfChanges;
          }
        } else if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
          changedFields.push(key);
          if (!PII_FIELDS.includes(key)) {
            auditDetails[key] = { before: oldData[key] ?? null, after: newData[key] ?? null };
          }
        }
      }
    }

    auditDetails.changed_fields = changedFields;

    logAudit('update', 'client', id, auditDetails as Record<string, import('@/types/supabase').Json | undefined>).catch(() => {});

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
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = roleData?.role === 'admin' || user.user_metadata?.role === 'admin';
    if (!isAdmin) {
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

    logAudit('delete', 'client', id).catch(() => {});

    return NextResponse.json({ data: { deleted: true } });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}